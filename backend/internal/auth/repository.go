package auth

import (
	"context"
	"errors"

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
