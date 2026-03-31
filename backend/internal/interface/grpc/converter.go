package grpc

import (
	authv1 "meta-tsundr-backend/api/proto/tsundoku/auth/v1"
	bookv1 "meta-tsundr-backend/api/proto/tsundoku/book/v1"
	userv1 "meta-tsundr-backend/api/proto/tsundoku/user/v1"
	"meta-tsundr-backend/internal/domain/entity"

	"google.golang.org/protobuf/types/known/timestamppb"
)

func BookStatusToProto(status entity.BookStatus) bookv1.BookStatus {
	switch status {
	case entity.BookStatusUnread:
		return bookv1.BookStatus_BOOK_STATUS_UNREAD
	case entity.BookStatusReading:
		return bookv1.BookStatus_BOOK_STATUS_READING
	case entity.BookStatusFinished:
		return bookv1.BookStatus_BOOK_STATUS_FINISHED
	default:
		return bookv1.BookStatus_BOOK_STATUS_UNSPECIFIED
	}
}

func BookStatusFromProto(status bookv1.BookStatus) entity.BookStatus {
	switch status {
	case bookv1.BookStatus_BOOK_STATUS_UNREAD:
		return entity.BookStatusUnread
	case bookv1.BookStatus_BOOK_STATUS_READING:
		return entity.BookStatusReading
	case bookv1.BookStatus_BOOK_STATUS_FINISHED:
		return entity.BookStatusFinished
	default:
		return entity.BookStatusUnread
	}
}

func BookToProto(book *entity.Book) *bookv1.Book {
	if book == nil {
		return nil
	}

	return &bookv1.Book{
		Id:        book.ID,
		UserId:    book.UserID,
		Title:     book.Title,
		Author:    book.Author,
		Isbn:      book.ISBN,
		Status:    BookStatusToProto(book.Status),
		ImageUrl:  book.ImageURL,
		CreatedAt: timestamppb.New(book.CreatedAt),
		UpdatedAt: timestamppb.New(book.UpdatedAt),
	}
}

func UserToProto(user *entity.User) *userv1.User {
	if user == nil {
		return nil
	}

	return &userv1.User{
		Id:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		CreatedAt: timestamppb.New(user.CreatedAt),
		UpdatedAt: timestamppb.New(user.UpdatedAt),
	}
}

func AuthResponseToProto(resp *entity.User, token string, expiresAt int64) *authv1.AuthResponse {
	return &authv1.AuthResponse{
		Token:     token,
		User:      UserToProto(resp),
		ExpiresAt: expiresAt,
	}
}
