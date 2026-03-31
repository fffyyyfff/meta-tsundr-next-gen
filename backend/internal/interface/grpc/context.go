package grpc

import (
	"context"
	"errors"
)

type contextKey string

const (
	userIDKey contextKey = "user_id"
	tokenKey  contextKey = "token"
)

func SetUserIDInContext(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

func GetUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(userIDKey).(string)
	if !ok || userID == "" {
		return "", errors.New("user ID not found in context")
	}
	return userID, nil
}

func SetTokenInContext(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, tokenKey, token)
}

func GetTokenFromContext(ctx context.Context) (string, error) {
	token, ok := ctx.Value(tokenKey).(string)
	if !ok {
		return "", errors.New("token not found in context")
	}
	return token, nil
}

func WithAuthContext(ctx context.Context, userID string, token string) context.Context {
	ctx = SetUserIDInContext(ctx, userID)
	ctx = SetTokenInContext(ctx, token)
	return ctx
}
