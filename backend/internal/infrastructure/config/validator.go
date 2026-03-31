package config

import (
	"errors"
	"fmt"
	"net/url"
	"strings"
)

// Validate 設定の妥当性を検証
func (c *Config) Validate() error {
	var errs []string

	// サーバー設定の検証
	if err := c.Server.Validate(); err != nil {
		errs = append(errs, fmt.Sprintf("サーバー設定: %v", err))
	}

	// データベース設定の検証
	if err := c.Database.Validate(); err != nil {
		errs = append(errs, fmt.Sprintf("データベース設定: %v", err))
	}

	// Redis設定の検証
	if err := c.Redis.Validate(); err != nil {
		errs = append(errs, fmt.Sprintf("Redis設定: %v", err))
	}

	// JWT設定の検証
	if err := c.JWT.Validate(); err != nil {
		errs = append(errs, fmt.Sprintf("JWT設定: %v", err))
	}

	// ストレージ設定の検証
	if err := c.Storage.Validate(); err != nil {
		errs = append(errs, fmt.Sprintf("ストレージ設定: %v", err))
	}

	// ログ設定の検証
	if err := c.Logging.Validate(); err != nil {
		errs = append(errs, fmt.Sprintf("ログ設定: %v", err))
	}

	if len(errs) > 0 {
		return errors.New(strings.Join(errs, "; "))
	}

	return nil
}

// Validate サーバー設定の検証
func (s *ServerConfig) Validate() error {
	if s.HTTPPort <= 0 || s.HTTPPort > 65535 {
		return errors.New("HTTPポートは1-65535の範囲で指定してください")
	}

	if s.GRPCPort <= 0 || s.GRPCPort > 65535 {
		return errors.New("gRPCポートは1-65535の範囲で指定してください")
	}

	if s.HTTPPort == s.GRPCPort {
		return errors.New("HTTPポートとgRPCポートは異なる値を指定してください")
	}

	validEnvs := []string{"development", "staging", "production"}
	if !contains(validEnvs, s.Environment) {
		return fmt.Errorf("環境は %v のいずれかを指定してください", validEnvs)
	}

	return nil
}

// Validate データベース設定の検証
func (d *DatabaseConfig) Validate() error {
	if d.Host == "" {
		return errors.New("データベースホストは必須です")
	}

	if d.Port <= 0 || d.Port > 65535 {
		return errors.New("データベースポートは1-65535の範囲で指定してください")
	}

	if d.User == "" {
		return errors.New("データベースユーザーは必須です")
	}

	if d.DBName == "" {
		return errors.New("データベース名は必須です")
	}

	validSSLModes := []string{"disable", "require", "verify-ca", "verify-full"}
	if !contains(validSSLModes, d.SSLMode) {
		return fmt.Errorf("SSLモードは %v のいずれかを指定してください", validSSLModes)
	}

	if d.MaxOpenConns <= 0 {
		return errors.New("最大接続数は1以上を指定してください")
	}

	if d.MaxIdleConns < 0 {
		return errors.New("最大アイドル接続数は0以上を指定してください")
	}

	if d.MaxIdleConns > d.MaxOpenConns {
		return errors.New("最大アイドル接続数は最大接続数以下を指定してください")
	}

	return nil
}

// Validate Redis設定の検証
func (r *RedisConfig) Validate() error {
	if r.Host == "" {
		return errors.New("Redisホストは必須です")
	}

	if r.Port <= 0 || r.Port > 65535 {
		return errors.New("Redisポートは1-65535の範囲で指定してください")
	}

	if r.DB < 0 || r.DB > 15 {
		return errors.New("RedisデータベースIDは0-15の範囲で指定してください")
	}

	if r.PoolSize <= 0 {
		return errors.New("プールサイズは1以上を指定してください")
	}

	if r.MinIdleConns < 0 {
		return errors.New("最小アイドル接続数は0以上を指定してください")
	}

	validProviders := []string{"redis", "valkey"}
	if !contains(validProviders, r.Provider) {
		return fmt.Errorf("キャッシュプロバイダーは %v のいずれかを指定してください", validProviders)
	}

	return nil
}

// Validate JWT設定の検証
func (j *JWTConfig) Validate() error {
	if j.Secret == "" {
		return errors.New("JWTシークレットは必須です")
	}

	if len(j.Secret) < 32 {
		return errors.New("JWTシークレットは32文字以上を指定してください")
	}

	if j.Expiration <= 0 {
		return errors.New("JWT有効期限は正の値を指定してください")
	}

	if j.Issuer == "" {
		return errors.New("JWT発行者は必須です")
	}

	return nil
}

// Validate ストレージ設定の検証
func (s *StorageConfig) Validate() error {
	validProviders := []string{"s3", "gcs"}
	if !contains(validProviders, s.Provider) {
		return fmt.Errorf("ストレージプロバイダーは %v のいずれかを指定してください", validProviders)
	}

	switch s.Provider {
	case "s3":
		return s.S3.Validate()
	case "gcs":
		return s.GCS.Validate()
	}

	return nil
}

// Validate S3設定の検証
func (s *S3Config) Validate() error {
	if s.Region == "" {
		return errors.New("AWS リージョンは必須です")
	}

	// バケット名は開発環境では必須ではない（テスト用）
	if s.Bucket == "" {
		fmt.Println("警告: S3 バケット名が設定されていません")
	}

	// 認証方法の検証
	if s.UseIAMRole {
		// IAMロールを使用する場合
		if s.RoleArn != "" && s.SessionName == "" {
			return errors.New("IAMロールを使用する場合、セッション名は必須です")
		}
		fmt.Println("情報: IAMロール認証を使用します")
	} else if s.AccessKey == "" || s.SecretKey == "" {
		// 開発環境では警告のみ
		fmt.Println("警告: AWS認証情報が設定されていません（IAMロールまたはデフォルトクレデンシャルを使用）")
	}

	return nil
}

// Validate GCS設定の検証
func (g *GCSConfig) Validate() error {
	if g.ProjectID == "" {
		return errors.New("GCP プロジェクトIDは必須です")
	}

	if g.BucketName == "" {
		return errors.New("GCS バケット名は必須です")
	}

	return nil
}

// Validate ローカルストレージ設定の検証
func (l *LocalStorageConfig) Validate() error {
	if l.BasePath == "" {
		return errors.New("ローカルストレージのベースパスは必須です")
	}

	return nil
}

// Validate ログ設定の検証
func (l *LoggingConfig) Validate() error {
	validLevels := []string{"debug", "info", "warn", "error", "fatal"}
	if !contains(validLevels, l.Level) {
		return fmt.Errorf("ログレベルは %v のいずれかを指定してください", validLevels)
	}

	validFormats := []string{"json", "text"}
	if !contains(validFormats, l.Format) {
		return fmt.Errorf("ログフォーマットは %v のいずれかを指定してください", validFormats)
	}

	return nil
}

// contains スライスに要素が含まれているかチェック
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// IsValidURL URLの妥当性をチェック
func IsValidURL(str string) bool {
	u, err := url.Parse(str)
	return err == nil && u.Scheme != "" && u.Host != ""
}
