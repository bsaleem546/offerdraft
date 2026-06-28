package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/bsaleem546/offerdraft-api/db"
	aiPkg "github.com/bsaleem546/offerdraft-api/internal/ai"
	"github.com/bsaleem546/offerdraft-api/internal/auth"
	"github.com/bsaleem546/offerdraft-api/internal/email"
	pkg "github.com/bsaleem546/offerdraft-api/internal/package"
	tmpl "github.com/bsaleem546/offerdraft-api/internal/template"
	"github.com/bsaleem546/offerdraft-api/internal/user"
	"github.com/bsaleem546/offerdraft-api/pkg/config"
)

func main() {
	cfg := config.Load()

	pool := db.Connect(cfg.DatabaseURL)
	defer pool.Close()

	emailClient := email.NewClient(cfg.ResendAPIKey, cfg.ResendFromEmail)

	authRepo := auth.NewRepository(pool)
	authService := auth.NewService(authRepo, cfg, emailClient)
	authHandler := auth.NewHandler(authService)
	authMiddleware := auth.Middleware(cfg.JWTAccessSecret)

	userRepo := user.NewRepository(pool)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	packageRepo := pkg.NewRepository(pool)
	packageService := pkg.NewService(packageRepo)
	packageHandler := pkg.NewHandler(packageService)

	aiClient := aiPkg.NewClient(cfg.AnthropicAPIKey, cfg.AnthropicModel)
	generateHandler := aiPkg.NewGenerateHandler(aiClient, packageRepo)

	templateRepo := tmpl.NewRepository(pool)
	templateService := tmpl.NewService(templateRepo)
	templateHandler := tmpl.NewHandler(templateService)

	r := chi.NewRouter()

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

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})

	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/auth/login", authHandler.Login)
	r.Get("/api/v1/auth/verify-email", authHandler.VerifyEmail)
	r.Post("/api/v1/auth/forgot-password", authHandler.ForgotPassword)
	r.Post("/api/v1/auth/reset-password", authHandler.ResetPassword)

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Get("/api/v1/me", userHandler.GetProfile)
		r.Put("/api/v1/me", userHandler.UpdateProfile)
		r.Put("/api/v1/me/branding", userHandler.UpdateBranding)
		r.Put("/api/v1/me/defaults", userHandler.UpdateDefaults)
		r.Put("/api/v1/me/password", userHandler.ChangePassword)

		r.Post("/api/v1/packages", packageHandler.Create)
		r.Get("/api/v1/packages", packageHandler.List)
		r.Get("/api/v1/packages/{id}", packageHandler.GetByID)
		r.Put("/api/v1/packages/{id}", packageHandler.Update)
		r.Patch("/api/v1/packages/{id}/complete", packageHandler.MarkComplete)
		r.Patch("/api/v1/packages/{id}/cover-letter", packageHandler.UpdateCoverLetter)
		r.Post("/api/v1/packages/{id}/generate", generateHandler.Generate)
		r.Post("/api/v1/packages/{id}/duplicate", packageHandler.Duplicate)
		r.Delete("/api/v1/packages/{id}", packageHandler.Delete)

		r.Post("/api/v1/templates", templateHandler.Create)
		r.Get("/api/v1/templates", templateHandler.List)
		r.Get("/api/v1/templates/{id}", templateHandler.GetByID)
		r.Put("/api/v1/templates/{id}", templateHandler.Update)
		r.Delete("/api/v1/templates/{id}", templateHandler.Delete)
	})

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}
