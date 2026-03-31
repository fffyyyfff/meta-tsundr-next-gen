package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	authv1 "meta-tsundr-backend/api/proto/tsundoku/auth/v1"
	bookv1 "meta-tsundr-backend/api/proto/tsundoku/book/v1"
	domainusecase "meta-tsundr-backend/internal/domain/usecase"
	"meta-tsundr-backend/internal/infrastructure/database"
	"meta-tsundr-backend/internal/infrastructure/middleware"
	"meta-tsundr-backend/internal/infrastructure/repository"
	grpchandler "meta-tsundr-backend/internal/interface/grpc"
	"meta-tsundr-backend/internal/usecase"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	port := getEnv("GRPC_PORT", "50051")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "meta_tsundr")
	dbPassword := getEnv("DB_PASSWORD", "meta_tsundr_dev")
	dbName := getEnv("DB_NAME", "meta_tsundr")
	jwtSecret := getEnv("JWT_SECRET", "dev-secret")
	env := getEnv("ENVIRONMENT", "development")

	if env == "production" && jwtSecret == "dev-secret" {
		log.Fatal("FATAL: JWT_SECRET must be set in production environment")
	}

	log.Println("Starting meta-tsundr gRPC server...")
	log.Printf("Environment: %s, Port: %s", env, port)

	dbCfg := &database.DatabaseConfig{
		Host:     dbHost,
		Port:     dbPort,
		User:     dbUser,
		Password: dbPassword,
		DBName:   dbName,
	}

	db, err := database.NewDatabaseFromConfig(dbCfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	if healthErr := func() error {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		return db.HealthCheck(ctx)
	}(); healthErr != nil {
		log.Fatalf("Database health check failed: %v", healthErr)
	}
	log.Println("Database connection verified")

	if migrateErr := db.AutoMigrate(); migrateErr != nil {
		log.Fatalf("Failed to run migrations: %v", migrateErr)
	}
	log.Println("Database migrations completed")

	bookRepo := repository.NewBookRepository(db)
	userRepo := repository.NewUserRepository(db)

	jwtCfg := &usecase.JWTConfig{Secret: jwtSecret}
	bookUseCase := usecase.NewBookUseCaseSimple(bookRepo)
	authUseCase := usecase.NewAuthUseCase(userRepo, jwtCfg)

	grpcServer := setupGRPCServer(env, bookUseCase, authUseCase)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", port, err)
	}

	go func() {
		log.Printf("gRPC server listening on :%s", port)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	sig := <-sigChan
	log.Printf("Received signal: %v, shutting down...", sig)

	stopped := make(chan struct{})
	go func() {
		grpcServer.GracefulStop()
		close(stopped)
	}()
	select {
	case <-stopped:
		log.Println("gRPC server stopped gracefully")
	case <-time.After(30 * time.Second):
		log.Println("gRPC graceful stop timed out, forcing stop")
		grpcServer.Stop()
	}

	if err := db.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	}

	log.Println("Server shutdown complete")
}

func setupGRPCServer(env string, bookUseCase domainusecase.BookUseCase, authUseCase domainusecase.AuthUseCase) *grpc.Server {
	authInterceptor := middleware.GRPCAuthInterceptor(authUseCase)

	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(authInterceptor),
	)

	bookService := grpchandler.NewBookServiceServer(bookUseCase)
	bookv1.RegisterBookServiceServer(grpcServer, bookService)

	authService := grpchandler.NewAuthServiceServer(authUseCase)
	authv1.RegisterAuthServiceServer(grpcServer, authService)

	// Health checking
	healthServer := health.NewServer()
	healthpb.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)

	if env != "production" {
		reflection.Register(grpcServer)
		log.Println("gRPC reflection enabled")
	}

	log.Println("Registered gRPC services: BookService, AuthService, Health")
	return grpcServer
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
