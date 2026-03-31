package database

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"meta-tsundr-backend/internal/domain/entity"
	"meta-tsundr-backend/internal/infrastructure/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DatabaseConfig represents a simplified database configuration used by main.go
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// NewDatabaseFromConfig creates a new Database from a simplified DatabaseConfig
func NewDatabaseFromConfig(cfg *DatabaseConfig) (*Database, error) {
	portInt := 5432
	if cfg.Port != "" {
		p, err := strconv.Atoi(cfg.Port)
		if err != nil {
			return nil, fmt.Errorf("invalid port: %w", err)
		}
		portInt = p
	}

	fullCfg := &config.DatabaseConfig{
		Host:    cfg.Host,
		Port:    portInt,
		User:    cfg.User,
		Password: cfg.Password,
		DBName:  cfg.DBName,
		SSLMode: "disable",
	}
	return NewDatabase(fullCfg)
}

// Database represents the database service
// Primary migration method: Use AutoMigrate() for GORM-based migrations
// Legacy migration method: GetMigrator() and RunMigrations() for manual SQL migrations (deprecated)
type Database struct {
	db       *sql.DB
	gorm     *gorm.DB
	migrator *Migrator // Lazy initialized - only created when GetMigrator() is called
	config   *config.DatabaseConfig
}

// NewDatabase creates a new database service
func NewDatabase(cfg *config.DatabaseConfig) (*Database, error) {
	// Convert config to internal Config
	dbConfig := &Config{
		Host:            cfg.Host,
		Port:            cfg.Port,
		User:            cfg.User,
		Password:        cfg.Password,
		Database:        cfg.DBName,
		SSLMode:         cfg.SSLMode,
		MaxOpenConns:    cfg.MaxOpenConns,
		MaxIdleConns:    cfg.MaxIdleConns,
		ConnMaxLifetime: cfg.ConnMaxLifetime,
	}

	// Create raw SQL connection
	db, err := NewConnection(dbConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create database connection: %w", err)
	}

	// Create GORM connection
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	gormDB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create GORM connection: %w", err)
	}

	// Configure GORM connection pool
	sqlDB, err := gormDB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	if cfg.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	}
	if cfg.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	}
	if cfg.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	}

	// Note: Migrator is now optional (lazy initialization)
	// Use AutoMigrate() for GORM-based migrations instead

	return &Database{
		db:       db,
		gorm:     gormDB,
		migrator: nil, // Lazy initialization - created only when needed
		config:   cfg,
	}, nil
}

// GetDB returns the raw database connection
func (d *Database) GetDB() *sql.DB {
	return d.db
}

// GetGORM returns the GORM database connection
func (d *Database) GetGORM() *gorm.DB {
	return d.gorm
}

// GetMigrator returns the migrator (lazy initialization).
// This method is kept for backward compatibility and testing purposes.
//
// Deprecated: Use AutoMigrate() for GORM-based migrations instead.
func (d *Database) GetMigrator() *Migrator {
	if d.migrator == nil {
		d.migrator = NewMigrator(d.db)
	}
	return d.migrator
}

// HealthCheck performs a health check
func (d *Database) HealthCheck(ctx context.Context) error {
	return HealthCheck(ctx, d.db)
}

// GetStats returns connection statistics
func (d *Database) GetStats() (*ConnectionStats, error) {
	return GetConnectionStats(d.db)
}

// GetDetailedStats returns detailed connection statistics
func (d *Database) GetDetailedStats() (*DetailedConnectionStats, error) {
	if d.db == nil {
		return nil, fmt.Errorf("database connection is nil")
	}

	// データベースが閉じられているかチェック
	ctx, cancel := context.WithTimeout(context.Background(), time.Millisecond*100)
	defer cancel()

	if err := d.db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("database connection is closed: %w", err)
	}

	stats := d.db.Stats()

	return &DetailedConnectionStats{
		MaxOpenConnections: stats.MaxOpenConnections,
		OpenConnections:    stats.OpenConnections,
		InUse:              stats.InUse,
		Idle:               stats.Idle,
		WaitCount:          stats.WaitCount,
		WaitDuration:       stats.WaitDuration,
		MaxIdleClosed:      stats.MaxIdleClosed,
		MaxIdleTimeClosed:  stats.MaxIdleTimeClosed,
		MaxLifetimeClosed:  stats.MaxLifetimeClosed,
	}, nil
}

// RunMigrations runs all pending migrations using the manual SQL migrator.
// This method is kept for backward compatibility and testing purposes.
//
// Deprecated: Use AutoMigrate() for GORM-based migrations instead.
func (d *Database) RunMigrations(ctx context.Context) error {
	return d.GetMigrator().RunMigrations(ctx)
}

// AutoMigrate runs GORM auto migration
// This is the recommended method for database schema migrations.
func (d *Database) AutoMigrate() error {
	return d.gorm.AutoMigrate(
		&entity.User{},
		&entity.Book{},
	)
}

// Close closes the database connection
func (d *Database) Close() error {
	if d.gorm != nil {
		sqlDB, err := d.gorm.DB()
		if err != nil {
			return fmt.Errorf("failed to get GORM sql.DB: %w", err)
		}
		if err := sqlDB.Close(); err != nil {
			return fmt.Errorf("failed to close GORM connection: %w", err)
		}
	}

	return d.db.Close()
}
