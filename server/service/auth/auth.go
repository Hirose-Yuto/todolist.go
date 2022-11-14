package auth

import (
	"context"
	"fmt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"regexp"
)

var noAuthRoutes = map[string]bool{
	"/user.LoginService/Login":         true,
	"/messenger.Messenger/GetMessages": true,
	//"/messenger.Messenger/CreateMessage": true,
}

var tokenRegex = regexp.MustCompile("token=[^;]+;")

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
	fmt.Printf("rawCookie %s\n", vs[0])

	regexResult := tokenRegex.FindString(vs[0])
	if regexResult == "" {
		return nil, status.Error(
			codes.Unauthenticated,
			"no cookie",
		)
	}
	fmt.Println(regexResult)

	// token=[^;]+;
	token := regexResult[6 : len(regexResult)-1]
	fmt.Printf("token: %s\n", token)

	if token != "token" {
		return nil, status.Errorf(
			codes.Unauthenticated,
			"invalid token: %v",
			token,
		)
	}

	return handler(ctx, req)
}
