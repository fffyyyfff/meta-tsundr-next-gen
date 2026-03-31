package repository

import (
	"context"

	"meta-tsundr-backend/internal/domain/entity"
)

// UserRepository defines the interface for user data access
type UserRepository interface {
	// Create creates a new user
	Create(ctx context.Context, user *entity.User) (*entity.User, error)

	// GetByID retrieves a user by ID
	GetByID(ctx context.Context, id string) (*entity.User, error)

	// GetByEmail retrieves a user by email
	GetByEmail(ctx context.Context, email string) (*entity.User, error)

	// Update updates an existing user
	Update(ctx context.Context, user *entity.User) (*entity.User, error)

	// Delete deletes a user by ID
	Delete(ctx context.Context, id string) error

	// ExistsByEmail checks if a user exists by email
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}
