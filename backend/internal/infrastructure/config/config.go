package config

import (
	"time"
)

// Config アプリケーション全体の設定
type Config struct {
	Server       ServerConfig       `json:"server"`
	Database     DatabaseConfig     `json:"database"`
	Redis        RedisConfig        `json:"redis"`
	JWT          JWTConfig          `json:"jwt"`
	Storage      StorageConfig      `json:"storage"`
	LocalStorage LocalStorageConfig `json:"local_storage"`
	External     ExternalConfig     `json:"external"`
	Logging      LoggingConfig      `json:"logging"`
}

// ServerConfig サーバー設定
type ServerConfig struct {
	HTTPPort    int           `json:"http_port"`
	GRPCPort    int           `json:"grpc_port"`
	Environment string        `json:"environment"`
	Timeout     time.Duration `json:"timeout"`
}

// DatabaseConfig データベース設定
type DatabaseConfig struct {
	Driver          string        `json:"driver"` // "postgres" (default), "mysql", "sqlite", "sqlserver"
	Host            string        `json:"host"`
	Port            int           `json:"port"`
	User            string        `json:"user"`
	Password        string        `json:"password"`
	DBName          string        `json:"db_name"`
	SSLMode         string        `json:"ssl_mode"`
	MaxOpenConns    int           `json:"max_open_conns"`
	MaxIdleConns    int           `json:"max_idle_conns"`
	ConnMaxLifetime time.Duration `json:"conn_max_lifetime"`
}

// RedisConfig Redis設定
type RedisConfig struct {
	Host         string        `json:"host"`
	Port         int           `json:"port"`
	Password     string        `json:"password"`
	DB           int           `json:"db"`
	PoolSize     int           `json:"pool_size"`
	MinIdleConns int           `json:"min_idle_conns"`
	DialTimeout  time.Duration `json:"dial_timeout"`
	ReadTimeout  time.Duration `json:"read_timeout"`
	WriteTimeout time.Duration `json:"write_timeout"`
	Provider     string        `json:"provider"` // "redis" or "valkey"
}

// JWTConfig JWT設定
type JWTConfig struct {
	Secret     string        `json:"secret"`
	Expiration time.Duration `json:"expiration"`
	Issuer     string        `json:"issuer"`
}

// StorageConfig ストレージ設定
type StorageConfig struct {
	Provider     string             `json:"provider"` // "s3", "gcs", or "local"
	S3           S3Config           `json:"s3"`
	GCS          GCSConfig          `json:"gcs"`
	LocalStorage LocalStorageConfig `json:"local_storage"`
}

// S3Config AWS S3設定
type S3Config struct {
	Region      string `json:"region"`
	Bucket      string `json:"bucket"`
	AccessKey   string `json:"access_key"`
	SecretKey   string `json:"secret_key"`
	UseIAMRole  bool   `json:"use_iam_role"` // IAMロールを使用するかどうか
	RoleArn     string `json:"role_arn"`     // 使用するIAMロールのARN
	SessionName string `json:"session_name"` // セッション名
	ExternalID  string `json:"external_id"`  // 外部ID（必要に応じて）
}

// GCSConfig Google Cloud Storage設定
type GCSConfig struct {
	ProjectID       string `json:"project_id"`
	BucketName      string `json:"bucket_name"`
	CredentialsFile string `json:"credentials_file"`
	BaseURL         string `json:"base_url"`
}

// LocalStorageConfig ローカルストレージ設定
type LocalStorageConfig struct {
	BasePath string `json:"base_path"`
	BaseURL  string `json:"base_url"`
}

// ExternalConfig 外部API設定
type ExternalConfig struct {
	RakutenBooks RakutenBooksConfig `json:"rakuten_books"`
	SendGrid     SendGridConfig     `json:"sendgrid"`
	Datadog      DatadogConfig      `json:"datadog"`
}

// RakutenBooksConfig 楽天ブックスAPI設定
type RakutenBooksConfig struct {
	APIKey  string `json:"api_key"`
	BaseURL string `json:"base_url"`
}

// SendGridConfig SendGrid設定
type SendGridConfig struct {
	APIKey   string `json:"api_key"`
	FromName string `json:"from_name"`
	FromMail string `json:"from_mail"`
}

// DatadogConfig Datadog設定
type DatadogConfig struct {
	APIKey string `json:"api_key"`
	AppKey string `json:"app_key"`
	Site   string `json:"site"`
}

// LoggingConfig ログ設定
type LoggingConfig struct {
	Level  string `json:"level"`
	Format string `json:"format"` // "json" or "text"
}
