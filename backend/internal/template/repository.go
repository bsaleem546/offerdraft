package template

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

var ErrNotFound = errors.New("template not found")
var ErrLimitReached = errors.New("template limit reached")

func (r *Repository) CountByUser(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM templates WHERE user_id = $1`, userID).Scan(&count)
	return count, err
}

func (r *Repository) checkLimit(ctx context.Context, userID string) error {
	var plan string
	r.db.QueryRow(ctx, `SELECT plan FROM subscriptions WHERE user_id = $1`, userID).Scan(&plan)
	if plan == "team" {
		return nil
	}
	count, err := r.CountByUser(ctx, userID)
	if err != nil {
		return err
	}
	if count >= 3 {
		return ErrLimitReached
	}
	return nil
}

func (r *Repository) scan(row interface{ Scan(dest ...any) error }) (*Template, error) {
	var t Template
	var contingenciesRaw []byte
	err := row.Scan(&t.ID, &t.UserID, &t.Name, &t.LoanType, &t.ClosingDays,
		&contingenciesRaw, &t.CoverLetterTone, &t.DefaultTerms, &t.LastUsedAt,
		&t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if contingenciesRaw != nil {
		json.Unmarshal(contingenciesRaw, &t.Contingencies)
	}
	if t.Contingencies == nil {
		t.Contingencies = []string{}
	}
	return &t, nil
}

const fields = `id, user_id, name, loan_type, closing_days, contingencies, cover_letter_tone, default_terms, last_used_at::text, created_at, updated_at`

func (r *Repository) Create(ctx context.Context, userID string, req CreateTemplateRequest) (*Template, error) {
	if err := r.checkLimit(ctx, userID); err != nil {
		return nil, err
	}
	contingencies, _ := json.Marshal(req.Contingencies)
	if req.Contingencies == nil {
		contingencies = []byte("[]")
	}
	row := r.db.QueryRow(ctx,
		`INSERT INTO templates (user_id, name, loan_type, closing_days, contingencies, cover_letter_tone, default_terms)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING `+fields,
		userID, req.Name, req.LoanType, req.ClosingDays, contingencies, req.CoverLetterTone, req.DefaultTerms,
	)
	return r.scan(row)
}

func (r *Repository) List(ctx context.Context, userID string) ([]Template, error) {
	rows, err := r.db.Query(ctx, `SELECT `+fields+` FROM templates WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var templates []Template
	for rows.Next() {
		t, err := r.scan(rows)
		if err != nil {
			continue
		}
		templates = append(templates, *t)
	}
	if templates == nil {
		templates = []Template{}
	}
	return templates, nil
}

func (r *Repository) GetByID(ctx context.Context, templateID, userID string) (*Template, error) {
	row := r.db.QueryRow(ctx, `SELECT `+fields+` FROM templates WHERE id = $1 AND user_id = $2`, templateID, userID)
	t, err := r.scan(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return t, nil
}

func (r *Repository) Update(ctx context.Context, templateID, userID string, req UpdateTemplateRequest) (*Template, error) {
	contingencies, _ := json.Marshal(req.Contingencies)
	if req.Contingencies == nil {
		contingencies = []byte("[]")
	}
	row := r.db.QueryRow(ctx,
		`UPDATE templates SET
		name = COALESCE(NULLIF($1,''), name),
		loan_type = COALESCE(NULLIF($2,''), loan_type),
		closing_days = CASE WHEN $3 > 0 THEN $3 ELSE closing_days END,
		contingencies = $4,
		cover_letter_tone = COALESCE(NULLIF($5,''), cover_letter_tone),
		default_terms = COALESCE(NULLIF($6,''), default_terms),
		updated_at = NOW()
		WHERE id = $7 AND user_id = $8 RETURNING `+fields,
		req.Name, req.LoanType, req.ClosingDays, contingencies, req.CoverLetterTone, req.DefaultTerms,
		templateID, userID,
	)
	t, err := r.scan(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return t, nil
}

func (r *Repository) Delete(ctx context.Context, templateID, userID string) error {
	result, err := r.db.Exec(ctx, `DELETE FROM templates WHERE id = $1 AND user_id = $2`, templateID, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
