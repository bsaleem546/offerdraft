# OfferDraft — Backend Build Guide (Go)

> **How to use this document**
> This is a strict, sequential build guide. You do not skip steps. You do not move to the next step until the current step is fully working and tested. Each step tells you exactly what to build, what files to create, what commands to run, and what "done" looks like before you proceed. If something is not explicitly listed in a step, it does not get built in that step.

---

## Stack

- **Language:** Go 1.22+
- **Router:** `chi` v5
- **Database:** PostgreSQL 15+ via `pgx/v5`
- **Auth:** JWT (access token 15min + refresh token 7 days) via `golang-jwt/jwt/v5`
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) via raw HTTP calls
- **PDF:** `unipdf/v3` (cover page + letter + document merge)
- **File Storage:** Cloudflare R2 via `aws-sdk-go-v2/s3`
- **Payments:** Stripe via `stripe-go/v76`
- **Email:** Resend via raw HTTP
- **Config:** `.env` via `godotenv`
- **Validation:** `go-playground/validator/v10`
- **Migration:** `golang-migrate/migrate/v4`

---

## Project Structure (build toward this, do not create all at once)

```
offerdraft-api/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── auth/
│   ├── user/
│   ├── package/
│   ├── template/
│   ├── ai/
│   ├── pdf/
│   ├── storage/
│   ├── billing/
│   ├── email/
│   └── team/
├── db/
│   ├── migrations/
│   └── queries/
├── pkg/
│   ├── config/
│   ├── logger/
│   ├── validator/
│   └── response/
├── .env
├── .env.example
├── go.mod
├── go.sum
└── Makefile
```

---

## STEP 1 — Project Initialization

**What you are doing:** Creating the Go module, installing all dependencies, and confirming the project compiles.

### 1.1 — Create the project directory and initialize the module

```bash
mkdir offerdraft-api && cd offerdraft-api
go mod init github.com/yourusername/offerdraft-api
```

### 1.2 — Install all dependencies at once

```bash
go get github.com/go-chi/chi/v5
go get github.com/jackc/pgx/v5
go get github.com/golang-jwt/jwt/v5
go get github.com/go-playground/validator/v10
go get github.com/joho/godotenv
go get github.com/golang-migrate/migrate/v4
go get github.com/golang-migrate/migrate/v4/database/postgres
go get github.com/golang-migrate/migrate/v4/source/file
go get github.com/stripe/stripe-go/v76
go get github.com/aws/aws-sdk-go-v2
go get github.com/aws/aws-sdk-go-v2/config
go get github.com/aws/aws-sdk-go-v2/service/s3
go get github.com/unidoc/unipdf/v3
go get golang.org/x/crypto
```

### 1.3 — Create the `.env` file

```env
APP_ENV=development
PORT=8080

DATABASE_URL=postgres://postgres:password@localhost:5432/offerdraft?sslmode=disable

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRY_MINUTES=15
JWT_REFRESH_EXPIRY_DAYS=7

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SOLO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=offerdraft-documents
R2_PUBLIC_URL=https://your-r2-bucket-url

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@offerdraft.com

FRONTEND_URL=http://localhost:5173
```

### 1.4 — Create `pkg/config/config.go`

```go
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

    StripeSecretKey      string
    StripeWebhookSecret  string
    StripeSoloPriceID    string
    StripeTeamPriceID    string

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
```

### 1.5 — Create `pkg/response/response.go`

```go
package response

import (
    "encoding/json"
    "net/http"
)

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Message string      `json:"message,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{Success: true, Data: data})
}

func Error(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{Success: false, Error: message})
}

func Message(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(Response{Success: true, Message: message})
}
```

### 1.6 — Create `cmd/api/main.go` (minimal, just proves it compiles)

```go
package main

import (
    "fmt"
    "log"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
    "github.com/yourusername/offerdraft-api/pkg/config"
)

func main() {
    cfg := config.Load()

    r := chi.NewRouter()
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        fmt.Fprint(w, `{"status":"ok"}`)
    })

    log.Printf("Server starting on port %s", cfg.Port)
    log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}
```

### 1.7 — Verify it compiles and runs

```bash
go run ./cmd/api
# Open browser: http://localhost:8080/health
# Must return: {"status":"ok"}
```

### ✅ STEP 1 IS DONE WHEN:

- `go run ./cmd/api` starts without errors
- `GET /health` returns 200 with `{"status":"ok"}`
- `go build ./...` produces zero errors

**Do not proceed to Step 2 until all three conditions are true.**

---

## STEP 2 — Database Setup & Migrations

**What you are doing:** Connecting to PostgreSQL, creating all tables via migrations, and verifying the schema.

### 2.1 — Create the Makefile

```makefile
MIGRATE=migrate -path db/migrations -database "$(DATABASE_URL)"

migrate-up:
	$(MIGRATE) up

migrate-down:
	$(MIGRATE) down 1

migrate-create:
	migrate create -ext sql -dir db/migrations -seq $(name)

.PHONY: migrate-up migrate-down migrate-create
```

### 2.2 — Create migration files

Run these commands to create migration files (they create empty up/down files):

```bash
migrate create -ext sql -dir db/migrations -seq create_users
migrate create -ext sql -dir db/migrations -seq create_subscriptions
migrate create -ext sql -dir db/migrations -seq create_team_members
migrate create -ext sql -dir db/migrations -seq create_offer_packages
migrate create -ext sql -dir db/migrations -seq create_uploaded_documents
migrate create -ext sql -dir db/migrations -seq create_templates
```

### 2.3 — Fill in the migration UP files

**`000001_create_users.up.sql`**

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255),
    logo_url TEXT,
    brand_color VARCHAR(7) DEFAULT '#AAFF45',
    pdf_footer_text VARCHAR(255),
    license_number VARCHAR(100),
    state VARCHAR(50),
    default_contingencies JSONB DEFAULT '[]',
    default_closing_days INTEGER DEFAULT 30,
    cover_letter_tone VARCHAR(50) DEFAULT 'professional',
    default_earnest_money_pct NUMERIC(5,2) DEFAULT 1.00,
    stripe_customer_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verify_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

**`000001_create_users.down.sql`**

```sql
DROP TABLE IF EXISTS users;
```

**`000002_create_subscriptions.up.sql`**

```sql
CREATE TYPE plan_type AS ENUM ('solo', 'team');
CREATE TYPE plan_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan plan_type NOT NULL DEFAULT 'solo',
    status plan_status NOT NULL DEFAULT 'trialing',
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

**`000002_create_subscriptions.down.sql`**

```sql
DROP TABLE IF EXISTS subscriptions;
DROP TYPE IF EXISTS plan_status;
DROP TYPE IF EXISTS plan_type;
```

**`000003_create_team_members.up.sql`**

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    invite_token VARCHAR(255),
    invite_accepted BOOLEAN DEFAULT FALSE,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at TIMESTAMPTZ
);

CREATE INDEX idx_team_owner ON team_members(owner_user_id);
CREATE INDEX idx_team_member ON team_members(member_user_id);
```

**`000003_create_team_members.down.sql`**

```sql
DROP TABLE IF EXISTS team_members;
```

**`000004_create_offer_packages.up.sql`**

```sql
CREATE TYPE package_status AS ENUM ('draft', 'complete', 'archived');

CREATE TABLE offer_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status package_status NOT NULL DEFAULT 'draft',

    -- Property
    property_address TEXT NOT NULL,
    listing_price NUMERIC(12,2),
    property_type VARCHAR(50),
    mls_number VARCHAR(100),
    bedrooms NUMERIC(4,1),
    bathrooms NUMERIC(4,1),
    year_built INTEGER,
    notable_features TEXT,

    -- Offer
    offer_amount NUMERIC(12,2) NOT NULL,
    earnest_money NUMERIC(12,2),
    down_payment_pct NUMERIC(5,2),
    loan_type VARCHAR(50),
    closing_date DATE,
    contingencies JSONB DEFAULT '[]',
    escalation_active BOOLEAN DEFAULT FALSE,
    escalation_max_price NUMERIC(12,2),
    escalation_increment NUMERIC(12,2),
    additional_terms TEXT,

    -- Buyer
    buyer_name VARCHAR(255),
    buyer_story TEXT,

    -- AI Output
    cover_letter_text TEXT,
    offer_summary_text TEXT,

    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_user ON offer_packages(user_id);
CREATE INDEX idx_packages_status ON offer_packages(status);
```

**`000004_create_offer_packages.down.sql`**

```sql
DROP TABLE IF EXISTS offer_packages;
DROP TYPE IF EXISTS package_status;
```

**`000005_create_uploaded_documents.up.sql`**

```sql
CREATE TYPE doc_type AS ENUM ('pre_approval', 'proof_of_funds', 'additional');

CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES offer_packages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_key TEXT NOT NULL,
    file_size_bytes BIGINT,
    doc_type doc_type NOT NULL DEFAULT 'additional',
    sort_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_package ON uploaded_documents(package_id);
```

**`000005_create_uploaded_documents.down.sql`**

```sql
DROP TABLE IF EXISTS uploaded_documents;
DROP TYPE IF EXISTS doc_type;
```

**`000006_create_templates.up.sql`**

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    loan_type VARCHAR(50),
    closing_days INTEGER,
    contingencies JSONB DEFAULT '[]',
    cover_letter_tone VARCHAR(50) DEFAULT 'professional',
    default_terms TEXT,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_user ON templates(user_id);
```

**`000006_create_templates.down.sql`**

```sql
DROP TABLE IF EXISTS templates;
```

### 2.4 — Run migrations

```bash
export DATABASE_URL="postgres://postgres:password@localhost:5432/offerdraft?sslmode=disable"
make migrate-up
```

### 2.5 — Create `db/db.go` — database connection pool

```go
package db

import (
    "context"
    "log"

    "github.com/jackc/pgx/v5/pgxpool"
)

func Connect(databaseURL string) *pgxpool.Pool {
    pool, err := pgxpool.New(context.Background(), databaseURL)
    if err != nil {
        log.Fatalf("Unable to connect to database: %v", err)
    }

    if err := pool.Ping(context.Background()); err != nil {
        log.Fatalf("Database ping failed: %v", err)
    }

    log.Println("Database connected successfully")
    return pool
}
```

### 2.6 — Wire the DB pool into `main.go`

Add to `main.go`:

```go
import "github.com/yourusername/offerdraft-api/db"

pool := db.Connect(cfg.DatabaseURL)
defer pool.Close()
```

### ✅ STEP 2 IS DONE WHEN:

- `make migrate-up` runs without errors
- All 6 tables exist in your database (verify with `\dt` in psql)
- `go run ./cmd/api` still starts and `/health` still returns 200

**Do not proceed to Step 3 until all three conditions are true.**

---

## STEP 3 — Auth: Register, Login, Token Refresh, Email Verify

**What you are doing:** Building the complete authentication system. No other feature starts until this works fully.

### 3.1 — Create `internal/auth/models.go`

```go
package auth

type RegisterRequest struct {
    Name     string `json:"name" validate:"required,min=2,max=100"`
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    Plan     string `json:"plan" validate:"omitempty,oneof=solo team"`
}

type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

type TokenPair struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
}

type RefreshRequest struct {
    RefreshToken string `json:"refresh_token" validate:"required"`
}
```

### 3.2 — Create `internal/auth/jwt.go`

```go
package auth

import (
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

type Claims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}

func GenerateAccessToken(userID, email, secret string, expiryMinutes int) (string, error) {
    claims := Claims{
        UserID: userID,
        Email:  email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryMinutes) * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}

func GenerateRefreshToken(userID, secret string, expiryDays int) (string, error) {
    claims := Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(expiryDays) * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}

func ValidateToken(tokenStr, secret string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return []byte(secret), nil
    })
    if err != nil {
        return nil, err
    }
    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token")
    }
    return claims, nil
}
```

### 3.3 — Create `internal/auth/middleware.go`

```go
package auth

import (
    "context"
    "net/http"
    "strings"

    "github.com/yourusername/offerdraft-api/pkg/response"
)

type contextKey string
const UserIDKey contextKey = "userID"
const UserEmailKey contextKey = "userEmail"

func Middleware(accessSecret string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
                response.Error(w, http.StatusUnauthorized, "missing or invalid authorization header")
                return
            }

            tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
            claims, err := ValidateToken(tokenStr, accessSecret)
            if err != nil {
                response.Error(w, http.StatusUnauthorized, "invalid or expired token")
                return
            }

            ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
            ctx = context.WithValue(ctx, UserEmailKey, claims.Email)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func GetUserID(r *http.Request) string {
    id, _ := r.Context().Value(UserIDKey).(string)
    return id
}
```

### 3.4 — Create `internal/auth/repository.go`

```go
package auth

import (
    "context"

    "github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
    db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
    return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, name, email, passwordHash, verifyToken, plan string) (string, error) {
    var id string
    err := r.db.QueryRow(ctx,
        `INSERT INTO users (name, email, password_hash, email_verify_token)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        name, email, passwordHash, verifyToken,
    ).Scan(&id)
    return id, err
}

func (r *Repository) CreateSubscription(ctx context.Context, userID, plan string) error {
    _, err := r.db.Exec(ctx,
        `INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, $2, 'trialing')`,
        userID, plan,
    )
    return err
}

func (r *Repository) GetUserByEmail(ctx context.Context, email string) (id, passwordHash string, emailVerified bool, err error) {
    err = r.db.QueryRow(ctx,
        `SELECT id, password_hash, email_verified FROM users WHERE email = $1`,
        email,
    ).Scan(&id, &passwordHash, &emailVerified)
    return
}

func (r *Repository) EmailExists(ctx context.Context, email string) (bool, error) {
    var exists bool
    err := r.db.QueryRow(ctx,
        `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email,
    ).Scan(&exists)
    return exists, err
}

func (r *Repository) VerifyEmail(ctx context.Context, token string) error {
    result, err := r.db.Exec(ctx,
        `UPDATE users SET email_verified = TRUE, email_verify_token = NULL
         WHERE email_verify_token = $1 AND email_verified = FALSE`,
        token,
    )
    if err != nil {
        return err
    }
    if result.RowsAffected() == 0 {
        return ErrInvalidToken
    }
    return nil
}

var ErrInvalidToken = errors.New("invalid or expired token")
var ErrEmailExists = errors.New("email already registered")
```

### 3.5 — Create `internal/auth/service.go`

```go
package auth

import (
    "context"
    "crypto/rand"
    "encoding/hex"

    "golang.org/x/crypto/bcrypt"
    "github.com/yourusername/offerdraft-api/pkg/config"
)

type Service struct {
    repo *Repository
    cfg  *config.Config
}

func NewService(repo *Repository, cfg *config.Config) *Service {
    return &Service{repo: repo, cfg: cfg}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*TokenPair, error) {
    exists, err := s.repo.EmailExists(ctx, req.Email)
    if err != nil {
        return nil, err
    }
    if exists {
        return nil, ErrEmailExists
    }

    hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }

    verifyToken := generateToken()

    userID, err := s.repo.CreateUser(ctx, req.Name, req.Email, string(hash), verifyToken, req.Plan)
    if err != nil {
        return nil, err
    }

    plan := req.Plan
    if plan == "" {
        plan = "solo"
    }
    if err := s.repo.CreateSubscription(ctx, userID, plan); err != nil {
        return nil, err
    }

    // TODO Step 7: send verification email via email service

    return s.issueTokens(userID, req.Email)
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*TokenPair, error) {
    userID, hash, emailVerified, err := s.repo.GetUserByEmail(ctx, req.Email)
    if err != nil {
        return nil, ErrInvalidCredentials
    }
    _ = emailVerified // enforce in Step 7 after email service is built

    if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
        return nil, ErrInvalidCredentials
    }

    return s.issueTokens(userID, req.Email)
}

func (s *Service) VerifyEmail(ctx context.Context, token string) error {
    return s.repo.VerifyEmail(ctx, token)
}

func (s *Service) issueTokens(userID, email string) (*TokenPair, error) {
    access, err := GenerateAccessToken(userID, email, s.cfg.JWTAccessSecret, s.cfg.JWTAccessExpiryMinutes)
    if err != nil {
        return nil, err
    }
    refresh, err := GenerateRefreshToken(userID, s.cfg.JWTRefreshSecret, s.cfg.JWTRefreshExpiryDays)
    if err != nil {
        return nil, err
    }
    return &TokenPair{AccessToken: access, RefreshToken: refresh}, nil
}

func generateToken() string {
    b := make([]byte, 32)
    rand.Read(b)
    return hex.EncodeToString(b)
}

var ErrInvalidCredentials = errors.New("invalid email or password")
```

### 3.6 — Create `internal/auth/handler.go`

```go
package auth

import (
    "encoding/json"
    "net/http"

    "github.com/yourusername/offerdraft-api/pkg/response"
    "github.com/go-playground/validator/v10"
)

type Handler struct {
    service  *Service
    validate *validator.Validate
}

func NewHandler(service *Service) *Handler {
    return &Handler{service: service, validate: validator.New()}
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
    var req RegisterRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        response.Error(w, http.StatusBadRequest, "invalid request body")
        return
    }
    if err := h.validate.Struct(req); err != nil {
        response.Error(w, http.StatusUnprocessableEntity, err.Error())
        return
    }

    tokens, err := h.service.Register(r.Context(), req)
    if err != nil {
        switch err {
        case ErrEmailExists:
            response.Error(w, http.StatusConflict, "email already registered")
        default:
            response.Error(w, http.StatusInternalServerError, "registration failed")
        }
        return
    }

    response.JSON(w, http.StatusCreated, tokens)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
    var req LoginRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        response.Error(w, http.StatusBadRequest, "invalid request body")
        return
    }
    if err := h.validate.Struct(req); err != nil {
        response.Error(w, http.StatusUnprocessableEntity, err.Error())
        return
    }

    tokens, err := h.service.Login(r.Context(), req)
    if err != nil {
        response.Error(w, http.StatusUnauthorized, "invalid email or password")
        return
    }

    response.JSON(w, http.StatusOK, tokens)
}

func (h *Handler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
    token := r.URL.Query().Get("token")
    if token == "" {
        response.Error(w, http.StatusBadRequest, "token is required")
        return
    }

    if err := h.service.VerifyEmail(r.Context(), token); err != nil {
        response.Error(w, http.StatusBadRequest, "invalid or expired token")
        return
    }

    response.Message(w, http.StatusOK, "email verified successfully")
}
```

### 3.7 — Register auth routes in `main.go`

```go
authRepo := auth.NewRepository(pool)
authService := auth.NewService(authRepo, cfg)
authHandler := auth.NewHandler(authService)
authMiddleware := auth.Middleware(cfg.JWTAccessSecret)

r.Post("/api/v1/auth/register", authHandler.Register)
r.Post("/api/v1/auth/login", authHandler.Login)
r.Get("/api/v1/auth/verify-email", authHandler.VerifyEmail)

// Protected route group example (you will expand this in later steps)
r.Group(func(r chi.Router) {
    r.Use(authMiddleware)
    r.Get("/api/v1/me", func(w http.ResponseWriter, r *http.Request) {
        response.JSON(w, http.StatusOK, map[string]string{"user_id": auth.GetUserID(r)})
    })
})
```

### 3.8 — Add CORS middleware to `main.go`

```go
r.Use(func(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", cfg.FrontendURL)
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        w.Header().Set("Access-Control-Allow-Credentials", "true")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
})
```

### ✅ STEP 3 IS DONE WHEN:

- `POST /api/v1/auth/register` with valid body returns `201` with `access_token` and `refresh_token`
- `POST /api/v1/auth/register` with duplicate email returns `409`
- `POST /api/v1/auth/login` with correct credentials returns `200` with tokens
- `POST /api/v1/auth/login` with wrong password returns `401`
- `GET /api/v1/me` with valid Bearer token returns `200` with user_id
- `GET /api/v1/me` with no token returns `401`
- `GET /api/v1/auth/verify-email?token=invalid` returns `400`

Test all 7 conditions with curl or Postman before moving on.

**Do not proceed to Step 4 until all seven conditions are true.**

---

## STEP 4 — User Profile API

**What you are doing:** Building the `/me` profile endpoints — get profile, update profile, update branding, change password.

### 4.1 — Create `internal/user/models.go`

```go
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
    DefaultContingencies    []string `json:"default_contingencies"`
    DefaultClosingDays      int      `json:"default_closing_days" validate:"omitempty,min=1,max=365"`
    CoverLetterTone         string   `json:"cover_letter_tone" validate:"omitempty,oneof=professional warm competitive"`
    DefaultEarnestMoneyPct  float64  `json:"default_earnest_money_pct" validate:"omitempty,min=0,max=100"`
}
```

### 4.2 — Create `internal/user/repository.go`, `service.go`, `handler.go`

Follow the same Repository → Service → Handler pattern from Step 3. Implement:

- `GetByID(ctx, userID)` → returns full user row
- `UpdateProfile(ctx, userID, req)` → updates name, agency_name, license_number, state
- `UpdateBranding(ctx, userID, req)` → updates brand_color, pdf_footer_text
- `UpdateDefaults(ctx, userID, req)` → updates default_contingencies, default_closing_days, cover_letter_tone, default_earnest_money_pct
- `UpdatePassword(ctx, userID, currentPassword, newPassword)` → bcrypt verify current → bcrypt hash new → update
- `UpdateLogoURL(ctx, userID, url)` → updates logo_url (called from storage upload in Step 8)

### 4.3 — Register user routes in `main.go` (inside the authenticated group)

```
GET    /api/v1/me                    → GetProfile
PUT    /api/v1/me                    → UpdateProfile
PUT    /api/v1/me/branding           → UpdateBranding
PUT    /api/v1/me/defaults           → UpdateDefaults
PUT    /api/v1/me/password           → ChangePassword
```

### ✅ STEP 4 IS DONE WHEN:

- `GET /api/v1/me` returns full profile including plan info (joined from subscriptions table)
- `PUT /api/v1/me` updates name/agency fields and returns updated profile
- `PUT /api/v1/me/password` with wrong current password returns `400`
- `PUT /api/v1/me/password` with correct current password returns `200`

**Do not proceed to Step 5 until all four conditions are true.**

---

## STEP 5 — Offer Packages CRUD

**What you are doing:** Building the core domain — create, read, update, list, delete offer packages. No AI yet. No PDF yet. Just the data layer.

### 5.1 — Plan limit enforcement

Before a user creates a package, check their subscription:

- Solo plan: max 30 packages per calendar month
- Team plan: unlimited
- Trialing: same limits as Solo

Create a helper `checkPackageLimit(ctx, userID, db)` in the package repository that returns an error if the user is over their limit.

### 5.2 — Package repository methods

Build these queries in `internal/package/repository.go`:

- `Create(ctx, userID, req)` → inserts, returns full package
- `GetByID(ctx, packageID, userID)` → returns package (enforces user ownership — never return another user's package)
- `List(ctx, userID, filters)` → paginated list with status/sort filters
- `Update(ctx, packageID, userID, req)` → partial update (only draft packages can be edited)
- `UpdateCoverLetter(ctx, packageID, userID, text)` → update cover_letter_text field
- `MarkComplete(ctx, packageID, userID)` → sets status = 'complete', completed_at = NOW()
- `Delete(ctx, packageID, userID)` → hard delete (cascades to uploaded_documents)
- `Duplicate(ctx, packageID, userID)` → copies the row with new id, status = 'draft', clears cover_letter_text, completed_at
- `CountThisMonth(ctx, userID)` → count packages in current calendar month

### 5.3 — API routes

```
POST   /api/v1/packages              → Create
GET    /api/v1/packages              → List (query params: status, sort, page, limit)
GET    /api/v1/packages/:id          → GetByID
PUT    /api/v1/packages/:id          → Update (draft only)
PATCH  /api/v1/packages/:id/complete → MarkComplete
PATCH  /api/v1/packages/:id/cover-letter → UpdateCoverLetter
POST   /api/v1/packages/:id/duplicate → Duplicate
DELETE /api/v1/packages/:id          → Delete
```

### 5.4 — Ownership enforcement rule

Every single package query filters by both `id` AND `user_id`. Never fetch by id alone. If a record is not found (because it belongs to another user), return `404` — not `403`. Do not leak that the resource exists.

### ✅ STEP 5 IS DONE WHEN:

- Can create a package and get it back by ID
- List returns paginated results with correct total count
- User A cannot access User B's package (returns 404)
- Updating a complete package returns 400
- Solo user creating 31st package in a month returns 429 (Too Many Requests)
- Duplicate creates a new draft with identical fields

**Do not proceed to Step 6 until all six conditions are true.**

---

## STEP 6 — AI: Cover Letter Generation

**What you are doing:** Integrating the Anthropic Claude API to generate buyer cover letters and offer summaries.

### 6.1 — Create `internal/ai/client.go`

```go
package ai

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

const anthropicURL = "https://api.anthropic.com/v1/messages"
const anthropicVersion = "2023-06-01"

type Client struct {
    apiKey     string
    model      string
    httpClient *http.Client
}

func NewClient(apiKey, model string) *Client {
    return &Client{
        apiKey: apiKey,
        model:  model,
        httpClient: &http.Client{Timeout: 30 * time.Second},
    }
}

type Message struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

type Request struct {
    Model     string    `json:"model"`
    MaxTokens int       `json:"max_tokens"`
    System    string    `json:"system,omitempty"`
    Messages  []Message `json:"messages"`
}

type ContentBlock struct {
    Type string `json:"type"`
    Text string `json:"text"`
}

type Response struct {
    Content []ContentBlock `json:"content"`
}

func (c *Client) Complete(ctx context.Context, system, userPrompt string, maxTokens int) (string, error) {
    body, err := json.Marshal(Request{
        Model:     c.model,
        MaxTokens: maxTokens,
        System:    system,
        Messages:  []Message{{Role: "user", Content: userPrompt}},
    })
    if err != nil {
        return "", err
    }

    req, err := http.NewRequestWithContext(ctx, http.MethodPost, anthropicURL, bytes.NewReader(body))
    if err != nil {
        return "", err
    }
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("x-api-key", c.apiKey)
    req.Header.Set("anthropic-version", anthropicVersion)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        b, _ := io.ReadAll(resp.Body)
        return "", fmt.Errorf("anthropic API error %d: %s", resp.StatusCode, string(b))
    }

    var result Response
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return "", err
    }

    if len(result.Content) == 0 {
        return "", fmt.Errorf("empty response from AI")
    }

    return result.Content[0].Text, nil
}
```

### 6.2 — Create `internal/ai/prompts.go`

```go
package ai

import "fmt"

func CoverLetterSystem(tone string) string {
    toneDesc := map[string]string{
        "professional": "professional and formal",
        "warm":         "warm, personal, and emotionally compelling",
        "competitive":  "assertive, direct, and highly competitive — emphasizing the buyer's strength",
    }
    t, ok := toneDesc[tone]
    if !ok {
        t = "professional and formal"
    }
    return fmt.Sprintf(
        "You are a real estate agent writing a buyer cover letter to accompany an offer. "+
            "Tone: %s. Write in first person as the agent. Under 300 words. "+
            "Output only the letter text — no subject line, no preamble, no sign-off placeholder, no markdown.",
        t,
    )
}

func CoverLetterPrompt(address, listingPrice, offerAmount, loanType, closingDate, buyerName, buyerStory, features string) string {
    return fmt.Sprintf(
        "Property: %s. Listing price: %s. Our offer: %s. Loan type: %s. "+
            "Desired closing: %s. Buyers: %s. About the buyers: %s. Notable features: %s.",
        address, listingPrice, offerAmount, loanType, closingDate, buyerName, buyerStory, features,
    )
}

func OfferSummarySystem() string {
    return "You are a real estate transaction coordinator. Write a concise 2-3 sentence executive summary " +
        "of the offer terms below. Plain text only, no markdown, no bullet points."
}

func OfferSummaryPrompt(address, offerAmount, loanType, closingDate string, contingencies []string) string {
    return fmt.Sprintf(
        "Property: %s. Offer: %s. Loan: %s. Closing: %s. Contingencies: %v.",
        address, offerAmount, loanType, closingDate, contingencies,
    )
}
```

### 6.3 — Add generate endpoint to packages

```
POST /api/v1/packages/:id/generate
```

Handler logic:

1. Load the package by ID (verify ownership)
2. Verify package status is `draft`
3. Call `ai.Client.Complete` for cover letter
4. Call `ai.Client.Complete` for offer summary
5. Save both texts to the package row (`cover_letter_text`, `offer_summary_text`)
6. Return the updated package

### 6.4 — Error handling for AI failures

If the Anthropic API returns an error:

- Return `503 Service Unavailable` with message "AI generation failed, please try again"
- Do NOT save partial data to the database
- Log the full error server-side

### ✅ STEP 6 IS DONE WHEN:

- `POST /api/v1/packages/:id/generate` returns a real cover letter (not placeholder text) under 300 words
- The cover letter and summary are saved to the database
- Calling generate on a non-draft package returns `400`
- A real API failure (wrong key, etc.) returns `503` not a 500 stack trace

**Do not proceed to Step 7 until all four conditions are true.**

---

## STEP 7 — Email Service (Transactional)

**What you are doing:** Building the email sending layer and wiring it into auth flows.

### 7.1 — Create `internal/email/client.go`

Use Resend's HTTP API (no SDK needed). Build a `Send(ctx, to, subject, htmlBody)` method. POST to `https://api.resend.com/emails` with JSON body and `Authorization: Bearer {key}` header.

### 7.2 — Create `internal/email/templates.go`

Build three HTML email templates as Go string functions (not files — keep it simple):

- `VerificationEmail(name, verifyURL string) string` — "Verify your OfferDraft email" with a link button
- `PasswordResetEmail(name, resetURL string) string` — "Reset your password" with a link button
- `WelcomeEmail(name string) string` — "Welcome to OfferDraft" plain welcome message

Templates must be dark-background HTML emails (matching product aesthetic). Single-column, centered, max-width 600px.

### 7.3 — Wire email into auth

Go back to `internal/auth/service.go` and inject the email client:

- After `CreateUser` succeeds in `Register`: send verification email to the new user's address. Verification URL: `{FRONTEND_URL}/verify-email?token={token}`
- In `VerifyEmail`: nothing to send
- Add `ForgotPassword(ctx, email)` method:
  1. Look up user by email
  2. Generate reset token
  3. Save token + expiry (1 hour) to DB
  4. Send password reset email. Reset URL: `{FRONTEND_URL}/reset-password?token={token}`
- Add `ResetPassword(ctx, token, newPassword)` method:
  1. Look up user by reset token
  2. Check expiry
  3. Hash new password, update, clear token

### 7.4 — New auth routes

```
POST /api/v1/auth/forgot-password   → body: { email }
POST /api/v1/auth/reset-password    → body: { token, new_password }
POST /api/v1/auth/resend-verify     → body: { email } — rate limit: 1 per 60s per email
```

### ✅ STEP 7 IS DONE WHEN:

- Registering a new user triggers a verification email (check inbox or Resend dashboard logs)
- Clicking the verification link sets `email_verified = TRUE` in the database
- `POST /api/v1/auth/forgot-password` with a real email sends a reset email
- `POST /api/v1/auth/reset-password` with a valid token changes the password
- Resend verify with an already-verified email returns `200` silently (no error leak)

**Do not proceed to Step 8 until all five conditions are true.**

---

## STEP 8 — File Storage (Cloudflare R2)

**What you are doing:** Building the document upload system — upload to R2, save metadata to DB, serve signed URLs.

### 8.1 — Create `internal/storage/client.go`

Initialize an S3-compatible client targeting Cloudflare R2:

```go
package storage

import (
    "context"
    "fmt"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    appConfig "github.com/yourusername/offerdraft-api/pkg/config"
)

type Client struct {
    s3     *s3.Client
    bucket string
    pubURL string
}

func NewClient(cfg *appConfig.Config) (*Client, error) {
    r2Resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
        return aws.Endpoint{
            URL: fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.R2AccountID),
        }, nil
    })

    awsCfg, err := config.LoadDefaultConfig(context.Background(),
        config.WithEndpointResolverWithOptions(r2Resolver),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
            cfg.R2AccessKeyID, cfg.R2SecretAccessKey, "",
        )),
        config.WithRegion("auto"),
    )
    if err != nil {
        return nil, err
    }

    return &Client{
        s3:     s3.NewFromConfig(awsCfg),
        bucket: cfg.R2BucketName,
        pubURL: cfg.R2PublicURL,
    }, nil
}
```

Add `Upload(ctx, key, contentType string, data []byte) (url string, err error)` and `Delete(ctx, key string) error` methods.

### 8.2 — Document upload endpoint

```
POST /api/v1/packages/:id/documents
```

- Accept `multipart/form-data`
- Fields: `file` (binary), `doc_type` (pre_approval | proof_of_funds | additional)
- Max file size: **10MB** — reject with `413` if exceeded
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png` — reject others with `400`
- Generate file key: `{userID}/{packageID}/{uuid}.{ext}`
- Upload to R2
- Insert row into `uploaded_documents`
- Return the document record

```
DELETE /api/v1/packages/:id/documents/:docID
```

- Verify ownership of both package and document
- Delete from R2 (`s3.DeleteObject`)
- Delete from DB

### 8.3 — Logo upload

```
POST /api/v1/me/logo
```

- Same multipart handling
- Max 2MB
- Allowed: `image/jpeg`, `image/png`, `image/webp`
- Key: `logos/{userID}/{uuid}.{ext}`
- Upload to R2
- Update `users.logo_url`

### ✅ STEP 8 IS DONE WHEN:

- Uploading a PDF to a package returns a document record with a valid public URL
- The file is visible in your R2 bucket
- Uploading a `.exe` or other disallowed type returns `400`
- Uploading a 15MB file returns `413`
- Deleting a document removes it from both R2 and the database
- Logo upload updates the user profile logo_url

**Do not proceed to Step 9 until all six conditions are true.**

---

## STEP 9 — PDF Assembly

**What you are doing:** Building the PDF generation pipeline that produces the final offer package.

### 9.1 — Create `internal/pdf/builder.go`

The PDF assembler does three things in sequence:

1. **Cover page** — generates a programmatic PDF page with: agency logo (if present), agency name, property address, offer amount, date, and offer summary text. Uses brand_color for the header bar.
2. **Cover letter page** — renders the cover_letter_text as a formatted page with agency name header.
3. **Document merge** — fetches each uploaded document from R2 by URL, appends pages to the output PDF.

Use `unipdf/v3` for all PDF operations.

Install the free community license (sufficient for this use case):

```go
import "github.com/unidoc/unipdf/v3/common/license"

func init() {
    license.SetMeteredKey("") // empty string = community mode
}
```

### 9.2 — PDF generation endpoint

```
POST /api/v1/packages/:id/pdf
```

Logic:

1. Load the package with all uploaded documents
2. Verify `cover_letter_text` is not empty — if it is, return `400` with "Generate cover letter first"
3. Load user profile (for branding: logo_url, brand_color, agency_name, pdf_footer_text)
4. Fetch each document file from R2 as bytes
5. Build the PDF
6. Upload the completed PDF to R2: key `packages/{userID}/{packageID}/offer_package.pdf`
7. Return `{ "pdf_url": "https://..." }`

The PDF URL is not stored permanently. It is generated fresh on each call. Do not add a pdf_url column to the database.

### 9.3 — PDF structure rules

- Page 1 (Cover Page): brand color header bar (full width, 60px tall), agency logo on header, "OFFER PACKAGE" label, property address large, offer amount large in JetBrains Mono style (use a monospace font in PDF), offer summary paragraph, date generated.
- Page 2 (Cover Letter): "RE: Offer for {address}" heading, cover letter body text, 1-inch margins.
- Pages 3+ (Documents): merged pages from uploaded files in sort_order sequence.
- Footer on every page: "{agency_name} · Generated by OfferDraft · Page X of Y"

### ✅ STEP 9 IS DONE WHEN:

- `POST /api/v1/packages/:id/pdf` returns a URL to a real PDF
- Opening that URL shows a PDF with cover page, cover letter, and at least one merged document
- Calling the endpoint on a package with no cover letter returns `400`
- The PDF footer shows correct page numbers

**Do not proceed to Step 10 until all four conditions are true.**

---

## STEP 10 — Templates CRUD

**What you are doing:** Building the saved templates feature.

### Routes

```
POST   /api/v1/templates           → Create
GET    /api/v1/templates           → List (user's own)
GET    /api/v1/templates/:id       → GetByID
PUT    /api/v1/templates/:id       → Update
DELETE /api/v1/templates/:id       → Delete
```

### Plan limit enforcement

Solo plan: maximum 3 templates. On create, count user's existing templates. If 3 or more, return `403` with `{ "error": "template_limit_reached", "message": "Upgrade to Team plan for unlimited templates" }`.

### ✅ STEP 10 IS DONE WHEN:

- Full CRUD works for templates
- Solo user creating a 4th template returns `403`
- Templates belonging to other users return `404`

---

## STEP 11 — Team Management

**What you are doing:** Building the invite system for Team plan users.

### Rules

- Only Team plan subscribers can invite members
- Team max size: 5 members (owner + 4)
- Owner can remove any member
- Members can only access their own packages (team does not share packages — it's seat licensing, not shared workspace)

### Routes

```
GET    /api/v1/team                    → List members + pending invites
POST   /api/v1/team/invite             → Send invite email (body: { email })
DELETE /api/v1/team/members/:memberID  → Remove member
GET    /api/v1/team/accept?token=      → Accept invite (public route, creates account or links existing)
```

### Invite flow

1. Owner POSTs email to `/api/v1/team/invite`
2. Backend checks plan is Team, checks seat count < 5
3. Inserts row into `team_members` with `invite_accepted = false`, generates `invite_token`
4. Sends invite email: "You've been invited to join {agency_name} on OfferDraft" with link to `{FRONTEND_URL}/accept-invite?token={token}`
5. Invitee clicks link → frontend sends token to `GET /api/v1/team/accept?token=`
6. Backend finds the team_members row, marks `invite_accepted = true`, links to user account

### ✅ STEP 11 IS DONE WHEN:

- Team plan owner can invite a member and they receive an email
- Accepting the invite marks the record as accepted
- Solo plan owner attempting to invite returns `403`
- Team of 5 attempting to add a 6th returns `403`

---

## STEP 12 — Stripe Billing

**What you are doing:** Integrating Stripe subscriptions and handling webhooks.

### 12.1 — Stripe routes

```
POST /api/v1/billing/create-checkout   → Creates Stripe Checkout Session, returns { url }
POST /api/v1/billing/portal            → Creates Stripe Customer Portal session, returns { url }
GET  /api/v1/billing/subscription      → Returns current subscription status
POST /api/v1/webhooks/stripe           → Stripe webhook (public — no auth middleware)
```

### 12.2 — Checkout session

On `create-checkout`:

1. If user has no `stripe_customer_id`: create a Stripe Customer, save to `users.stripe_customer_id`
2. Create a Stripe Checkout Session with the correct price ID (solo or team from request body)
3. Set `success_url` = `{FRONTEND_URL}/dashboard?checkout=success`
4. Set `cancel_url` = `{FRONTEND_URL}/pricing`
5. Return `{ "url": "https://checkout.stripe.com/..." }`

### 12.3 — Webhook handler (critical)

The webhook endpoint MUST:

1. Read raw body bytes BEFORE decoding JSON
2. Validate Stripe webhook signature using `stripe.ConstructEvent(body, header, webhookSecret)`
3. If signature invalid: return `400` immediately
4. Handle these events:
   - `checkout.session.completed` → update `subscriptions` row: set `stripe_subscription_id`, `status = active`, `current_period_end`
   - `customer.subscription.updated` → update status, current_period_end
   - `customer.subscription.deleted` → set status = `canceled`, `canceled_at = NOW()`
   - `invoice.payment_failed` → set status = `past_due`
5. Always return `200` to Stripe even if you don't handle the event type — never return 4xx for unhandled events or Stripe will retry

### 12.4 — Subscription-gating middleware

Create a `RequireActivePlan()` middleware that checks the user's subscription status before allowing package creation and AI generation:

- Status `trialing` or `active`: allow
- Status `past_due`: allow (grace period)
- Status `canceled`: return `402` with `{ "error": "subscription_required" }`

### ✅ STEP 12 IS DONE WHEN:

- `create-checkout` returns a valid Stripe Checkout URL
- Completing a test checkout in Stripe triggers the webhook and updates the subscriptions table
- A canceled subscription user attempting to create a package gets `402`
- Stripe webhook with invalid signature returns `400`

---

## STEP 13 — Onboarding Defaults Endpoint & Final Polish

**What you are doing:** Adding the onboarding save endpoint, then hardening the entire API.

### 13.1 — Onboarding endpoint

```
POST /api/v1/onboarding
```

Body: agency_name, state, license_number, default_contingencies, default_closing_days, cover_letter_tone, default_earnest_money_pct

This is just a compound call that calls `UpdateProfile` + `UpdateDefaults` in a single transaction. Returns updated profile.

### 13.2 — Rate limiting

Add a simple in-memory rate limiter (no Redis needed at this stage) to these endpoints:

- `POST /api/v1/auth/forgot-password` → 3 requests per IP per hour
- `POST /api/v1/auth/resend-verify` → 1 request per email per 60 seconds
- `POST /api/v1/packages/:id/generate` → 10 requests per user per hour (AI cost protection)

### 13.3 — Request size limits

Add `http.MaxBytesReader` to all non-file-upload JSON endpoints. Set max to 1MB.

### 13.4 — Final route audit

Verify every route:

- Has auth middleware (except public routes)
- Returns consistent JSON via `response.JSON` / `response.Error` (no raw `fmt.Fprintf`)
- Validates input before touching the database
- Returns `404` (not `403`) when a resource is not found or belongs to another user

### 13.5 — Graceful shutdown

Update `main.go` to use `http.Server` with graceful shutdown:

```go
server := &http.Server{
    Addr:         ":" + cfg.Port,
    Handler:      r,
    ReadTimeout:  15 * time.Second,
    WriteTimeout: 30 * time.Second,
    IdleTimeout:  60 * time.Second,
}

go func() {
    if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        log.Fatalf("Server error: %v", err)
    }
}()

quit := make(chan os.Signal, 1)
signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
<-quit

ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
server.Shutdown(ctx)
log.Println("Server stopped")
```

### ✅ STEP 13 IS DONE WHEN:

- Onboarding endpoint saves all fields in one call
- AI generation endpoint returns `429` after 10 calls in one hour
- Server shuts down cleanly on `Ctrl+C` (no abrupt kills)
- `go vet ./...` returns zero warnings
- `go build ./...` produces zero errors

---

## COMPLETE API REFERENCE

### Public

```
GET  /health
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/verify-email?token=
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/resend-verify
GET  /api/v1/team/accept?token=
POST /api/v1/webhooks/stripe
```

### Authenticated

```
POST   /api/v1/onboarding

GET    /api/v1/me
PUT    /api/v1/me
PUT    /api/v1/me/branding
PUT    /api/v1/me/defaults
PUT    /api/v1/me/password
POST   /api/v1/me/logo

POST   /api/v1/packages
GET    /api/v1/packages
GET    /api/v1/packages/:id
PUT    /api/v1/packages/:id
PATCH  /api/v1/packages/:id/complete
PATCH  /api/v1/packages/:id/cover-letter
POST   /api/v1/packages/:id/generate
POST   /api/v1/packages/:id/pdf
DELETE /api/v1/packages/:id
POST   /api/v1/packages/:id/duplicate
POST   /api/v1/packages/:id/documents
DELETE /api/v1/packages/:id/documents/:docID

POST   /api/v1/templates
GET    /api/v1/templates
GET    /api/v1/templates/:id
PUT    /api/v1/templates/:id
DELETE /api/v1/templates/:id

GET    /api/v1/team
POST   /api/v1/team/invite
DELETE /api/v1/team/members/:memberID

POST   /api/v1/billing/create-checkout
POST   /api/v1/billing/portal
GET    /api/v1/billing/subscription
```

---

## ENVIRONMENT CHECKLIST BEFORE DEPLOY

- [ ] All `mustGetEnv` variables are set on the server
- [ ] PostgreSQL migrations have been run (`make migrate-up`)
- [ ] Stripe webhook endpoint is registered in Stripe dashboard pointing to `https://yourdomain.com/api/v1/webhooks/stripe`
- [ ] R2 bucket CORS policy allows your frontend domain
- [ ] `APP_ENV=production` is set
- [ ] JWT secrets are at least 32 random characters (generate with `openssl rand -hex 32`)
- [ ] `FRONTEND_URL` is set to the production frontend domain (no trailing slash)
