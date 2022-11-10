package main

import (
	"context"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/golang/protobuf/ptypes/empty"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"log"
	"net"
	pb "server/proto"
	"time"
)

type server struct {
	pb.UnimplementedMessengerServer
	requests []*pb.MessageRequest
}

const port = 9090

func main() {
	// initialize DB connection
	//dsn := db.DefaultDSN(
	//	os.Getenv("DB_HOST"),
	//	os.Getenv("DB_PORT"),
	//	os.Getenv("DB_USER"),
	//	os.Getenv("DB_PASSWORD"),
	//	os.Getenv("DB_NAME"))
	//if err := db.Connect(dsn); err != nil {
	//	log.Fatal(err)
	//}
	//
	//// initialize Gin engine
	//engine := gin.Default()
	//
	//engine.Use(cors.New(cors.Config{
	//	// アクセスを許可したいアクセス元
	//	AllowOrigins: []string{
	//		"*",
	//	},
	//	// アクセスを許可したいHTTPメソッド(以下の例だとPUTやDELETEはアクセスできません)
	//	AllowMethods: []string{
	//		"POST",
	//		"GET",
	//		"OPTIONS",
	//	},
	//	// 許可したいHTTPリクエストヘッダ
	//	AllowHeaders: []string{
	//		"Access-Control-Allow-Credentials",
	//		"Access-Control-Allow-Headers",
	//		"Content-Type",
	//		"Content-Length",
	//		"Accept-Encoding",
	//		"Authorization",
	//	}, // cookieなどの情報を必要とするかどうか
	//	AllowCredentials: true,
	//	// preflightリクエストの結果をキャッシュする時間
	//	MaxAge: 24 * time.Hour,
	//}))
	//
	//engine.LoadHTMLGlob("views/*.gohtml")
	//
	//// routing
	//engine.Static("/assets", "./assets")
	//engine.GET("/", service2.Home)
	//engine.GET("/list", service2.TaskList)
	//engine.GET("/task/:id", service2.ShowTask) // ":id" is a parameter
	//
	//// start server
	//engine.Run(fmt.Sprintf(":%d", port))

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterMessengerServer(s, &server{})
	reflection.Register(s)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

func (s *server) GetMessages(_ *empty.Empty, stream pb.Messenger_GetMessagesServer) error {
	fmt.Println("aaaaa")
	for _, r := range s.requests {
		if err := stream.Send(&pb.MessageResponse{Message: r.GetMessage()}); err != nil {
			return err
		}
	}

	previousCount := len(s.requests)

	for {
		currentCount := len(s.requests)
		if previousCount < currentCount && currentCount > 0 {
			r := s.requests[currentCount-1]
			log.Printf("Sent: %v", r.GetMessage())
			if err := stream.Send(&pb.MessageResponse{Message: r.GetMessage()}); err != nil {
				return err
			}
		}
		previousCount = currentCount
	}
}

func (s *server) CreateMessage(ctx context.Context, r *pb.MessageRequest) (*pb.MessageResponse, error) {
	log.Printf("Received: %v", r.GetMessage())
	newR := &pb.MessageRequest{Message: r.GetMessage() + ": " + time.Now().Format("2006-01-02 15:04:05")}
	s.requests = append(s.requests, newR)
	return &pb.MessageResponse{Message: r.GetMessage()}, nil
}
