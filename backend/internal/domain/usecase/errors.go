package usecase

import "errors"

// Sentinel errors for use case layer
var (
	// ErrBookNotFound は、指定された書籍が見つからない、
	// または所有権がない場合に返されます
	ErrBookNotFound = errors.New("book not found")

	// ErrUserAlreadyExists は、登録しようとしたメールアドレスが
	// 既に使用されている場合に返されます
	ErrUserAlreadyExists = errors.New("user with this email already exists")

	// ErrInvalidCredentials は、ログイン時にメールアドレスまたは
	// パスワードが正しくない場合に返されます
	ErrInvalidCredentials = errors.New("invalid email or password")
)
