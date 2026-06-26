package auth

import (
	"encoding/json"
	"net/http"

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

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	tokens, err := h.service.Register(r.Context(), req)
	if err != nil {
		switch err {
		case ErrEmailExists:
			response.Error(w, http.StatusConflict, "email already registered")
		default:
			response.Error(w, http.StatusInternalServerError, "registration failed")
		}
		return
	}

	response.JSON(w, http.StatusCreated, tokens)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.Error(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	tokens, err := h.service.Login(r.Context(), req)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	response.JSON(w, http.StatusOK, tokens)
}

func (h *Handler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		response.Error(w, http.StatusBadRequest, "token is required")
		return
	}

	if err := h.service.VerifyEmail(r.Context(), token); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid or expired token")
		return
	}

	response.Message(w, http.StatusOK, "email verified successfully")
}
