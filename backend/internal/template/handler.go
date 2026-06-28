package template

import (
	"encoding/json"
	"net/http"

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
	var req CreateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	t, err := h.service.Create(r.Context(), userID, req)
	if err != nil {
		if err == ErrLimitReached {
			response.Error(w, http.StatusForbidden, "template limit reached, upgrade to Team plan for unlimited templates")
			return
		}
		response.Error(w, http.StatusInternalServerError, "failed to create template")
		return
	}
	response.JSON(w, http.StatusCreated, t)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	templates, err := h.service.List(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to list templates")
		return
	}
	response.JSON(w, http.StatusOK, templates)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	templateID := chi.URLParam(r, "id")
	t, err := h.service.GetByID(r.Context(), templateID, userID)
	if err != nil {
		response.Error(w, http.StatusNotFound, "template not found")
		return
	}
	response.JSON(w, http.StatusOK, t)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	templateID := chi.URLParam(r, "id")
	var req UpdateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	t, err := h.service.Update(r.Context(), templateID, userID, req)
	if err != nil {
		response.Error(w, http.StatusNotFound, "template not found")
		return
	}
	response.JSON(w, http.StatusOK, t)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	templateID := chi.URLParam(r, "id")
	if err := h.service.Delete(r.Context(), templateID, userID); err != nil {
		response.Error(w, http.StatusNotFound, "template not found")
		return
	}
	response.Message(w, http.StatusOK, "template deleted")
}
