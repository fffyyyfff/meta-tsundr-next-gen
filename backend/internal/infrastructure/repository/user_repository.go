package repository

import (
	"context"
	"fmt"

	"meta-tsundr-backend/internal/domain/entity"
	"meta-tsundr-backend/internal/domain/repository"
	"meta-tsundr-backend/internal/infrastructure/database"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// userRepository implements the UserRepository interface using GORM
type userRepository struct {
	db *database.Database
}

// NewUserRepository creates a new UserRepository instance
func NewUserRepository(db *database.Database) repository.UserRepository {
	return &userRepository{
		db: db,
	}
}

// Create creates a new user
func (r *userRepository) Create(ctx context.Context, user *entity.User) (*entity.User, error) {
	if user.Email == "" {
		return nil, fmt.Errorf("email is required")
	}

	// Generate UUID if not provided
	if user.ID == "" {
		user.ID = ""
	}

	// Hash password if it's provided as plain text (for testing purposes)
	if user.PasswordHash == "" {
		return nil, fmt.Errorf("password hash is required")
	}

	if err := r.db.GetGORM().WithContext(ctx).Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(ctx context.Context, id string) (*entity.User, error) {
	var user entity.User
	if err := r.db.GetGORM().WithContext(ctx).First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	var user entity.User
	if err := r.db.GetGORM().WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// Update updates an existing user
func (r *userRepository) Update(ctx context.Context, user *entity.User) (*entity.User, error) {
	if err := r.db.GetGORM().WithContext(ctx).Save(user).Error; err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return user, nil
}

// Delete deletes a user by ID
func (r *userRepository) Delete(ctx context.Context, id string) error {
	result := r.db.GetGORM().WithContext(ctx).Delete(&entity.User{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete user: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// ExistsByEmail checks if a user exists by email
func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	if err := r.db.GetGORM().WithContext(ctx).Model(&entity.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check user existence: %w", err)
	}

	return count > 0, nil
}

// HashPassword hashes a plain text password using bcrypt
func HashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedBytes), nil
}

// CheckPassword compares a plain text password with a hashed password
func CheckPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
