package entity

import (
	"time"
	"unicode/utf8"

	"gorm.io/gorm"
)

// User represents a user entity
type User struct {
	ID           string         `json:"id" gorm:"type:text;primary_key"`
	Email        string         `json:"email" gorm:"uniqueIndex;not null;size:255"`
	Name         string         `json:"name" gorm:"not null;size:255"`
	PasswordHash string         `json:"-" gorm:"not null;size:255"`
	CreatedAt    time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// IsValidEmail checks if the email format is valid (basic validation)
func (u *User) IsValidEmail() bool {
	charCount := utf8.RuneCountInString(u.Email)
	return charCount > 0 && charCount <= 255
}

// IsValidName checks if the name is valid
func (u *User) IsValidName() bool {
	charCount := utf8.RuneCountInString(u.Name)
	return charCount > 0 && charCount <= 255
}
