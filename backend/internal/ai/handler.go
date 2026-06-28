package ai

import (
	"fmt"
	"log"
	"net/http"

	"github.com/bsaleem546/offerdraft-api/internal/auth"
	pkg "github.com/bsaleem546/offerdraft-api/internal/package"
	"github.com/bsaleem546/offerdraft-api/pkg/response"
	"github.com/go-chi/chi/v5"
)

type GenerateHandler struct {
	client      *Client
	packageRepo *pkg.Repository
}

func NewGenerateHandler(client *Client, packageRepo *pkg.Repository) *GenerateHandler {
	return &GenerateHandler{client: client, packageRepo: packageRepo}
}

func (h *GenerateHandler) Generate(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")

	p, err := h.packageRepo.GetByID(r.Context(), packageID, userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "package not found")
		return
	}
	if p.Status != "draft" {
		response.Error(w, http.StatusBadRequest, "can only generate for draft packages")
		return
	}

	listingPrice := ""
	if p.ListingPrice != nil {
		listingPrice = fmt.Sprintf("$%.2f", *p.ListingPrice)
	}

	coverLetter, err := h.client.Complete(r.Context(),
		CoverLetterSystem("professional"),
		CoverLetterPrompt(p.PropertyAddress, listingPrice,
			fmt.Sprintf("$%.2f", p.OfferAmount), p.LoanType, p.ClosingDate,
			p.BuyerName, p.BuyerStory, p.NotableFeatures),
		600,
	)
	if err != nil {
		log.Printf("AI cover letter error: %v", err)
		response.Error(w, http.StatusServiceUnavailable, "AI generation failed, please try again")
		return
	}

	offerSummary, err := h.client.Complete(r.Context(),
		OfferSummarySystem(),
		OfferSummaryPrompt(p.PropertyAddress, fmt.Sprintf("$%.2f", p.OfferAmount),
			p.LoanType, p.ClosingDate, p.Contingencies),
		200,
	)
	if err != nil {
		log.Printf("AI offer summary error: %v", err)
		response.Error(w, http.StatusServiceUnavailable, "AI generation failed, please try again")
		return
	}

	updated, err := h.packageRepo.SaveAIContent(r.Context(), packageID, userID, coverLetter, offerSummary)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to save generated content")
		return
	}
	response.JSON(w, http.StatusOK, updated)
}
