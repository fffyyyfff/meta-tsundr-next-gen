package grpc

import (
	"context"
	"errors"

	bookv1 "meta-tsundr-backend/api/proto/tsundoku/book/v1"
	"meta-tsundr-backend/internal/domain/entity"
	domainusecase "meta-tsundr-backend/internal/domain/usecase"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type BookServiceServer struct {
	bookv1.UnimplementedBookServiceServer
	bookUseCase domainusecase.BookUseCase
}

func NewBookServiceServer(bookUseCase domainusecase.BookUseCase) *BookServiceServer {
	return &BookServiceServer{bookUseCase: bookUseCase}
}

func (s *BookServiceServer) CreateBook(ctx context.Context, req *bookv1.CreateBookRequest) (*bookv1.Book, error) {
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	if req.Title == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if req.Author == "" {
		return nil, status.Error(codes.InvalidArgument, "author is required")
	}

	bookStatus := BookStatusFromProto(req.Status)
	if bookStatus == "" {
		bookStatus = entity.BookStatusUnread
	}

	usecaseReq := &domainusecase.CreateBookRequest{
		UserID: userID,
		Title:  req.Title,
		Author: req.Author,
		ISBN:   req.Isbn,
		Status: bookStatus,
	}

	book, err := s.bookUseCase.CreateBook(ctx, usecaseReq)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return BookToProto(book), nil
}

func (s *BookServiceServer) GetBooks(ctx context.Context, req *bookv1.GetBooksRequest) (*bookv1.GetBooksResponse, error) {
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	var statusFilter *entity.BookStatus
	if req.Status != nil && *req.Status != bookv1.BookStatus_BOOK_STATUS_UNSPECIFIED {
		s := BookStatusFromProto(*req.Status)
		statusFilter = &s
	}

	books, err := s.bookUseCase.GetBooks(ctx, userID, statusFilter)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	protoBooks := make([]*bookv1.Book, len(books))
	for i, book := range books {
		protoBooks[i] = BookToProto(book)
	}

	return &bookv1.GetBooksResponse{Books: protoBooks}, nil
}

func (s *BookServiceServer) GetBook(ctx context.Context, req *bookv1.GetBookRequest) (*bookv1.Book, error) {
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	book, err := s.bookUseCase.GetBookByID(ctx, req.Id, userID)
	if err != nil {
		if errors.Is(err, domainusecase.ErrBookNotFound) {
			return nil, status.Error(codes.NotFound, "book not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return BookToProto(book), nil
}

func (s *BookServiceServer) UpdateBook(ctx context.Context, req *bookv1.UpdateBookRequest) (*bookv1.Book, error) {
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	if req.Title == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if req.Author == "" {
		return nil, status.Error(codes.InvalidArgument, "author is required")
	}

	usecaseReq := &domainusecase.UpdateBookRequest{
		BookID: req.Id,
		UserID: userID,
		Title:  req.Title,
		Author: req.Author,
		ISBN:   req.Isbn,
		Status: BookStatusFromProto(req.Status),
	}

	book, err := s.bookUseCase.UpdateBook(ctx, usecaseReq)
	if err != nil {
		if errors.Is(err, domainusecase.ErrBookNotFound) {
			return nil, status.Error(codes.NotFound, "book not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return BookToProto(book), nil
}

func (s *BookServiceServer) UpdateBookStatus(ctx context.Context, req *bookv1.UpdateBookStatusRequest) (*bookv1.Book, error) {
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	usecaseReq := &domainusecase.UpdateBookStatusRequest{
		BookID: req.Id,
		UserID: userID,
		Status: BookStatusFromProto(req.Status),
	}

	book, err := s.bookUseCase.UpdateBookStatus(ctx, usecaseReq)
	if err != nil {
		if errors.Is(err, domainusecase.ErrBookNotFound) {
			return nil, status.Error(codes.NotFound, "book not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return BookToProto(book), nil
}

func (s *BookServiceServer) DeleteBook(ctx context.Context, req *bookv1.DeleteBookRequest) (*bookv1.DeleteBookResponse, error) {
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	err = s.bookUseCase.DeleteBook(ctx, req.Id, userID)
	if err != nil {
		if errors.Is(err, domainusecase.ErrBookNotFound) {
			return nil, status.Error(codes.NotFound, "book not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &bookv1.DeleteBookResponse{Success: true}, nil
}
