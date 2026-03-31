package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"meta-tsundr-backend/internal/domain/entity"
	domainrepo "meta-tsundr-backend/internal/domain/repository"
	domainusecase "meta-tsundr-backend/internal/domain/usecase"
	"meta-tsundr-backend/internal/infrastructure/config"
	infrarepo "meta-tsundr-backend/internal/infrastructure/repository"

	"github.com/golang-jwt/jwt/v5"
)

// tokenGenerator is a function type for generating tokens (used for testing)
type tokenGenerator func(user *entity.User) (string, int64, error)

// authUseCase implements the AuthUseCase interface
type authUseCase struct {
	userRepo        domainrepo.UserRepository
	config          *config.JWTConfig
	generateTokenFn tokenGenerator // For testing: allows injecting error-generating token function
}

// NewAuthUseCase creates a new AuthUseCase instance
func NewAuthUseCase(userRepo domainrepo.UserRepository, jwtConfig *config.JWTConfig) domainusecase.AuthUseCase {
	uc := &authUseCase{
		userRepo: userRepo,
		config:   jwtConfig,
	}
	// Set default token generator
	uc.generateTokenFn = uc.generateToken
	return uc
}

// Register creates a new user account
func (uc *authUseCase) Register(ctx context.Context, req *domainusecase.RegisterRequest) (*domainusecase.AuthResponse, error) {
	// Validate request
	if req.Email == "" {
		return nil, errors.New("email is required")
	}
	if req.Name == "" {
		return nil, errors.New("name is required")
	}
	if len(req.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}

	// Check if user already exists
	exists, err := uc.userRepo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check user existence: %w", err)
	}
	if exists {
		return nil, domainusecase.ErrUserAlreadyExists
	}

	// Hash password
	hashedPassword, err := infrarepo.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &entity.User{
		ID:           "",
		Email:        req.Email,
		Name:         req.Name,
		PasswordHash: hashedPassword,
	}

	createdUser, err := uc.userRepo.Create(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate token
	token, expiresAt, err := uc.generateTokenFn(createdUser)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &domainusecase.AuthResponse{
		Token:     token,
		User:      createdUser,
		ExpiresAt: expiresAt,
	}, nil
}

// Login authenticates a user and returns a token
func (uc *authUseCase) Login(ctx context.Context, req *domainusecase.LoginRequest) (*domainusecase.AuthResponse, error) {
	// Validate request
	if req.Email == "" {
		return nil, errors.New("email is required")
	}
	if req.Password == "" {
		return nil, errors.New("password is required")
	}

	// Get user by email
	user, err := uc.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, domainusecase.ErrInvalidCredentials
	}

	// Verify password
	if err := infrarepo.CheckPassword(user.PasswordHash, req.Password); err != nil {
		return nil, domainusecase.ErrInvalidCredentials
	}

	// Generate token
	token, expiresAt, err := uc.generateTokenFn(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &domainusecase.AuthResponse{
		Token:     token,
		User:      user,
		ExpiresAt: expiresAt,
	}, nil
}

// ValidateToken validates a JWT token and returns user info
func (uc *authUseCase) ValidateToken(ctx context.Context, tokenString string) (*entity.User, error) {
	// Parse and validate token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(uc.config.Secret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Get user ID from claims
	userIDStr, ok := claims["user_id"].(string)
	if !ok {
		return nil, errors.New("invalid token: user_id not found")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid token: invalid user_id format: %w", err)
	}

	// Get user from repository
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	return user, nil
}

// RefreshToken refreshes an existing token
func (uc *authUseCase) RefreshToken(ctx context.Context, tokenString string) (*domainusecase.AuthResponse, error) {
	// Validate existing token
	user, err := uc.ValidateToken(ctx, tokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Generate new token
	token, expiresAt, err := uc.generateTokenFn(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &domainusecase.AuthResponse{
		Token:     token,
		User:      user,
		ExpiresAt: expiresAt,
	}, nil
}

// generateToken generates a JWT token for a user
func (uc *authUseCase) generateToken(user *entity.User) (tokenString string, expiresAt int64, err error) {
	expiresAt = time.Now().Add(uc.config.Expiration).Unix()

	claims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"email":   user.Email,
		"exp":     expiresAt,
		"iat":     time.Now().Unix(),
		"iss":     uc.config.Issuer,
		"sub":     user.ID.String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err = token.SignedString([]byte(uc.config.Secret))
	if err != nil {
		return "", 0, fmt.Errorf("failed to sign token: %w", err)
	}

	return
}
