package user

import (
	"context"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetProfile(ctx context.Context, userID string) (*ProfileResponse, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *Service) UpdateProfile(ctx context.Context, userID string, req UpdateProfileRequest) (*ProfileResponse, error) {
	if err := s.repo.UpdateProfile(ctx, userID, req); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, userID)
}

func (s *Service) UpdateBranding(ctx context.Context, userID string, req UpdateBrandingRequest) (*ProfileResponse, error) {
	if err := s.repo.UpdateBranding(ctx, userID, req); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, userID)
}

func (s *Service) UpdateDefaults(ctx context.Context, userID string, req UpdateDefaultsRequest) (*ProfileResponse, error) {
	if err := s.repo.UpdateDefaults(ctx, userID, req); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, userID)
}

func (s *Service) ChangePassword(ctx context.Context, userID string, req ChangePasswordRequest) error {
	return s.repo.UpdatePassword(ctx, userID, req.CurrentPassword, req.NewPassword)
}
