package user

type ProfileResponse struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	AgencyName    string `json:"agency_name"`
	LogoURL       string `json:"logo_url"`
	BrandColor    string `json:"brand_color"`
	PDFFooterText string `json:"pdf_footer_text"`
	LicenseNumber string `json:"license_number"`
	State         string `json:"state"`
	EmailVerified bool   `json:"email_verified"`
	Plan          string `json:"plan"`
	PlanStatus    string `json:"plan_status"`
	CreatedAt     string `json:"created_at"`
}

type UpdateProfileRequest struct {
	Name          string `json:"name" validate:"omitempty,min=2,max=100"`
	AgencyName    string `json:"agency_name" validate:"omitempty,max=200"`
	LicenseNumber string `json:"license_number" validate:"omitempty,max=100"`
	State         string `json:"state" validate:"omitempty,max=50"`
}

type UpdateBrandingRequest struct {
	BrandColor    string `json:"brand_color" validate:"omitempty,len=7"`
	PDFFooterText string `json:"pdf_footer_text" validate:"omitempty,max=255"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type UpdateDefaultsRequest struct {
	DefaultContingencies   []string `json:"default_contingencies"`
	DefaultClosingDays     int      `json:"default_closing_days" validate:"omitempty,min=1,max=365"`
	CoverLetterTone        string   `json:"cover_letter_tone" validate:"omitempty,oneof=professional warm competitive"`
	DefaultEarnestMoneyPct float64  `json:"default_earnest_money_pct" validate:"omitempty,min=0,max=100"`
}
