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
	"log"
	"net/http"
	"os"
	database "server/db"
	"time"
)

func SetLatestTokenToHeader(userId uint64, ctx context.Context) error {
	fmt.Println("aaa")
	token, expiredAt, err := UpdateToken(userId)
	if err != nil {
		return err
	}

	cookie := http.Cookie{
		Name:     "token",
		Value:    token,
		Expires:  expiredAt,
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

func UpdateToken(userId uint64) (string, time.Time, error) {
	db, err := database.GetConnection()
	if err != nil {
		return "", time.Now(), status.Error(codes.Internal, "internal error")
	}

	var token string
	var expiredAt time.Time

	var tokenUuid database.UserTokenUuid
	if err = db.Get(&tokenUuid, "SELECT * from user_token_uuids WHERE user_id = ?", userId); err != nil {
		token, expiredAt, err = createDbToken(userId, db)
		if err != nil {
			return "", time.Now(), err
		}
	} else if time.Now().After(tokenUuid.ExpiredAt) {
		token, expiredAt, err = updateDbToken(tokenUuid, db)
		if err != nil {
			return "", time.Now(), err
		}
	} else {
		token, err = createToken(userId, tokenUuid.UUID)
		if err != nil {
			return "", time.Now(), err
		}
		expiredAt = tokenUuid.ExpiredAt
	}

	return token, expiredAt, nil
}

func createDbToken(userId uint64, db *sqlx.DB) (string, time.Time, error) {
	newToken, tokenUuid, expiredAt, err := generateNewToken(userId, db)
	if err != nil {
		return "", time.Now(), err
	}

	_, err = db.Exec("INSERT INTO user_token_uuids (uuid, user_id, expired_at) VALUES (?, ?, ?)",
		tokenUuid, userId, expiredAt)
	if err != nil {
		return "", time.Now(), status.Error(codes.Internal, "internal error")
	}

	if err != nil {
		return "", time.Now(), status.Error(codes.Internal, "internal error")
	}

	return newToken, expiredAt, nil
}

func updateDbToken(token database.UserTokenUuid, db *sqlx.DB) (string, time.Time, error) {
	newToken, tokenUuid, expiredAt, err := generateNewToken(token.UserId, db)
	if err != nil {
		return "", time.Now(), err
	}

	if _, err = db.Exec("UPDATE user_token_uuids SET uuid = ?, expired_at = ? WHERE id = ?",
		tokenUuid, expiredAt, token.ID); err != nil {
		return "", time.Now(), status.Error(codes.Internal, "internal error")
	}
	return newToken, expiredAt, nil
}

func generateNewToken(userId uint64, db *sqlx.DB) (string, string, time.Time, error) {
	var newUuid string
	for {
		newUuid = uuid.New().String()
		var exist database.ExistCheck
		if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM user_token_uuids WHERE uuid = ?) as exist", newUuid); err != nil {
			return "", "", time.Now(), status.Error(codes.Internal, "internal db error")
		}
		if !exist.Exist {
			break
		}
	}
	token, err := createToken(userId, newUuid)
	if err != nil {
		return "", "", time.Now(), err
	}

	return token, newUuid, time.Now().Add(24 * time.Hour), nil
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
		fmt.Println(tokenUuid)
		var exist database.ExistCheck
		if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM user_token_uuids WHERE user_id = ? AND uuid = ?) as exist", userId, tokenUuid); err != nil {
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

func createToken(userId uint64, uuid string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userId,
		"uuid":    uuid,
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(os.Getenv("JWT_SECRET_KEY")))
	if err != nil {
		return "", status.Error(codes.Internal, "internal token error")
	}
	return token, nil
}

func DeleteUserTokenUuids(userId uint64, db *sqlx.DB) error {
	_, err := db.Exec("DELETE FROM user_token_uuids WHERE user_id = ?", userId)
	if err != nil {
		log.Println(err)
		return status.Errorf(codes.Internal, "internal db error")
	}

	return nil
}
