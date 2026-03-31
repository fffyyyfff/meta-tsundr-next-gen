package usecase

import (
	"context"

	"meta-tsundr-backend/internal/domain/entity"
)

// AuthUseCase defines the interface for authentication use cases
type AuthUseCase interface {
	// Register creates a new user account
	Register(ctx context.Context, req *RegisterRequest) (*AuthResponse, error)

	// Login authenticates a user and returns a token
	Login(ctx context.Context, req *LoginRequest) (*AuthResponse, error)

	// ValidateToken validates a JWT token and returns user info
	ValidateToken(ctx context.Context, token string) (*entity.User, error)

	// RefreshToken refreshes an existing token
	RefreshToken(ctx context.Context, token string) (*AuthResponse, error)
}

// RegisterRequest represents a user registration request
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"required,min=1,max=255"`
	Password string `json:"password" validate:"required,min=8"`
}

// LoginRequest represents a user login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	Token     string       `json:"token"`
	User      *entity.User `json:"user"`
	ExpiresAt int64        `json:"expires_at"`
}
