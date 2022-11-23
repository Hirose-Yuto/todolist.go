package main

import (
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"log"
	"net"
	"os"
	"server/db"
	pb "server/proto"
	"server/service"
	"server/service/auth"
	"server/service/task"
)

const port = 9090

func main() {
	fmt.Println("program start")

	if err := godotenv.Load(".env"); err != nil {
		log.Fatal(err)
	}

	// initialize DB connection
	dsn := db.DefaultDSN(
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"))
	if err := db.Connect(dsn); err != nil {
		log.Fatal(err)
	}

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer(grpc.UnaryInterceptor(auth.Interceptor()))

	pb.RegisterUserServiceServer(s, &service.UserServer{})
	pb.RegisterLoginServiceServer(s, &auth.LoginServer{})
	pb.RegisterTaskServiceServer(s, &task.TaskServer{})
	pb.RegisterTagServiceServer(s, &task.TagServer{})

	reflection.Register(s)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
