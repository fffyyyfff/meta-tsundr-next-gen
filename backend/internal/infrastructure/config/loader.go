package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Load 環境変数から設定を読み込む
func Load() (*Config, error) {
	config := &Config{}

	// サーバー設定
	config.Server = ServerConfig{
		HTTPPort:    getEnvAsInt("HTTP_PORT", 8080),
		GRPCPort:    getEnvAsInt("GRPC_PORT", 50051),
		Environment: getEnv("ENVIRONMENT", "development"),
		Timeout:     getEnvAsDuration("SERVER_TIMEOUT", 30*time.Second),
	}

	// データベース設定
	config.Database = DatabaseConfig{
		Host:            getEnv("DB_HOST", "localhost"),
		Port:            getEnvAsInt("DB_PORT", 5432),
		User:            getEnv("DB_USER", "postgres"),
		Password:        getEnv("DB_PASSWORD", ""),
		DBName:          getEnv("DB_NAME", "tsundoku"),
		SSLMode:         getEnv("DB_SSL_MODE", "disable"),
		MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
		MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
		ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
	}

	// Redis設定
	config.Redis = RedisConfig{
		Host:         getEnv("REDIS_HOST", "localhost"),
		Port:         getEnvAsInt("REDIS_PORT", 6379),
		Password:     getEnv("REDIS_PASSWORD", ""),
		DB:           getEnvAsInt("REDIS_DB", 0),
		PoolSize:     getEnvAsInt("REDIS_POOL_SIZE", 10),
		MinIdleConns: getEnvAsInt("REDIS_MIN_IDLE_CONNS", 2),
		DialTimeout:  getEnvAsDuration("REDIS_DIAL_TIMEOUT", 5*time.Second),
		ReadTimeout:  getEnvAsDuration("REDIS_READ_TIMEOUT", 3*time.Second),
		WriteTimeout: getEnvAsDuration("REDIS_WRITE_TIMEOUT", 3*time.Second),
		Provider:     getEnv("CACHE_PROVIDER", "redis"), // "redis" or "valkey"
	}

	// JWT設定
	config.JWT = JWTConfig{
		Secret:     getEnv("JWT_SECRET", "your-secret-key"),
		Expiration: getEnvAsDuration("JWT_EXPIRATION", 24*time.Hour),
		Issuer:     getEnv("JWT_ISSUER", "tsundoku-app"),
	}

	// ストレージ設定
	config.Storage = StorageConfig{
		Provider: getEnv("STORAGE_PROVIDER", "s3"), // "s3" or "gcs"
		S3: S3Config{
			Region:      getEnv("AWS_REGION", "us-east-1"),
			Bucket:      getEnv("AWS_S3_BUCKET", ""),
			AccessKey:   getEnv("AWS_ACCESS_KEY_ID", ""),
			SecretKey:   getEnv("AWS_SECRET_ACCESS_KEY", ""),
			UseIAMRole:  getEnvAsBool("AWS_USE_IAM_ROLE", false),
			RoleArn:     getEnv("AWS_ROLE_ARN", ""),
			SessionName: getEnv("AWS_SESSION_NAME", "tsundoku-app"),
			ExternalID:  getEnv("AWS_EXTERNAL_ID", ""),
		},
		GCS: GCSConfig{
			ProjectID:       getEnv("GCP_PROJECT_ID", ""),
			BucketName:      getEnv("GCS_BUCKET", ""),
			CredentialsFile: getEnv("GOOGLE_APPLICATION_CREDENTIALS", ""),
			BaseURL:         getEnv("GCS_BASE_URL", ""),
		},
		LocalStorage: LocalStorageConfig{
			BasePath: getEnv("LOCAL_STORAGE_BASE_PATH", "/tmp/tsundoku/images"),
			BaseURL:  getEnv("LOCAL_STORAGE_BASE_URL", ""),
		},
	}

	// 外部API設定
	config.External = ExternalConfig{
		RakutenBooks: RakutenBooksConfig{
			APIKey:  getEnv("RAKUTEN_BOOKS_API_KEY", ""),
			BaseURL: getEnv("RAKUTEN_BOOKS_BASE_URL", "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404"),
		},
		SendGrid: SendGridConfig{
			APIKey:   getEnv("SENDGRID_API_KEY", ""),
			FromName: getEnv("SENDGRID_FROM_NAME", "Tsundoku App"),
			FromMail: getEnv("SENDGRID_FROM_MAIL", "noreply@tsundoku.app"),
		},
		Datadog: DatadogConfig{
			APIKey: getEnv("DATADOG_API_KEY", ""),
			AppKey: getEnv("DATADOG_APP_KEY", ""),
			Site:   getEnv("DATADOG_SITE", "datadoghq.com"),
		},
	}

	// ログ設定
	config.Logging = LoggingConfig{
		Level:  getEnv("LOG_LEVEL", "info"),
		Format: getEnv("LOG_FORMAT", "json"),
	}

	// 設定の検証
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("設定の検証に失敗しました: %w", err)
	}

	return config, nil
}

// LoadFromFile JSONファイルから設定を読み込む
func LoadFromFile(filename string) (*Config, error) {
	// Clean the filename to prevent path traversal
	cleanPath := filepath.Clean(filename)
	file, err := os.Open(cleanPath)
	if err != nil {
		return nil, fmt.Errorf("設定ファイルを開けませんでした: %w", err)
	}
	defer func() { _ = file.Close() }()

	config := &Config{}
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(config); err != nil {
		return nil, fmt.Errorf("設定ファイルの解析に失敗しました: %w", err)
	}

	// 環境変数で上書き
	config = mergeWithEnv(config)

	// 設定の検証
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("設定の検証に失敗しました: %w", err)
	}

	return config, nil
}

// mergeWithEnv 環境変数で設定を上書き
func mergeWithEnv(config *Config) *Config {
	// 重要な設定のみ環境変数で上書き
	if val := os.Getenv("DB_PASSWORD"); val != "" {
		config.Database.Password = val
	}
	if val := os.Getenv("REDIS_PASSWORD"); val != "" {
		config.Redis.Password = val
	}
	if val := os.Getenv("JWT_SECRET"); val != "" {
		config.JWT.Secret = val
	}
	if val := os.Getenv("AWS_ACCESS_KEY_ID"); val != "" {
		config.Storage.S3.AccessKey = val
	}
	if val := os.Getenv("AWS_SECRET_ACCESS_KEY"); val != "" {
		config.Storage.S3.SecretKey = val
	}

	return config
}

// getEnv 環境変数を取得（デフォルト値付き）
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt 環境変数を整数として取得
func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// getEnvAsDuration 環境変数を時間として取得
func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

// getEnvAsBool 環境変数をboolとして取得
func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		switch strings.ToLower(value) {
		case "true", "1", "yes", "on":
			return true
		case "false", "0", "no", "off":
			return false
		}
	}
	return defaultValue
}
