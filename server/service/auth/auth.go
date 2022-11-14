package auth

import (
	"context"
	"fmt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"
)

var noAuthRoutes = map[string]bool{
	"/user.LoginService/Login":         true,
	"/messenger.Messenger/GetMessages": true,
	//"/messenger.Messenger/CreateMessage": true,
}

func AuthInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		return AuthFunc(ctx, req, info, handler)
	}
}

func AuthFunc(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	fmt.Println()
	fmt.Printf("fullmethod: %s\n", info.FullMethod)
	fmt.Printf("req: %s\n", req)

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(
			codes.Unauthenticated,
			"could not get metadata",
		)
	}
	fmt.Printf("metadata: %s\n", md)

	if _, ok := noAuthRoutes[info.FullMethod]; ok {
		fmt.Println("no need to auth")
		return handler(ctx, req)
	}

	vs := md["cookie"]
	if len(vs) == 0 {
		return nil, status.Error(
			codes.Unauthenticated,
			"no cookie",
		)
	}
	rawCookie := vs[0]
	if len(rawCookie) == 0 {
		return nil, status.Error(
			codes.Unauthenticated,
			"no cookie",
		)
	}

	// Cookie情報をパースする
	parser := &http.Request{Header: http.Header{"cookie": []string{rawCookie}}}

	token, err := parser.Cookie("token")
	fmt.Printf("token: %s\n", token)
	if err != nil {
		return nil, status.Errorf(
			codes.Unauthenticated,
			"could not read auth token: %v",
			err,
		)
	}

	if token.Value != "token" {
		return nil, status.Errorf(
			codes.Unauthenticated,
			"invalid token: %v",
			err,
		)
	}

	return handler(ctx, req)
}
