package auth

import (
	"context"
	"crypto/sha256"
	"fmt"
	"github.com/golang/protobuf/ptypes/empty"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"
	"os"
	database "server/db"
	pb "server/proto"
)

type LoginServer struct {
}

func (s *LoginServer) Login(ctx context.Context, r *pb.LoginRequest) (*pb.UserInfo, error) {
	accountName := r.GetAccountName()
	password := r.GetPassword()
	if accountName == "" || password == "" {
		return nil, status.Error(codes.InvalidArgument, "invalid argument")
	}
	passwordHash := Hash(password)

	db, err := database.GetConnection()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	var user database.User
	if err := db.Get(&user, "SELECT * FROM users WHERE account_name = ? AND password_hash = ?", accountName, passwordHash); err != nil {
		fmt.Println(err)
		return nil, status.Error(codes.InvalidArgument, "invalid account name or password")
	}

	if err := SetLatestTokenToHeader(user.ID, ctx); err != nil {
		return nil, err
	}
	return database.TransUser(&user), nil
}

func (s *LoginServer) LoginWithCredentials(ctx context.Context, _ *empty.Empty) (*pb.UserInfo, error) {
	userId, err := GetUserId(&ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "internal error: %s", err)
	}

	db, err := database.GetConnection()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	var user database.User
	if err := db.Get(&user, "SELECT * FROM users WHERE id = ?", userId); err != nil {
		return nil, status.Error(codes.InvalidArgument, "the user doesn't exist")
	}

	if err := SetLatestTokenToHeader(user.ID, ctx); err != nil {
		return nil, err
	}

	return database.TransUser(&user), nil
}

func (s *LoginServer) Logout(ctx context.Context, _ *empty.Empty) (*empty.Empty, error) {
	cookie := http.Cookie{
		Name:     "token",
		Value:    "",
		MaxAge:   -1,
		Secure:   os.Getenv("HTTP_SECURE") == "true",
		HttpOnly: true,
	}
	md := make(metadata.MD, 1)
	md.Set("set-cookie", cookie.String())

	if err := grpc.SetHeader(ctx, md); err != nil {
		return nil, err
	}

	return &empty.Empty{}, nil
}

func Hash(pw string) []byte {
	salt := os.Getenv("HASH_SALT")
	h := sha256.New()
	h.Write([]byte(salt))
	h.Write([]byte(pw))
	return h.Sum(nil)
}
