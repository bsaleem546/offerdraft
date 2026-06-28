package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/bsaleem546/offerdraft-api/internal/email"
	"github.com/bsaleem546/offerdraft-api/pkg/config"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo        *Repository
	cfg         *config.Config
	emailClient *email.Client
}

func NewService(repo *Repository, cfg *config.Config, emailClient *email.Client) *Service {
	return &Service{repo: repo, cfg: cfg, emailClient: emailClient}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*TokenPair, error) {
	exists, err := s.repo.EmailExists(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	verifyToken := generateToken()

	userID, err := s.repo.CreateUser(ctx, req.Name, req.Email, string(hash), verifyToken, req.Plan)
	if err != nil {
		return nil, err
	}

	plan := req.Plan
	if plan == "" {
		plan = "solo"
	}
	if err := s.repo.CreateSubscription(ctx, userID, plan); err != nil {
		return nil, err
	}

	verifyURL := s.cfg.FrontendURL + "/verify-email?token=" + verifyToken
	go s.emailClient.Send(ctx, req.Email, "Verify your OfferDraft email", email.VerificationEmail(req.Name, verifyURL))

	return s.issueTokens(userID, req.Email)
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*TokenPair, error) {
	userID, hash, emailVerified, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	_ = emailVerified

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.issueTokens(userID, req.Email)
}

func (s *Service) VerifyEmail(ctx context.Context, token string) error {
	return s.repo.VerifyEmail(ctx, token)
}

func (s *Service) ForgotPassword(ctx context.Context, emailAddr string) error {
	token := generateToken()
	expiresAt := time.Now().Add(time.Hour)
	if err := s.repo.SetResetToken(ctx, emailAddr, token, expiresAt); err != nil {
		return nil // silently fail — don't leak if email exists
	}
	name, _ := s.repo.GetNameByEmail(ctx, emailAddr)
	resetURL := s.cfg.FrontendURL + "/reset-password?token=" + token
	go s.emailClient.Send(ctx, emailAddr, "Reset your OfferDraft password", email.PasswordResetEmail(name, resetURL))
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	userID, expiresAt, err := s.repo.GetUserForReset(ctx, token)
	if err != nil {
		return ErrInvalidToken
	}
	if time.Now().After(expiresAt) {
		return ErrInvalidToken
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return s.repo.ResetPassword(ctx, userID, string(hash))
}

func (s *Service) issueTokens(userID, email string) (*TokenPair, error) {
	access, err := GenerateAccessToken(userID, email, s.cfg.JWTAccessSecret, s.cfg.JWTAccessExpiryMinutes)
	if err != nil {
		return nil, err
	}
	refresh, err := GenerateRefreshToken(userID, s.cfg.JWTRefreshSecret, s.cfg.JWTRefreshExpiryDays)
	if err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: access, RefreshToken: refresh}, nil
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

var ErrInvalidCredentials = errors.New("invalid email or password")
