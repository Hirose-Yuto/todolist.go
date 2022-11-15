package auth

import (
	"context"
	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"
	"reflect"
	database "server/db"
	"time"
)

func SetLatestTokenToHeader(userId uint64, ctx context.Context) error {
	token, err := UpdateToken(userId)
	if err != nil {
		return err
	}

	cookie := http.Cookie{
		Name:     "token",
		Value:    (*token).Token,
		Expires:  (*token).ExpiredAt,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	md := make(metadata.MD, 1)
	md.Set("set-cookie", cookie.String())

	if err := grpc.SetHeader(ctx, md); err != nil {
		return err
	}
	return nil
}

func UpdateToken(userId uint64) (*database.UserToken, error) {
	db, err := database.GetConnection()
	if err != nil {
		return &database.UserToken{}, status.Error(codes.Internal, "internal error")
	}

	var token database.UserToken
	if err = db.Get(&token, "SELECT * from user_tokens WHERE user_id = ?", userId); err != nil {
		return &database.UserToken{}, status.Error(codes.Internal, "internal error")
	}
	if reflect.DeepEqual(token, database.UserToken{}) {
		token, err = createDbToken(userId, db)
		if err != nil {
			return &database.UserToken{}, err
		}
	}
	if time.Now().After(token.ExpiredAt) {
		token, err = updateDbToken(token, db)
		if err != nil {
			return &database.UserToken{}, err
		}
	}

	return &token, nil
}

func createDbToken(userId uint64, db *sqlx.DB) (database.UserToken, error) {
	token, err := generateNewToken(userId)
	if err != nil {
		return database.UserToken{}, err
	}
	res, err := db.Exec("INSERT INTO user_tokens (token, user_id, expired_at) VALUES (?, ?, ?)",
		token.Token, token.UserId, token.ExpiredAt)
	if err != nil {
		return database.UserToken{}, status.Error(codes.Internal, "internal error")
	}

	ID, err := res.LastInsertId()
	if err != nil {
		return database.UserToken{}, status.Error(codes.Internal, "internal error")
	}

	token.ID = uint64(ID)

	return token, nil
}

func updateDbToken(token database.UserToken, db *sqlx.DB) (database.UserToken, error) {
	newToken, err := generateNewToken(token.UserId)
	if err != nil {
		return database.UserToken{}, err
	}
	if _, err = db.Exec("UPDATE user_tokens SET token = ?, expired_at = ? WHERE id = ?",
		newToken.Token, newToken.ExpiredAt, token.ID); err != nil {
		return database.UserToken{}, status.Error(codes.Internal, "internal error")
	}
	newToken.ID = token.ID
	return database.UserToken{}, nil
}

func generateNewToken(userId uint64) (database.UserToken, error) {
	return database.UserToken{
		Token:     "token", // ToDo
		ExpiredAt: time.Now().Add(24 * time.Hour),
		UserId:    userId,
	}, nil
}

func IsValidToken(tokenString string) (bool, error) {
	// ToDo
	return tokenString == "token", nil
}
