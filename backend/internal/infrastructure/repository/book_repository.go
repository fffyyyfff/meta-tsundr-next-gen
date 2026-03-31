package repository

import (
	"context"
	"fmt"

	"meta-tsundr-backend/internal/domain/entity"
	"meta-tsundr-backend/internal/domain/repository"
	"meta-tsundr-backend/internal/infrastructure/database"

	"gorm.io/gorm"
)

// bookRepository implements the BookRepository interface using GORM
type bookRepository struct {
	db *database.Database
}

// NewBookRepository creates a new BookRepository instance
func NewBookRepository(db *database.Database) repository.BookRepository {
	return &bookRepository{
		db: db,
	}
}

// Create creates a new book
func (r *bookRepository) Create(ctx context.Context, book *entity.Book) (*entity.Book, error) {
	if book.Title == "" {
		return nil, fmt.Errorf("title is required")
	}

	if book.Author == "" {
		return nil, fmt.Errorf("author is required")
	}

	if book.UserID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	// Generate UUID if not provided
	if book.ID == "" {
		book.ID = ""
	}

	if err := r.db.GetGORM().WithContext(ctx).Create(book).Error; err != nil {
		return nil, fmt.Errorf("failed to create book: %w", err)
	}

	return book, nil
}

// GetByID retrieves a book by ID
func (r *bookRepository) GetByID(ctx context.Context, id string) (*entity.Book, error) {
	var book entity.Book
	if err := r.db.GetGORM().WithContext(ctx).First(&book, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("book not found")
		}
		return nil, fmt.Errorf("failed to get book by ID: %w", err)
	}

	return &book, nil
}

// GetAll retrieves all books for a user
func (r *bookRepository) GetAll(ctx context.Context, userID string) ([]*entity.Book, error) {
	var books []*entity.Book
	if err := r.db.GetGORM().WithContext(ctx).Where("user_id = ?", userID).Find(&books).Error; err != nil {
		return nil, fmt.Errorf("failed to get books for user: %w", err)
	}

	return books, nil
}

// GetByStatus retrieves books by status for a user
func (r *bookRepository) GetByStatus(ctx context.Context, userID string, status entity.BookStatus) ([]*entity.Book, error) {
	var books []*entity.Book
	if err := r.db.GetGORM().WithContext(ctx).Where("user_id = ? AND status = ?", userID, status).Find(&books).Error; err != nil {
		return nil, fmt.Errorf("failed to get books by status: %w", err)
	}

	return books, nil
}

// Update updates an existing book
func (r *bookRepository) Update(ctx context.Context, book *entity.Book) (*entity.Book, error) {
	if book.ID == "" {
		return nil, fmt.Errorf("book ID is required")
	}

	if err := r.db.GetGORM().WithContext(ctx).Save(book).Error; err != nil {
		return nil, fmt.Errorf("failed to update book: %w", err)
	}

	return book, nil
}

// Delete deletes a book by ID
func (r *bookRepository) Delete(ctx context.Context, id string) error {
	result := r.db.GetGORM().WithContext(ctx).Delete(&entity.Book{}, "id = ?", id)
	if result.Error != nil {
		return fmt.Errorf("failed to delete book: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("book not found")
	}

	return nil
}

// ExistsByID checks if a book exists by ID
func (r *bookRepository) ExistsByID(ctx context.Context, id string) (bool, error) {
	var count int64
	if err := r.db.GetGORM().WithContext(ctx).Model(&entity.Book{}).Where("id = ?", id).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check book existence: %w", err)
	}

	return count > 0, nil
}
