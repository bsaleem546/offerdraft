package pkg

import "time"

type Package struct {
	ID                  string    `json:"id"`
	UserID              string    `json:"user_id"`
	Status              string    `json:"status"`
	PropertyAddress     string    `json:"property_address"`
	ListingPrice        *float64  `json:"listing_price"`
	PropertyType        string    `json:"property_type"`
	MLSNumber           string    `json:"mls_number"`
	Bedrooms            *float64  `json:"bedrooms"`
	Bathrooms           *float64  `json:"bathrooms"`
	YearBuilt           *int      `json:"year_built"`
	NotableFeatures     string    `json:"notable_features"`
	OfferAmount         float64   `json:"offer_amount"`
	EarnestMoney        *float64  `json:"earnest_money"`
	DownPaymentPct      *float64  `json:"down_payment_pct"`
	LoanType            string    `json:"loan_type"`
	ClosingDate         string    `json:"closing_date"`
	Contingencies       []string  `json:"contingencies"`
	EscalationActive    bool      `json:"escalation_active"`
	EscalationMaxPrice  *float64  `json:"escalation_max_price"`
	EscalationIncrement *float64  `json:"escalation_increment"`
	AdditionalTerms     string    `json:"additional_terms"`
	BuyerName           string    `json:"buyer_name"`
	BuyerStory          string    `json:"buyer_story"`
	CoverLetterText     string    `json:"cover_letter_text"`
	OfferSummaryText    string    `json:"offer_summary_text"`
	CompletedAt         *string   `json:"completed_at"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type CreatePackageRequest struct {
	PropertyAddress string   `json:"property_address" validate:"required"`
	OfferAmount     float64  `json:"offer_amount" validate:"required,gt=0"`
	ListingPrice    *float64 `json:"listing_price"`
	PropertyType    string   `json:"property_type"`
	MLSNumber       string   `json:"mls_number"`
	Bedrooms        *float64 `json:"bedrooms"`
	Bathrooms       *float64 `json:"bathrooms"`
	YearBuilt       *int     `json:"year_built"`
	NotableFeatures string   `json:"notable_features"`
	EarnestMoney    *float64 `json:"earnest_money"`
	DownPaymentPct  *float64 `json:"down_payment_pct"`
	LoanType        string   `json:"loan_type"`
	ClosingDate     string   `json:"closing_date"`
	Contingencies   []string `json:"contingencies"`
	AdditionalTerms string   `json:"additional_terms"`
	BuyerName       string   `json:"buyer_name"`
	BuyerStory      string   `json:"buyer_story"`
}

type UpdatePackageRequest struct {
	PropertyAddress string   `json:"property_address"`
	OfferAmount     *float64 `json:"offer_amount" validate:"omitempty,gt=0"`
	ListingPrice    *float64 `json:"listing_price"`
	PropertyType    string   `json:"property_type"`
	MLSNumber       string   `json:"mls_number"`
	Bedrooms        *float64 `json:"bedrooms"`
	Bathrooms       *float64 `json:"bathrooms"`
	YearBuilt       *int     `json:"year_built"`
	NotableFeatures string   `json:"notable_features"`
	EarnestMoney    *float64 `json:"earnest_money"`
	DownPaymentPct  *float64 `json:"down_payment_pct"`
	LoanType        string   `json:"loan_type"`
	ClosingDate     string   `json:"closing_date"`
	Contingencies   []string `json:"contingencies"`
	AdditionalTerms string   `json:"additional_terms"`
	BuyerName       string   `json:"buyer_name"`
	BuyerStory      string   `json:"buyer_story"`
}

type ListPackagesResponse struct {
	Packages []Package `json:"packages"`
	Total    int       `json:"total"`
	Page     int       `json:"page"`
	Limit    int       `json:"limit"`
}
