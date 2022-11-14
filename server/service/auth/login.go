package auth

import (
	"context"
	"github.com/golang/protobuf/ptypes/empty"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"net/http"
	pb "server/proto"
)

type LoginServer struct {
}

func (s *LoginServer) Login(ctx context.Context, r *pb.LoginRequest) (*empty.Empty, error) {
	// Cookieを作成する
	// (7日間の有効期限を例にする)
	cookie := http.Cookie{
		Name:     "token",
		Value:    "token",
		MaxAge:   604800,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	// Metadataの作成する
	md := make(metadata.MD, 1)

	// Cookieを設定する
	md.Set("set-cookie", cookie.String())

	// レスポンスヘッダに設定する
	if err := grpc.SetHeader(ctx, md); err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *LoginServer) Logout(ctx context.Context, _ *empty.Empty) (*empty.Empty, error) {
	return nil, nil
}
