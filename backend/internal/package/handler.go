package pkg

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/bsaleem546/offerdraft-api/internal/auth"
	"github.com/bsaleem546/offerdraft-api/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
)

type Handler struct {
	service  *Service
	validate *validator.Validate
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service, validate: validator.New()}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	var req CreatePackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	p, err := h.service.Create(r.Context(), userID, req)
	if err != nil {
		if err == ErrLimitExceeded {
			response.Error(w, http.StatusTooManyRequests, "monthly package limit reached, upgrade to Team plan")
			return
		}
		response.Error(w, http.StatusInternalServerError, "failed to create package")
		return
	}
	response.JSON(w, http.StatusCreated, p)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	status := r.URL.Query().Get("status")
	sort := r.URL.Query().Get("sort")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	packages, total, err := h.service.List(r.Context(), userID, status, sort, page, limit)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to list packages")
		return
	}
	response.JSON(w, http.StatusOK, ListPackagesResponse{
		Packages: packages,
		Total:    total,
		Page:     page,
		Limit:    limit,
	})
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")
	p, err := h.service.GetByID(r.Context(), packageID, userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "package not found")
		return
	}
	response.JSON(w, http.StatusOK, p)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")
	var req UpdatePackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	p, err := h.service.Update(r.Context(), packageID, userID, req)
	if err != nil {
		if err == ErrNotFound {
			response.Error(w, http.StatusNotFound, "package not found")
			return
		}
		if err == ErrNotDraft {
			response.Error(w, http.StatusBadRequest, "only draft packages can be edited")
			return
		}
		response.Error(w, http.StatusInternalServerError, "failed to update package")
		return
	}
	response.JSON(w, http.StatusOK, p)
}

func (h *Handler) UpdateCoverLetter(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")
	var body struct {
		Text string `json:"text" validate:"required"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(body); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	p, err := h.service.UpdateCoverLetter(r.Context(), packageID, userID, body.Text)
	if err != nil {
		response.Error(w, http.StatusNotFound, "package not found")
		return
	}
	response.JSON(w, http.StatusOK, p)
}

func (h *Handler) MarkComplete(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")
	p, err := h.service.MarkComplete(r.Context(), packageID, userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "package not found")
		return
	}
	response.JSON(w, http.StatusOK, p)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")
	if err := h.service.Delete(r.Context(), packageID, userID); err != nil {
		response.Error(w, http.StatusNotFound, "package not found")
		return
	}
	response.Message(w, http.StatusOK, "package deleted")
}

func (h *Handler) Duplicate(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	packageID := chi.URLParam(r, "id")
	p, err := h.service.Duplicate(r.Context(), packageID, userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "package not found")
		return
	}
	response.JSON(w, http.StatusCreated, p)
}
