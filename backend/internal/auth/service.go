package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/bsaleem546/offerdraft-api/pkg/config"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repository
	cfg  *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
	return &Service{repo: repo, cfg: cfg}
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
