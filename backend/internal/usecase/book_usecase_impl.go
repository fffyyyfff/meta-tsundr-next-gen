package usecase

import (
	"context"
	"errors"
	"fmt"

	"meta-tsundr-backend/internal/domain/entity"
	domainrepo "meta-tsundr-backend/internal/domain/repository"
	domainusecase "meta-tsundr-backend/internal/domain/usecase"
)

// bookUseCase implements the BookUseCase interface
type bookUseCase struct {
	bookRepo domainrepo.BookRepository
}

// NewBookUseCaseSimple creates a new BookUseCase instance without storage
func NewBookUseCaseSimple(bookRepo domainrepo.BookRepository) domainusecase.BookUseCase {
	return &bookUseCase{
		bookRepo: bookRepo,
	}
}

// CreateBook creates a new book
func (uc *bookUseCase) CreateBook(ctx context.Context, req *domainusecase.CreateBookRequest) (*entity.Book, error) {
	// Validate request
	if req.Title == "" {
		return nil, errors.New("title is required")
	}
	if req.Author == "" {
		return nil, errors.New("author is required")
	}
	if req.UserID == "" {
		return nil, errors.New("user_id is required")
	}

	// Create book
	book := &entity.Book{
		ID:     "",
		UserID: req.UserID,
		Title:  req.Title,
		Author: req.Author,
		ISBN:   req.ISBN,
		Status: req.Status,
	}

	createdBook, err := uc.bookRepo.Create(ctx, book)
	if err != nil {
		return nil, fmt.Errorf("failed to create book: %w", err)
	}

	return createdBook, nil
}

// GetBooks retrieves books for a user, optionally filtered by status
func (uc *bookUseCase) GetBooks(ctx context.Context, userID string, status *entity.BookStatus) ([]*entity.Book, error) {
	if userID == "" {
		return nil, errors.New("user_id is required")
	}

	var books []*entity.Book
	var err error

	if status != nil {
		books, err = uc.bookRepo.GetByStatus(ctx, userID, *status)
	} else {
		books, err = uc.bookRepo.GetAll(ctx, userID)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get books: %w", err)
	}

	return books, nil
}

// GetBookByID retrieves a specific book by ID
func (uc *bookUseCase) GetBookByID(ctx context.Context, bookID, userID string) (*entity.Book, error) {
	if bookID == "" {
		return nil, errors.New("book_id is required")
	}
	if userID == "" {
		return nil, errors.New("user_id is required")
	}

	book, err := uc.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		// Check if the error indicates book not found
		if err.Error() == "book not found" {
			return nil, domainusecase.ErrBookNotFound
		}
		return nil, fmt.Errorf("failed to get book: %w", err)
	}

	// Verify ownership
	if book.UserID != userID {
		return nil, domainusecase.ErrBookNotFound
	}

	return book, nil
}

// UpdateBookStatus updates the reading status of a book
func (uc *bookUseCase) UpdateBookStatus(ctx context.Context, req *domainusecase.UpdateBookStatusRequest) (*entity.Book, error) {
	// Validate request
	if req.BookID == "" {
		return nil, errors.New("book_id is required")
	}
	if req.UserID == "" {
		return nil, errors.New("user_id is required")
	}

	// Get existing book
	book, err := uc.bookRepo.GetByID(ctx, req.BookID)
	if err != nil {
		// Check if the error indicates book not found
		if err.Error() == "book not found" {
			return nil, domainusecase.ErrBookNotFound
		}
		return nil, fmt.Errorf("failed to get book: %w", err)
	}

	// Verify ownership
	if book.UserID != req.UserID {
		return nil, domainusecase.ErrBookNotFound
	}

	// Update status
	book.Status = req.Status

	updatedBook, err := uc.bookRepo.Update(ctx, book)
	if err != nil {
		return nil, fmt.Errorf("failed to update book status: %w", err)
	}

	return updatedBook, nil
}

// UpdateBook updates book information
func (uc *bookUseCase) UpdateBook(ctx context.Context, req *domainusecase.UpdateBookRequest) (*entity.Book, error) {
	// Validate request
	if req.BookID == "" {
		return nil, errors.New("book_id is required")
	}
	if req.UserID == "" {
		return nil, errors.New("user_id is required")
	}
	if req.Title == "" {
		return nil, errors.New("title is required")
	}
	if req.Author == "" {
		return nil, errors.New("author is required")
	}

	// Get existing book
	book, err := uc.bookRepo.GetByID(ctx, req.BookID)
	if err != nil {
		// Check if the error indicates book not found
		if err.Error() == "book not found" {
			return nil, domainusecase.ErrBookNotFound
		}
		return nil, fmt.Errorf("failed to get book: %w", err)
	}

	// Verify ownership
	if book.UserID != req.UserID {
		return nil, domainusecase.ErrBookNotFound
	}

	// Update book
	book.Title = req.Title
	book.Author = req.Author
	book.ISBN = req.ISBN
	book.Status = req.Status

	updatedBook, err := uc.bookRepo.Update(ctx, book)
	if err != nil {
		return nil, fmt.Errorf("failed to update book: %w", err)
	}

	return updatedBook, nil
}

// DeleteBook deletes a book
func (uc *bookUseCase) DeleteBook(ctx context.Context, bookID, userID string) error {
	if bookID == "" {
		return errors.New("book_id is required")
	}
	if userID == "" {
		return errors.New("user_id is required")
	}

	// Get existing book to verify ownership
	book, err := uc.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		// Check if the error indicates book not found
		if err.Error() == "book not found" {
			return domainusecase.ErrBookNotFound
		}
		return fmt.Errorf("failed to get book: %w", err)
	}

	// Verify ownership
	if book.UserID != userID {
		return domainusecase.ErrBookNotFound
	}

	// Delete book
	if err := uc.bookRepo.Delete(ctx, bookID); err != nil {
		return fmt.Errorf("failed to delete book: %w", err)
	}

	return nil
}

// UploadBookImage uploads an image for a book
func (uc *bookUseCase) UploadBookImage(ctx context.Context, req *domainusecase.UploadBookImageRequest) (*entity.Book, error) {
	// Validate request
	if req.BookID == "" {
		return nil, errors.New("book_id is required")
	}
	if req.UserID == "" {
		return nil, errors.New("user_id is required")
	}
	if req.ImageReader == nil {
		return nil, errors.New("image reader is required")
	}
	if req.ContentType == "" {
		return nil, errors.New("content_type is required")
	}
	if req.Filename == "" {
		return nil, errors.New("filename is required")
	}

	// Get existing book
	book, err := uc.bookRepo.GetByID(ctx, req.BookID)
	if err != nil {
		// Check if the error indicates book not found
		if err.Error() == "book not found" {
			return nil, domainusecase.ErrBookNotFound
		}
		return nil, fmt.Errorf("failed to get book: %w", err)
	}

	// Verify ownership
	if book.UserID != req.UserID {
		return nil, domainusecase.ErrBookNotFound
	}

	// Delete old image if exists
	if book.ImageURL != "" && uc.imageStorage != nil {
		// Ignore error - continue with upload
		_ = uc.imageStorage.Delete(ctx, book.ImageURL)
	}

	// Upload new image
	storagePath := filepath.Join("books", req.UserID.String(), req.BookID.String())
	uploadReq := &service.UploadImageRequest{
		Reader:      req.ImageReader,
		ContentType: req.ContentType,
		Filename:    req.Filename,
		Path:        storagePath,
	}

	uploadResp, err := uc.imageStorage.Upload(ctx, uploadReq)
	if err != nil {
		return nil, fmt.Errorf("failed to upload image: %w", err)
	}

	// Update book with new image URL
	book.ImageURL = uploadResp.URL

	updatedBook, err := uc.bookRepo.Update(ctx, book)
	if err != nil {
		return nil, fmt.Errorf("failed to update book image URL: %w", err)
	}

	return updatedBook, nil
}
