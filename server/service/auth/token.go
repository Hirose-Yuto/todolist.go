package auth

import (
	"context"
	"fmt"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"
	"os"
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
		Path:     "/",
		Secure:   os.Getenv("HTTP_SECURE") == "true",
		HttpOnly: true,
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
	token, tokenUuid, err := generateNewToken(userId, db)
	if err != nil {
		return database.UserToken{}, err
	}
	res, err := db.Exec("INSERT INTO user_tokens (token, user_id, expired_at) VALUES (?, ?, ?)",
		tokenUuid, token.UserId, token.ExpiredAt)
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
	newToken, tokenUuid, err := generateNewToken(token.UserId, db)
	if err != nil {
		return database.UserToken{}, err
	}
	if _, err = db.Exec("UPDATE user_tokens SET token = ?, expired_at = ? WHERE id = ?",
		tokenUuid, newToken.ExpiredAt, token.ID); err != nil {
		return database.UserToken{}, status.Error(codes.Internal, "internal error")
	}
	newToken.ID = token.ID
	return database.UserToken{}, nil
}

func generateNewToken(userId uint64, db *sqlx.DB) (database.UserToken, string, error) {
	var newUuid string
	for {
		newUuid = uuid.New().String()
		var exist database.ExistCheck
		if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM user_tokens WHERE token = ?) as exist", newUuid); err != nil {
			return database.UserToken{}, "", status.Error(codes.Internal, "internal db error")
		}
		if !exist.Exist {
			break
		}
	}
	claims := jwt.MapClaims{
		"user_id": userId,
		"uuid":    newUuid,
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
	if err != nil {
		return database.UserToken{}, "", status.Error(codes.Internal, "internal sign error")
	}

	return database.UserToken{
		Token:     token,
		ExpiredAt: time.Now().Add(24 * time.Hour),
		UserId:    userId,
	}, newUuid, nil
}

func IsValidToken(tokenString string) (bool, uint64, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("JWT_SECRET_KEY")), nil
	})
	db, err := database.GetConnection()
	if err != nil {
		return false, 0, status.Error(codes.Internal, "internal error")
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userId := uint64(claims["user_id"].(float64))
		tokenUuid := claims["uuid"].(string)
		var exist database.ExistCheck
		if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM user_tokens WHERE user_id = ? AND token = ?) as exist", userId, tokenUuid); err != nil {
			return false, 0, status.Error(codes.Internal, "internal db error")
		}
		if !exist.Exist {
			return false, 0, status.Error(codes.InvalidArgument, "invalid token")
		}
		return true, userId, nil
	} else {
		return false, 0, status.Error(codes.InvalidArgument, "invalid token")
	}
}
