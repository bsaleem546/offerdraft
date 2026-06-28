package pkg

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, userID string, req CreatePackageRequest) (*Package, error) {
	return s.repo.Create(ctx, userID, req)
}

func (s *Service) GetByID(ctx context.Context, packageID, userID string) (*Package, error) {
	return s.repo.GetByID(ctx, packageID, userID)
}

func (s *Service) List(ctx context.Context, userID, status, sort string, page, limit int) ([]Package, int, error) {
	return s.repo.List(ctx, userID, status, sort, page, limit)
}

func (s *Service) Update(ctx context.Context, packageID, userID string, req UpdatePackageRequest) (*Package, error) {
	return s.repo.Update(ctx, packageID, userID, req)
}

func (s *Service) UpdateCoverLetter(ctx context.Context, packageID, userID, text string) (*Package, error) {
	return s.repo.UpdateCoverLetter(ctx, packageID, userID, text)
}

func (s *Service) MarkComplete(ctx context.Context, packageID, userID string) (*Package, error) {
	return s.repo.MarkComplete(ctx, packageID, userID)
}

func (s *Service) Delete(ctx context.Context, packageID, userID string) error {
	return s.repo.Delete(ctx, packageID, userID)
}

func (s *Service) Duplicate(ctx context.Context, packageID, userID string) (*Package, error) {
	return s.repo.Duplicate(ctx, packageID, userID)
}

func (s *Service) SaveAIContent(ctx context.Context, packageID, userID, coverLetter, offerSummary string) (*Package, error) {
	return s.repo.SaveAIContent(ctx, packageID, userID, coverLetter, offerSummary)
}
