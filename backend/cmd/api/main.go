package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/bsaleem546/offerdraft-api/db"
	"github.com/bsaleem546/offerdraft-api/internal/auth"
	"github.com/bsaleem546/offerdraft-api/internal/user"
	"github.com/bsaleem546/offerdraft-api/pkg/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg := config.Load()

	pool := db.Connect(cfg.DatabaseURL)
	defer pool.Close()

	authRepo := auth.NewRepository(pool)
	authService := auth.NewService(authRepo, cfg)
	authHandler := auth.NewHandler(authService)
	authMiddleware := auth.Middleware(cfg.JWTAccessSecret)

	userRepo := user.NewRepository(pool)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

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

	r.Group(func(r chi.Router) {
		r.Use(authMiddleware)

		r.Get("/api/v1/me", userHandler.GetProfile)
		r.Put("/api/v1/me", userHandler.UpdateProfile)
		r.Put("/api/v1/me/branding", userHandler.UpdateBranding)
		r.Put("/api/v1/me/defaults", userHandler.UpdateDefaults)
		r.Put("/api/v1/me/password", userHandler.ChangePassword)
	})

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, r))
}
