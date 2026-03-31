package repository

import (
	"context"

	"meta-tsundr-backend/internal/domain/entity"
)

// BookRepository defines the interface for book data access
type BookRepository interface {
	// Create creates a new book
	Create(ctx context.Context, book *entity.Book) (*entity.Book, error)

	// GetByID retrieves a book by its ID
	GetByID(ctx context.Context, id string) (*entity.Book, error)

	// GetAll retrieves all books for a user
	GetAll(ctx context.Context, userID string) ([]*entity.Book, error)

	// GetByStatus retrieves books by status for a user
	GetByStatus(ctx context.Context, userID string, status entity.BookStatus) ([]*entity.Book, error)

	// Update updates an existing book
	Update(ctx context.Context, book *entity.Book) (*entity.Book, error)

	// Delete deletes a book by ID
	Delete(ctx context.Context, id string) error

	// ExistsByID checks if a book exists by ID
	ExistsByID(ctx context.Context, id string) (bool, error)
}
