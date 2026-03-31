package entity

import (
	"time"

	"gorm.io/gorm"
)

// BookStatus represents the reading status of a book
type BookStatus string

const (
	BookStatusUnread   BookStatus = "UNREAD"
	BookStatusReading  BookStatus = "READING"
	BookStatusFinished BookStatus = "FINISHED"
)

// Book represents a book entity
type Book struct {
	ID         string         `json:"id" gorm:"type:text;primary_key"`
	UserID     string         `json:"user_id" gorm:"type:text;not null;index"`
	User       User           `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID;constraint:OnDelete:CASCADE"`
	Title      string         `json:"title" gorm:"not null;size:500"`
	Author     string         `json:"author" gorm:"not null;size:255"`
	ISBN       string         `json:"isbn" gorm:"size:20"`
	Status     BookStatus     `json:"status" gorm:"type:varchar(20);not null;default:'UNREAD';check:status IN ('UNREAD','READING','FINISHED')"`
	ImageURL   string         `json:"image_url" gorm:"size:1000"`
	Notes      string         `json:"notes" gorm:"type:text"`
	Rating     *int           `json:"rating" gorm:"type:int"`
	StartedAt  *time.Time     `json:"started_at"`
	FinishedAt *time.Time     `json:"finished_at"`
	CreatedAt  time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// NewBook creates a new book with default values
func NewBook(title, author, isbn, userID string) *Book {
	now := time.Now()
	return &Book{
		UserID:    userID,
		Title:     title,
		Author:    author,
		ISBN:      isbn,
		Status:    BookStatusUnread,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// IsValidTitle checks if the title is valid
func (b *Book) IsValidTitle() bool {
	return b.Title != "" && len([]rune(b.Title)) <= 500
}

// IsValidAuthor checks if the author is valid
func (b *Book) IsValidAuthor() bool {
	return b.Author != "" && len([]rune(b.Author)) <= 255
}

// IsValidISBN checks if the ISBN is valid (optional field)
func (b *Book) IsValidISBN() bool {
	return len([]rune(b.ISBN)) <= 20
}

// IsValidStatus checks if the status is valid
func (b *Book) IsValidStatus() bool {
	return b.Status == BookStatusUnread ||
		b.Status == BookStatusReading ||
		b.Status == BookStatusFinished
}
