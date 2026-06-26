package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv      string
	Port        string
	DatabaseURL string

	JWTAccessSecret        string
	JWTRefreshSecret       string
	JWTAccessExpiryMinutes int
	JWTRefreshExpiryDays   int

	AnthropicAPIKey string
	AnthropicModel  string

	StripeSecretKey     string
	StripeWebhookSecret string
	StripeSoloPriceID   string
	StripeTeamPriceID   string

	R2AccountID       string
	R2AccessKeyID     string
	R2SecretAccessKey string
	R2BucketName      string
	R2PublicURL       string

	ResendAPIKey    string
	ResendFromEmail string

	FrontendURL string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	accessExpiry, _ := strconv.Atoi(getEnv("JWT_ACCESS_EXPIRY_MINUTES", "15"))
	refreshExpiry, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_DAYS", "7"))

	return &Config{
		AppEnv:                 getEnv("APP_ENV", "development"),
		Port:                   getEnv("PORT", "8080"),
		DatabaseURL:            mustGetEnv("DATABASE_URL"),
		JWTAccessSecret:        mustGetEnv("JWT_ACCESS_SECRET"),
		JWTRefreshSecret:       mustGetEnv("JWT_REFRESH_SECRET"),
		JWTAccessExpiryMinutes: accessExpiry,
		JWTRefreshExpiryDays:   refreshExpiry,
		AnthropicAPIKey:        mustGetEnv("ANTHROPIC_API_KEY"),
		AnthropicModel:         getEnv("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
		StripeSecretKey:        mustGetEnv("STRIPE_SECRET_KEY"),
		StripeWebhookSecret:    mustGetEnv("STRIPE_WEBHOOK_SECRET"),
		StripeSoloPriceID:      mustGetEnv("STRIPE_SOLO_PRICE_ID"),
		StripeTeamPriceID:      mustGetEnv("STRIPE_TEAM_PRICE_ID"),
		R2AccountID:            mustGetEnv("R2_ACCOUNT_ID"),
		R2AccessKeyID:          mustGetEnv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey:      mustGetEnv("R2_SECRET_ACCESS_KEY"),
		R2BucketName:           getEnv("R2_BUCKET_NAME", "offerdraft-documents"),
		R2PublicURL:            mustGetEnv("R2_PUBLIC_URL"),
		ResendAPIKey:           mustGetEnv("RESEND_API_KEY"),
		ResendFromEmail:        getEnv("RESEND_FROM_EMAIL", "noreply@offerdraft.com"),
		FrontendURL:            getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("FATAL: required environment variable %s is not set", key)
	}
	return v
}
