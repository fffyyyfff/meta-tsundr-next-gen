package database

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"meta-tsundr-backend/internal/domain/entity"
	"meta-tsundr-backend/internal/infrastructure/config"

	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DatabaseConfig represents a simplified database configuration used by main.go
type DatabaseConfig struct {
	Driver   string
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// NewDatabaseFromConfig creates a new Database from a simplified DatabaseConfig
func NewDatabaseFromConfig(cfg *DatabaseConfig) (*Database, error) {
	driver := cfg.Driver
	if driver == "" {
		driver = "postgres"
	}

	portInt := 5432
	if cfg.Port != "" {
		p, err := strconv.Atoi(cfg.Port)
		if err != nil {
			return nil, fmt.Errorf("invalid port: %w", err)
		}
		portInt = p
	}

	fullCfg := &config.DatabaseConfig{
		Driver:  driver,
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

// buildDialector returns the appropriate GORM dialector based on the driver name.
func buildDialector(cfg *config.DatabaseConfig) (gorm.Dialector, error) {
	driver := cfg.Driver
	if driver == "" {
		driver = "postgres"
	}

	switch driver {
	case "postgres":
		dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)
		return postgres.Open(dsn), nil
	case "mysql":
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true",
			cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName)
		return mysql.Open(dsn), nil
	case "sqlite":
		dsn := fmt.Sprintf("file:%s?cache=shared", cfg.DBName)
		return sqlite.Open(dsn), nil
	case "sqlserver":
		dsn := fmt.Sprintf("sqlserver://%s:%s@%s:%d?database=%s",
			cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName)
		return sqlserver.Open(dsn), nil
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", driver)
	}
}

// NewDatabase creates a new database service
func NewDatabase(cfg *config.DatabaseConfig) (*Database, error) {
	dialector, err := buildDialector(cfg)
	if err != nil {
		return nil, err
	}

	// Create GORM connection
	gormDB, err := gorm.Open(dialector, &gorm.Config{
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

	return &Database{
		db:       sqlDB,
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

// Close closes the database connection.
// Since db is obtained from gorm.DB(), closing it once is sufficient.
func (d *Database) Close() error {
	if d.db != nil {
		return d.db.Close()
	}
	return nil
}
