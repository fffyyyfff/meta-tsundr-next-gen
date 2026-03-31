package middleware

import (
	"errors"
	"strings"
)

const (
	AuthorizationHeader = "Authorization"
	BearerPrefix        = "Bearer "
)

var (
	ErrMissingAuthHeader = errors.New("missing authorization header")
	ErrInvalidAuthFormat = errors.New("invalid authorization header format")
)

func ParseBearerToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", ErrMissingAuthHeader
	}

	authHeader = strings.TrimSpace(authHeader)
	if !strings.HasPrefix(strings.ToLower(authHeader), strings.ToLower(BearerPrefix)) {
		return "", ErrInvalidAuthFormat
	}

	token := strings.TrimSpace(authHeader[len(BearerPrefix):])
	if token == "" {
		return "", ErrInvalidAuthFormat
	}

	return token, nil
}
