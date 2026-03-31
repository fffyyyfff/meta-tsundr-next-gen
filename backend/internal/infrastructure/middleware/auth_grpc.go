package middleware

import (
	"context"
	"log"

	"meta-tsundr-backend/internal/domain/usecase"
	grpcctx "meta-tsundr-backend/internal/interface/grpc"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

var PublicMethods = map[string]bool{
	"/tsundoku.auth.v1.AuthService/Register":     true,
	"/tsundoku.auth.v1.AuthService/Login":        true,
	"/tsundoku.auth.v1.AuthService/RefreshToken": true,
}

func GRPCAuthInterceptor(authUseCase usecase.AuthUseCase) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		if PublicMethods[info.FullMethod] {
			log.Printf("Public method called: %s", info.FullMethod)
			return handler(ctx, req)
		}

		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			log.Printf("Missing metadata for method: %s", info.FullMethod)
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}

		authHeaders := md.Get("authorization")
		if len(authHeaders) == 0 {
			log.Printf("Missing authorization header for method: %s", info.FullMethod)
			return nil, status.Error(codes.Unauthenticated, "missing authorization header")
		}

		token, err := ParseBearerToken(authHeaders[0])
		if err != nil {
			log.Printf("Invalid authorization format for method %s: %v", info.FullMethod, err)
			return nil, status.Error(codes.Unauthenticated, "invalid authorization format")
		}

		user, err := authUseCase.ValidateToken(ctx, token)
		if err != nil {
			log.Printf("Token validation failed for method %s: %v", info.FullMethod, err)
			return nil, status.Error(codes.Unauthenticated, "invalid or expired token")
		}

		newCtx := grpcctx.WithAuthContext(ctx, user.ID, token)

		log.Printf("User authenticated for %s: %s", info.FullMethod, user.ID)
		return handler(newCtx, req)
	}
}
