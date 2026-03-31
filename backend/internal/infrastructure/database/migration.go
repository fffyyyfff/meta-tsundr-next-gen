package database

import (
	"context"
	"database/sql"
	"fmt"
)

// Migration represents a database migration
type Migration struct {
	Version int
	Name    string
	Up      string
	Down    string
}

// Migrator handles database migrations
type Migrator struct {
	db *sql.DB
}

// NewMigrator creates a new migrator instance
func NewMigrator(db *sql.DB) *Migrator {
	return &Migrator{db: db}
}

// CreateMigrationsTable creates the migrations tracking table
func (m *Migrator) CreateMigrationsTable(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`

	_, err := m.db.ExecContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	return nil
}

// GetAppliedMigrations returns a list of applied migration versions
func (m *Migrator) GetAppliedMigrations(ctx context.Context) ([]int, error) {
	query := "SELECT version FROM schema_migrations ORDER BY version"

	rows, err := m.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query applied migrations: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var versions []int
	for rows.Next() {
		var version int
		if err := rows.Scan(&version); err != nil {
			return nil, fmt.Errorf("failed to scan migration version: %w", err)
		}
		versions = append(versions, version)
	}

	return versions, nil
}

// ApplyMigration applies a single migration
func (m *Migrator) ApplyMigration(ctx context.Context, migration *Migration) error {
	tx, err := m.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	// Execute the migration
	_, err = tx.ExecContext(ctx, migration.Up)
	if err != nil {
		return fmt.Errorf("failed to execute migration %d: %w", migration.Version, err)
	}

	// Record the migration
	_, err = tx.ExecContext(ctx,
		"INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
		migration.Version, migration.Name)
	if err != nil {
		return fmt.Errorf("failed to record migration %d: %w", migration.Version, err)
	}

	return tx.Commit()
}

// RollbackMigration rolls back a single migration
func (m *Migrator) RollbackMigration(ctx context.Context, migration *Migration) error {
	tx, err := m.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	// Execute the rollback
	_, err = tx.ExecContext(ctx, migration.Down)
	if err != nil {
		return fmt.Errorf("failed to rollback migration %d: %w", migration.Version, err)
	}

	// Remove the migration record
	_, err = tx.ExecContext(ctx,
		"DELETE FROM schema_migrations WHERE version = $1",
		migration.Version)
	if err != nil {
		return fmt.Errorf("failed to remove migration record %d: %w", migration.Version, err)
	}

	return tx.Commit()
}

// RunMigrations runs all pending migrations
func (m *Migrator) RunMigrations(ctx context.Context) error {
	// Create migrations table if it doesn't exist
	if err := m.CreateMigrationsTable(ctx); err != nil {
		return err
	}

	// Get applied migrations
	applied, err := m.GetAppliedMigrations(ctx)
	if err != nil {
		return err
	}

	// Get all available migrations
	allMigrations := GetMigrations()

	// Apply pending migrations
	for _, migration := range allMigrations {
		if !contains(applied, migration.Version) {
			if err := m.ApplyMigration(ctx, migration); err != nil {
				return err
			}
		}
	}

	return nil
}

// GetPendingMigrations returns a list of pending migrations
func (m *Migrator) GetPendingMigrations(ctx context.Context) ([]*Migration, error) {
	// Get applied migrations
	applied, err := m.GetAppliedMigrations(ctx)
	if err != nil {
		return nil, err
	}

	// Get all available migrations
	allMigrations := GetMigrations()

	// Filter pending migrations
	var pending []*Migration
	for _, migration := range allMigrations {
		if !contains(applied, migration.Version) {
			pending = append(pending, migration)
		}
	}

	return pending, nil
}

// contains checks if a slice contains a specific version
func contains(slice []int, version int) bool {
	for _, v := range slice {
		if v == version {
			return true
		}
	}
	return false
}
