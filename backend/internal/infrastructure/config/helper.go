package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// IsDevelopment 開発環境かどうかを判定
func (c *Config) IsDevelopment() bool {
	return c.Server.Environment == "development"
}

// IsProduction 本番環境かどうかを判定
func (c *Config) IsProduction() bool {
	return c.Server.Environment == "production"
}

// IsStaging ステージング環境かどうかを判定
func (c *Config) IsStaging() bool {
	return c.Server.Environment == "staging"
}

// GetDatabaseDSN データベース接続文字列を取得
func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}

// GetRedisAddr Redis接続アドレスを取得
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}

// GetHTTPAddr HTTPサーバーアドレスを取得
func (c *Config) GetHTTPAddr() string {
	return fmt.Sprintf(":%d", c.Server.HTTPPort)
}

// GetGRPCAddr gRPCサーバーアドレスを取得
func (c *Config) GetGRPCAddr() string {
	return fmt.Sprintf(":%d", c.Server.GRPCPort)
}

// MustLoad 設定を読み込み、失敗時はパニック
func MustLoad() *Config {
	config, err := Load()
	if err != nil {
		panic(fmt.Sprintf("設定の読み込みに失敗しました: %v", err))
	}
	return config
}

// MustLoadFromFile ファイルから設定を読み込み、失敗時はパニック
func MustLoadFromFile(filename string) *Config {
	config, err := LoadFromFile(filename)
	if err != nil {
		panic(fmt.Sprintf("設定ファイルの読み込みに失敗しました: %v", err))
	}
	return config
}

// SaveToFile 設定をJSONファイルに保存
func (c *Config) SaveToFile(filename string) error {
	// Clean the filename to prevent path traversal
	cleanPath := filepath.Clean(filename)
	file, err := os.Create(cleanPath)
	if err != nil {
		return fmt.Errorf("設定ファイルの作成に失敗しました: %w", err)
	}
	defer func() { _ = file.Close() }()

	// 機密情報をマスク
	masked := c.maskSensitiveData()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(masked); err != nil {
		return fmt.Errorf("設定ファイルの書き込みに失敗しました: %w", err)
	}

	return nil
}

// maskSensitiveData 機密情報をマスクした設定のコピーを作成
func (c *Config) maskSensitiveData() *Config {
	masked := *c

	// パスワードやAPIキーをマスク
	masked.Database.Password = maskString(c.Database.Password)
	masked.Redis.Password = maskString(c.Redis.Password)
	masked.JWT.Secret = maskString(c.JWT.Secret)
	masked.Storage.S3.AccessKey = maskString(c.Storage.S3.AccessKey)
	masked.Storage.S3.SecretKey = maskString(c.Storage.S3.SecretKey)
	masked.External.RakutenBooks.APIKey = maskString(c.External.RakutenBooks.APIKey)
	masked.External.SendGrid.APIKey = maskString(c.External.SendGrid.APIKey)
	masked.External.Datadog.APIKey = maskString(c.External.Datadog.APIKey)
	masked.External.Datadog.AppKey = maskString(c.External.Datadog.AppKey)

	return &masked
}

// maskString 文字列をマスク（UTF-8対応）
func maskString(s string) string {
	if s == "" {
		return ""
	}

	// UTF-8文字列をruneスライスに変換
	runes := []rune(s)
	if len(runes) <= 4 {
		return "****"
	}

	// 最初の2文字 + **** + 最後の2文字
	return string(runes[:2]) + "****" + string(runes[len(runes)-2:])
}

// PrintConfig 設定を表示（機密情報はマスク）
func (c *Config) PrintConfig() {
	masked := c.maskSensitiveData()
	fmt.Printf("=== アプリケーション設定 ===\n")
	fmt.Printf("環境: %s\n", masked.Server.Environment)
	fmt.Printf("HTTPポート: %d\n", masked.Server.HTTPPort)
	fmt.Printf("gRPCポート: %d\n", masked.Server.GRPCPort)
	fmt.Printf("データベース: %s:%d/%s\n", masked.Database.Host, masked.Database.Port, masked.Database.DBName)
	fmt.Printf("Redis: %s:%d (DB: %d)\n", masked.Redis.Host, masked.Redis.Port, masked.Redis.DB)
	fmt.Printf("キャッシュプロバイダー: %s\n", masked.Redis.Provider)
	fmt.Printf("ストレージプロバイダー: %s\n", masked.Storage.Provider)
	fmt.Printf("ログレベル: %s\n", masked.Logging.Level)
	fmt.Printf("ログフォーマット: %s\n", masked.Logging.Format)
	fmt.Printf("========================\n")
}
