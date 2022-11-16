package service

import (
	"context"
	"github.com/golang/protobuf/ptypes/empty"
	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"reflect"
	database "server/db"
	pb "server/proto"
	"server/service/auth"
)

type UserServer struct {
}

func (s *UserServer) CreateUser(_ context.Context, r *pb.UserCreateRequest) (*pb.UserInfo, error) {
	accountName := r.GetAccountName()
	password := r.GetPassword()
	if accountName == "" || password == "" {
		return nil, status.Error(codes.InvalidArgument, "invalid argument")
	}
	passwordHash := auth.Hash(password)

	db, err := database.GetConnection()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	var user database.User
	_ = db.Get(&user, "SELECT * FROM users WHERE account_name = ? LIMIT 1", accountName)
	if !reflect.DeepEqual(user, database.User{}) {
		return nil, status.Error(codes.AlreadyExists, "the user already exists")
	}

	res, err := db.Exec("INSERT INTO users (account_name, password_hash) VALUES (?, ?) ", accountName, passwordHash)
	if err != nil {
		return nil, status.Error(codes.Internal, "err when create")
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	if err = db.Get(&user, "SELECT * FROM users WHERE id = ?", id); err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return database.TransUser(&user), nil
}

func (s *UserServer) UpdateAccountName(ctx context.Context, r *pb.AccountNameUpdateRequest) (*empty.Empty, error) {
	accountName := r.GetAccountName()
	if accountName == "" {
		return nil, status.Error(codes.InvalidArgument, "invalid argument")
	}

	db, err := database.GetConnection()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	if _, err := db.Exec("UPDATE users SET account_name = ? WHERE id = ?", accountName, userId); err != nil {
		return nil, status.Error(codes.Internal, "internal db error")
	}

	return nil, nil
}

func (s *UserServer) UpdatePassword(ctx context.Context, r *pb.PasswordUpdateRequest) (*empty.Empty, error) {
	oldPassword := r.GetOldPassword()
	newPassword := r.GetNewPassword()
	if oldPassword == "" || newPassword == "" {
		return nil, status.Error(codes.InvalidArgument, "invalid argument")
	}
	oldPasswordHash := auth.Hash(oldPassword)
	newPasswordHash := auth.Hash(newPassword)

	db, err := database.GetConnection()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	var user database.User
	if err := db.Get(&user, "SELECT * FROM users WHERE id = ? AND password_hash = ?", userId, oldPasswordHash); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid old password")
	}

	if _, err := db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", newPasswordHash, userId); err != nil {
		return nil, status.Error(codes.Internal, "internal db error")
	}
	return nil, nil
}

func (s *UserServer) GetUserInfo(_ context.Context, r *pb.UserInfoRequest) (*pb.UserInfo, error) {
	userId := r.GetUserId()

	db, err := database.GetConnection()
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	user, err := GetUserFromUserId(userId, db)
	if err != nil {
		return nil, err
	}

	return database.TransUser(user), nil
}

func GetUserFromUserId(userId uint64, db *sqlx.DB) (*database.User, error) {
	var user database.User
	if err := db.Get(&user, "SELECT * FROM users WHERE id = ?", userId); err != nil {
		return &database.User{}, status.Error(codes.NotFound, "user not found")
	}

	return &user, nil
}

func GetUserFromContext(ctx *context.Context, db *sqlx.DB) (*database.User, error) {
	userId, err := auth.GetUserId(ctx)
	if err != nil {
		return &database.User{}, status.Error(codes.Internal, "internal error")
	}
	return GetUserFromUserId(userId, db)
}
