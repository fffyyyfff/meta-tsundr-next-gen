package service

import (
	"context"
	"time"
)

// CacheService defines the interface for caching operations
type CacheService interface {
	// Set stores a value in cache with expiration
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error

	// Get retrieves a value from cache
	Get(ctx context.Context, key string, dest interface{}) error

	// Delete removes a value from cache
	Delete(ctx context.Context, key string) error

	// Exists checks if a key exists in cache
	Exists(ctx context.Context, key string) (bool, error)

	// Clear removes all cached values (use with caution)
	Clear(ctx context.Context) error

	// SetMultiple stores multiple key-value pairs
	SetMultiple(ctx context.Context, items map[string]interface{}, expiration time.Duration) error

	// GetMultiple retrieves multiple values by keys
	GetMultiple(ctx context.Context, keys []string) (map[string]interface{}, error)

	// DeleteMultiple removes multiple keys from cache
	DeleteMultiple(ctx context.Context, keys []string) error
}

// CacheKey defines common cache key patterns
type CacheKey struct {
	// User cache keys
	UserByID    string // "user:id:{user_id}"
	UserByEmail string // "user:email:{email}"

	// Book cache keys
	BookByID      string // "book:id:{book_id}"
	BooksByUser   string // "books:user:{user_id}"
	BooksByStatus string // "books:user:{user_id}:status:{status}"

	// Auth cache keys
	TokenValidation string // "token:validation:{token_hash}"
	UserSession     string // "session:user:{user_id}"
}

// NewCacheKey creates cache key patterns
func NewCacheKey() *CacheKey {
	return &CacheKey{
		UserByID:        "user:id:%s",
		UserByEmail:     "user:email:%s",
		BookByID:        "book:id:%s",
		BooksByUser:     "books:user:%s",
		BooksByStatus:   "books:user:%s:status:%s",
		TokenValidation: "token:validation:%s",
		UserSession:     "session:user:%s",
	}
}
