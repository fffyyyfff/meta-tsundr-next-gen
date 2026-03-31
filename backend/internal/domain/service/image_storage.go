package service

import (
	"context"
	"io"
)

// ImageStorage defines the interface for image storage operations
type ImageStorage interface {
	// Upload uploads an image and returns the URL
	Upload(ctx context.Context, req *UploadImageRequest) (*UploadImageResponse, error)

	// Delete deletes an image by URL
	Delete(ctx context.Context, imageURL string) error

	// GetURL generates a signed URL for accessing an image
	GetURL(ctx context.Context, imageURL string) (string, error)

	// Exists checks if an image exists
	Exists(ctx context.Context, imageURL string) (bool, error)
}

// UploadImageRequest represents an image upload request
type UploadImageRequest struct {
	Reader      io.Reader `validate:"required"`
	ContentType string    `validate:"required"`
	Filename    string    `validate:"required"`
	Path        string    `validate:"required"` // Storage path (e.g., "books/user-id/book-id")
}

// UploadImageResponse represents an image upload response
type UploadImageResponse struct {
	URL      string `json:"url"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`
}
