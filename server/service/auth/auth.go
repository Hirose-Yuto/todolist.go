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

func Interceptor() grpc.UnaryServerInterceptor {
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
		return nil, status.Error(codes.Unauthenticated, "could not get metadata")
	}
	fmt.Printf("metadata: %s\n", md)

	if _, ok := noAuthRoutes[info.FullMethod]; ok {
		fmt.Println("no need to auth")
		return handler(ctx, req)
	}

	vs := md["cookie"]
	if len(vs) == 0 {
		return nil, status.Error(codes.Unauthenticated, "no cookie")
	}

	regexResult := tokenRegex.FindString(vs[0])
	if regexResult == "" {
		return nil, status.Error(codes.Unauthenticated, "no cookie")
	}

	// token=[^;]+;
	token := regexResult[6 : len(regexResult)-1]
	fmt.Printf("token: %s\n", token)

	isValid, err := IsValidToken(token)
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	if !isValid {
		return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", token)
	}

	fmt.Println("authenticated!!")
	ctx = setUserId(&ctx, 0)

	return handler(ctx, req)
}

const userIDKey = "user_id"

func setUserId(ctx *context.Context, userID uint64) context.Context {
	return context.WithValue(*ctx, userIDKey, userID)
}

func GetUserId(ctx *context.Context) (uint64, error) {
	v := (*ctx).Value(userIDKey)
	userID, ok := v.(uint64)
	if !ok {
		return 0, fmt.Errorf("user_id not found")
	}
	return userID, nil
}
