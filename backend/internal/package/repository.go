package pkg

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

var ErrNotFound = errors.New("package not found")
var ErrNotDraft = errors.New("only draft packages can be edited")
var ErrLimitExceeded = errors.New("monthly package limit exceeded")

func (r *Repository) CountThisMonth(ctx context.Context, userID string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM offer_packages WHERE user_id = $1 AND date_trunc('month', created_at) = date_trunc('month', NOW())`,
		userID,
	).Scan(&count)
	return count, err
}

func (r *Repository) checkPackageLimit(ctx context.Context, userID string) error {
	var plan, status string
	err := r.db.QueryRow(ctx,
		`SELECT plan, status FROM subscriptions WHERE user_id = $1`,
		userID,
	).Scan(&plan, &status)
	if err != nil {
		return err
	}
	if plan == "team" {
		return nil
	}
	count, err := r.CountThisMonth(ctx, userID)
	if err != nil {
		return err
	}
	if count >= 30 {
		return ErrLimitExceeded
	}
	return nil
}

func (r *Repository) scanPackage(row interface {
	Scan(dest ...any) error
}) (*Package, error) {
	var p Package
	var contingenciesRaw []byte
	var closingDate *time.Time
	err := row.Scan(
		&p.ID, &p.UserID, &p.Status, &p.PropertyAddress,
		&p.ListingPrice, &p.PropertyType, &p.MLSNumber,
		&p.Bedrooms, &p.Bathrooms, &p.YearBuilt, &p.NotableFeatures,
		&p.OfferAmount, &p.EarnestMoney, &p.DownPaymentPct, &p.LoanType,
		&closingDate, &contingenciesRaw,
		&p.EscalationActive, &p.EscalationMaxPrice, &p.EscalationIncrement,
		&p.AdditionalTerms, &p.BuyerName, &p.BuyerStory,
		&p.CoverLetterText, &p.OfferSummaryText, &p.CompletedAt,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if closingDate != nil {
		p.ClosingDate = closingDate.Format("2006-01-02")
	}
	if contingenciesRaw != nil {
		json.Unmarshal(contingenciesRaw, &p.Contingencies)
	}
	if p.Contingencies == nil {
		p.Contingencies = []string{}
	}
	return &p, nil
}

const packageFields = `id, user_id, status, property_address,
	listing_price, property_type, mls_number,
	bedrooms, bathrooms, year_built, notable_features,
	offer_amount, earnest_money, down_payment_pct, loan_type,
	closing_date, contingencies,
	escalation_active, escalation_max_price, escalation_increment,
	additional_terms, buyer_name, buyer_story,
	cover_letter_text, offer_summary_text, completed_at::text,
	created_at, updated_at`

func (r *Repository) Create(ctx context.Context, userID string, req CreatePackageRequest) (*Package, error) {
	if err := r.checkPackageLimit(ctx, userID); err != nil {
		return nil, err
	}
	contingencies, _ := json.Marshal(req.Contingencies)
	if req.Contingencies == nil {
		contingencies = []byte("[]")
	}
	row := r.db.QueryRow(ctx,
		`INSERT INTO offer_packages (user_id, property_address, listing_price, property_type, mls_number,
		bedrooms, bathrooms, year_built, notable_features, offer_amount, earnest_money, down_payment_pct,
		loan_type, closing_date, contingencies, additional_terms, buyer_name, buyer_story)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::date,$15,$16,$17,$18)
		RETURNING `+packageFields,
		userID, req.PropertyAddress, req.ListingPrice, req.PropertyType, req.MLSNumber,
		req.Bedrooms, req.Bathrooms, req.YearBuilt, req.NotableFeatures, req.OfferAmount,
		req.EarnestMoney, req.DownPaymentPct, req.LoanType, nilIfEmpty(req.ClosingDate),
		contingencies, req.AdditionalTerms, req.BuyerName, req.BuyerStory,
	)
	return r.scanPackage(row)
}

func (r *Repository) GetByID(ctx context.Context, packageID, userID string) (*Package, error) {
	row := r.db.QueryRow(ctx,
		`SELECT `+packageFields+` FROM offer_packages WHERE id = $1 AND user_id = $2`,
		packageID, userID,
	)
	p, err := r.scanPackage(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return p, nil
}

func (r *Repository) List(ctx context.Context, userID, status, sort string, page, limit int) ([]Package, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	whereStatus := ""
	args := []interface{}{userID}
	if status != "" {
		args = append(args, status)
		whereStatus = " AND status = $2"
	}

	var total int
	r.db.QueryRow(ctx, `SELECT COUNT(*) FROM offer_packages WHERE user_id = $1`+whereStatus, args...).Scan(&total)

	orderBy := "created_at DESC"
	if sort == "oldest" {
		orderBy = "created_at ASC"
	} else if sort == "amount_desc" {
		orderBy = "offer_amount DESC"
	}

	limitArg := len(args) + 1
	offsetArg := len(args) + 2
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx,
		`SELECT `+packageFields+` FROM offer_packages WHERE user_id = $1`+whereStatus+
			` ORDER BY `+orderBy+` LIMIT $`+strconv.Itoa(limitArg)+` OFFSET $`+strconv.Itoa(offsetArg),
		args...,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var packages []Package
	for rows.Next() {
		p, err := r.scanPackage(rows)
		if err != nil {
			continue
		}
		packages = append(packages, *p)
	}
	if packages == nil {
		packages = []Package{}
	}
	return packages, total, nil
}

func (r *Repository) Update(ctx context.Context, packageID, userID string, req UpdatePackageRequest) (*Package, error) {
	p, err := r.GetByID(ctx, packageID, userID)
	if err != nil {
		return nil, ErrNotFound
	}
	if p.Status != "draft" {
		return nil, ErrNotDraft
	}
	contingencies, _ := json.Marshal(req.Contingencies)
	if req.Contingencies == nil {
		contingencies = []byte("[]")
	}
	offerAmount := p.OfferAmount
	if req.OfferAmount != nil {
		offerAmount = *req.OfferAmount
	}
	row := r.db.QueryRow(ctx,
		`UPDATE offer_packages SET
		property_address = COALESCE(NULLIF($1,''), property_address),
		offer_amount = $2,
		listing_price = COALESCE($3, listing_price),
		property_type = COALESCE(NULLIF($4,''), property_type),
		mls_number = COALESCE(NULLIF($5,''), mls_number),
		bedrooms = COALESCE($6, bedrooms),
		bathrooms = COALESCE($7, bathrooms),
		year_built = COALESCE($8, year_built),
		notable_features = COALESCE(NULLIF($9,''), notable_features),
		earnest_money = COALESCE($10, earnest_money),
		down_payment_pct = COALESCE($11, down_payment_pct),
		loan_type = COALESCE(NULLIF($12,''), loan_type),
		closing_date = COALESCE($13::date, closing_date),
		contingencies = $14,
		additional_terms = COALESCE(NULLIF($15,''), additional_terms),
		buyer_name = COALESCE(NULLIF($16,''), buyer_name),
		buyer_story = COALESCE(NULLIF($17,''), buyer_story),
		updated_at = NOW()
		WHERE id = $18 AND user_id = $19
		RETURNING `+packageFields,
		req.PropertyAddress, offerAmount, req.ListingPrice, req.PropertyType, req.MLSNumber,
		req.Bedrooms, req.Bathrooms, req.YearBuilt, req.NotableFeatures,
		req.EarnestMoney, req.DownPaymentPct, req.LoanType, nilIfEmpty(req.ClosingDate),
		contingencies, req.AdditionalTerms, req.BuyerName, req.BuyerStory,
		packageID, userID,
	)
	return r.scanPackage(row)
}

func (r *Repository) UpdateCoverLetter(ctx context.Context, packageID, userID, text string) (*Package, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE offer_packages SET cover_letter_text = $1, updated_at = NOW()
		WHERE id = $2 AND user_id = $3 RETURNING `+packageFields,
		text, packageID, userID,
	)
	p, err := r.scanPackage(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return p, nil
}

func (r *Repository) SaveAIContent(ctx context.Context, packageID, userID, coverLetter, offerSummary string) (*Package, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE offer_packages SET cover_letter_text = $1, offer_summary_text = $2, updated_at = NOW()
		WHERE id = $3 AND user_id = $4 RETURNING `+packageFields,
		coverLetter, offerSummary, packageID, userID,
	)
	p, err := r.scanPackage(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return p, nil
}

func (r *Repository) MarkComplete(ctx context.Context, packageID, userID string) (*Package, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE offer_packages SET status = 'complete', completed_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND user_id = $2 RETURNING `+packageFields,
		packageID, userID,
	)
	p, err := r.scanPackage(row)
	if err != nil {
		return nil, ErrNotFound
	}
	return p, nil
}

func (r *Repository) Delete(ctx context.Context, packageID, userID string) error {
	result, err := r.db.Exec(ctx,
		`DELETE FROM offer_packages WHERE id = $1 AND user_id = $2`,
		packageID, userID,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) Duplicate(ctx context.Context, packageID, userID string) (*Package, error) {
	p, err := r.GetByID(ctx, packageID, userID)
	if err != nil {
		return nil, ErrNotFound
	}
	contingencies, _ := json.Marshal(p.Contingencies)
	row := r.db.QueryRow(ctx,
		`INSERT INTO offer_packages (user_id, property_address, listing_price, property_type, mls_number,
		bedrooms, bathrooms, year_built, notable_features, offer_amount, earnest_money, down_payment_pct,
		loan_type, closing_date, contingencies, additional_terms, buyer_name, buyer_story, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::date,$15,$16,$17,$18,'draft')
		RETURNING `+packageFields,
		userID, p.PropertyAddress, p.ListingPrice, p.PropertyType, p.MLSNumber,
		p.Bedrooms, p.Bathrooms, p.YearBuilt, p.NotableFeatures, p.OfferAmount,
		p.EarnestMoney, p.DownPaymentPct, p.LoanType, nilIfEmpty(p.ClosingDate),
		contingencies, p.AdditionalTerms, p.BuyerName, p.BuyerStory,
	)
	return r.scanPackage(row)
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
