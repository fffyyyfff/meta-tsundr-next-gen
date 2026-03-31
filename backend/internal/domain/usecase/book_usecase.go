package usecase

import (
	"context"

	"meta-tsundr-backend/internal/domain/entity"
)

// BookUseCase defines the interface for book management use cases
type BookUseCase interface {
	// CreateBook creates a new book
	CreateBook(ctx context.Context, req *CreateBookRequest) (*entity.Book, error)

	// GetBooks retrieves books for a user, optionally filtered by status
	GetBooks(ctx context.Context, userID string, status *entity.BookStatus) ([]*entity.Book, error)

	// GetBookByID retrieves a specific book by ID
	GetBookByID(ctx context.Context, bookID string, userID string) (*entity.Book, error)

	// UpdateBookStatus updates the reading status of a book
	UpdateBookStatus(ctx context.Context, req *UpdateBookStatusRequest) (*entity.Book, error)

	// UpdateBook updates book information
	UpdateBook(ctx context.Context, req *UpdateBookRequest) (*entity.Book, error)

	// DeleteBook deletes a book
	DeleteBook(ctx context.Context, bookID string, userID string) error
}

// CreateBookRequest represents a book creation request
type CreateBookRequest struct {
	UserID string         `json:"user_id" validate:"required"`
	Title  string            `json:"title" validate:"required,min=1,max=500"`
	Author string            `json:"author" validate:"required,min=1,max=255"`
	ISBN   string            `json:"isbn" validate:"omitempty,max=20"`
	Status entity.BookStatus `json:"status" validate:"required,oneof=UNREAD READING FINISHED"`
}

// UpdateBookStatusRequest represents a book status update request
type UpdateBookStatusRequest struct {
	BookID string         `json:"book_id" validate:"required"`
	UserID string         `json:"user_id" validate:"required"`
	Status entity.BookStatus `json:"status" validate:"required,oneof=UNREAD READING FINISHED"`
}

// UpdateBookRequest represents a book update request
type UpdateBookRequest struct {
	BookID string         `json:"book_id" validate:"required"`
	UserID string         `json:"user_id" validate:"required"`
	Title  string            `json:"title" validate:"required,min=1,max=500"`
	Author string            `json:"author" validate:"required,min=1,max=255"`
	ISBN   string            `json:"isbn" validate:"omitempty,max=20"`
	Status entity.BookStatus `json:"status" validate:"required,oneof=UNREAD READING FINISHED"`
}

