package grpc

import (
	"context"
	"errors"

	authv1 "meta-tsundr-backend/api/proto/tsundoku/auth/v1"
	domainusecase "meta-tsundr-backend/internal/domain/usecase"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthServiceServer struct {
	authv1.UnimplementedAuthServiceServer
	authUseCase domainusecase.AuthUseCase
}

func NewAuthServiceServer(authUseCase domainusecase.AuthUseCase) *AuthServiceServer {
	return &AuthServiceServer{
		authUseCase: authUseCase,
	}
}

func (s *AuthServiceServer) Register(ctx context.Context, req *authv1.RegisterRequest) (*authv1.AuthResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}
	if len(req.Password) < 8 {
		return nil, status.Error(codes.InvalidArgument, "password must be at least 8 characters")
	}

	usecaseReq := &domainusecase.RegisterRequest{
		Email:    req.Email,
		Name:     req.Name,
		Password: req.Password,
	}

	resp, err := s.authUseCase.Register(ctx, usecaseReq)
	if err != nil {
		if errors.Is(err, domainusecase.ErrUserAlreadyExists) {
			return nil, status.Error(codes.AlreadyExists, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return AuthResponseToProto(resp.User, resp.Token, resp.ExpiresAt), nil
}

func (s *AuthServiceServer) Login(ctx context.Context, req *authv1.LoginRequest) (*authv1.AuthResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}
	if req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}

	usecaseReq := &domainusecase.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	}

	resp, err := s.authUseCase.Login(ctx, usecaseReq)
	if err != nil {
		if errors.Is(err, domainusecase.ErrInvalidCredentials) {
			return nil, status.Error(codes.Unauthenticated, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return AuthResponseToProto(resp.User, resp.Token, resp.ExpiresAt), nil
}

func (s *AuthServiceServer) RefreshToken(ctx context.Context, req *authv1.RefreshTokenRequest) (*authv1.AuthResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	resp, err := s.authUseCase.RefreshToken(ctx, req.Token)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid or expired token")
	}

	return AuthResponseToProto(resp.User, resp.Token, resp.ExpiresAt), nil
}
