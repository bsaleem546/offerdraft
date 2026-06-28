package template

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, userID string, req CreateTemplateRequest) (*Template, error) {
	return s.repo.Create(ctx, userID, req)
}

func (s *Service) List(ctx context.Context, userID string) ([]Template, error) {
	return s.repo.List(ctx, userID)
}

func (s *Service) GetByID(ctx context.Context, templateID, userID string) (*Template, error) {
	return s.repo.GetByID(ctx, templateID, userID)
}

func (s *Service) Update(ctx context.Context, templateID, userID string, req UpdateTemplateRequest) (*Template, error) {
	return s.repo.Update(ctx, templateID, userID, req)
}

func (s *Service) Delete(ctx context.Context, templateID, userID string) error {
	return s.repo.Delete(ctx, templateID, userID)
}
