package user

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) GetByID(ctx context.Context, userID string) (*ProfileResponse, error) {
	var p ProfileResponse
	err := r.db.QueryRow(ctx,
		`SELECT u.id, u.name, u.email, COALESCE(u.agency_name, ''), COALESCE(u.logo_url, ''),
  COALESCE(u.brand_color, '#AAFF45'), COALESCE(u.pdf_footer_text, ''),
  COALESCE(u.license_number, ''), COALESCE(u.state, ''),
  u.email_verified, s.plan, s.status, u.created_at::text
  FROM users u
  LEFT JOIN subscriptions s ON s.user_id = u.id
  WHERE u.id = $1`,
		userID,
	).Scan(&p.ID, &p.Name, &p.Email, &p.AgencyName, &p.LogoURL,
		&p.BrandColor, &p.PDFFooterText, &p.LicenseNumber, &p.State,
		&p.EmailVerified, &p.Plan, &p.PlanStatus, &p.CreatedAt)
	return &p, err
}

func (r *Repository) UpdateProfile(ctx context.Context, userID string, req UpdateProfileRequest) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET name = COALESCE(NULLIF($1, ''), name),
                agency_name = COALESCE(NULLIF($2, ''), agency_name),
                license_number = COALESCE(NULLIF($3, ''), license_number),
                state = COALESCE(NULLIF($4, ''), state),
                updated_at = NOW()
                WHERE id = $5`,
		req.Name, req.AgencyName, req.LicenseNumber, req.State, userID,
	)
	return err
}

func (r *Repository) UpdateBranding(ctx context.Context, userID string, req UpdateBrandingRequest) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET brand_color = COALESCE(NULLIF($1, ''), brand_color),
                pdf_footer_text = COALESCE(NULLIF($2, ''), pdf_footer_text),
                updated_at = NOW()
                WHERE id = $3`,
		req.BrandColor, req.PDFFooterText, userID,
	)
	return err
}

func (r *Repository) UpdateDefaults(ctx context.Context, userID string, req UpdateDefaultsRequest) error {
	contingencies, _ := json.Marshal(req.DefaultContingencies)
	_, err := r.db.Exec(ctx,
		`UPDATE users SET default_contingencies = $1,
                default_closing_days = CASE WHEN $2 > 0 THEN $2 ELSE default_closing_days END,
                cover_letter_tone = COALESCE(NULLIF($3, ''), cover_letter_tone),
                default_earnest_money_pct = CASE WHEN $4 > 0 THEN $4 ELSE default_earnest_money_pct END,
                updated_at = NOW()
                WHERE id = $5`,
		contingencies, req.DefaultClosingDays, req.CoverLetterTone, req.DefaultEarnestMoneyPct, userID,
	)
	return err
}

func (r *Repository) UpdatePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	var hash string
	err := r.db.QueryRow(ctx,
		`SELECT password_hash FROM users WHERE id = $1`, userID,
	).Scan(&hash)
	if err != nil {
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(currentPassword)); err != nil {
		return ErrWrongPassword
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx,
		`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
		string(newHash), userID,
	)
	return err
}

func (r *Repository) UpdateLogoURL(ctx context.Context, userID, url string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET logo_url = $1, updated_at = NOW() WHERE id = $2`,
		url, userID,
	)
	return err
}

var ErrWrongPassword = errWrongPassword("wrong password")

type errWrongPassword string

func (e errWrongPassword) Error() string { return string(e) }
