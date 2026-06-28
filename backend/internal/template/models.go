package template

import "time"

type Template struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	Name            string    `json:"name"`
	LoanType        string    `json:"loan_type"`
	ClosingDays     int       `json:"closing_days"`
	Contingencies   []string  `json:"contingencies"`
	CoverLetterTone string    `json:"cover_letter_tone"`
	DefaultTerms    string    `json:"default_terms"`
	LastUsedAt      *string   `json:"last_used_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type CreateTemplateRequest struct {
	Name            string   `json:"name" validate:"required,min=1,max=255"`
	LoanType        string   `json:"loan_type"`
	ClosingDays     int      `json:"closing_days" validate:"omitempty,min=1,max=365"`
	Contingencies   []string `json:"contingencies"`
	CoverLetterTone string   `json:"cover_letter_tone" validate:"omitempty,oneof=professional warm competitive"`
	DefaultTerms    string   `json:"default_terms"`
}

type UpdateTemplateRequest struct {
	Name            string   `json:"name" validate:"omitempty,min=1,max=255"`
	LoanType        string   `json:"loan_type"`
	ClosingDays     int      `json:"closing_days" validate:"omitempty,min=1,max=365"`
	Contingencies   []string `json:"contingencies"`
	CoverLetterTone string   `json:"cover_letter_tone" validate:"omitempty,oneof=professional warm competitive"`
	DefaultTerms    string   `json:"default_terms"`
}
