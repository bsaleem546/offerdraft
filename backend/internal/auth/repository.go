package auth

import (
	"context"
	"errors"
	"time"

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

func (r *Repository) GetUserForReset(ctx context.Context, token string) (id string, expiresAt time.Time, err error) {
	err = r.db.QueryRow(ctx,
		`SELECT id, password_reset_expires_at FROM users WHERE password_reset_token = $1`,
		token,
	).Scan(&id, &expiresAt)
	return
}

func (r *Repository) SetResetToken(ctx context.Context, email, token string, expiresAt time.Time) error {
	result, err := r.db.Exec(ctx,
		`UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2 WHERE email = $3`,
		token, expiresAt, email,
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrInvalidToken
	}
	return nil
}

func (r *Repository) ResetPassword(ctx context.Context, userID, newHash string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = NOW() WHERE id = $2`,
		newHash, userID,
	)
	return err
}

func (r *Repository) GetNameByEmail(ctx context.Context, email string) (name string, err error) {
	err = r.db.QueryRow(ctx, `SELECT name FROM users WHERE email = $1`, email).Scan(&name)
	return
}

var ErrInvalidToken = errors.New("invalid or expired token")
var ErrEmailExists = errors.New("email already registered")
