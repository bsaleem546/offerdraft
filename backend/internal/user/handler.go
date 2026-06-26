package user

import (
	"encoding/json"
	"net/http"

	"github.com/bsaleem546/offerdraft-api/internal/auth"
	"github.com/bsaleem546/offerdraft-api/pkg/response"
	"github.com/go-playground/validator/v10"
)

type Handler struct {
	service  *Service
	validate *validator.Validate
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service, validate: validator.New()}
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	profile, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to get profile")
		return
	}
	response.JSON(w, http.StatusOK, profile)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	profile, err := h.service.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to update profile")
		return
	}
	response.JSON(w, http.StatusOK, profile)
}

func (h *Handler) UpdateBranding(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	var req UpdateBrandingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	profile, err := h.service.UpdateBranding(r.Context(), userID, req)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to update branding")
		return
	}
	response.JSON(w, http.StatusOK, profile)
}

func (h *Handler) UpdateDefaults(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	var req UpdateDefaultsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	profile, err := h.service.UpdateDefaults(r.Context(), userID, req)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to update defaults")
		return
	}
	response.JSON(w, http.StatusOK, profile)
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	if err := h.service.ChangePassword(r.Context(), userID, req); err != nil {
		if err == ErrWrongPassword {
			response.Error(w, http.StatusBadRequest, "current password is incorrect")
			return
		}
		response.Error(w, http.StatusInternalServerError, "failed to change password")
		return
	}
	response.Message(w, http.StatusOK, "password changed successfully")
}
