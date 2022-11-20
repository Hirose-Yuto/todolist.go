package task

import (
	"context"
	"github.com/golang/protobuf/ptypes/empty"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log"
	database "server/db"
	pb "server/proto"
)

type TagServer struct {
}

func (t TagServer) CreateTag(_ context.Context, r *pb.CreateTagRequest) (*pb.Tag, error) {
	description := r.GetDescription()
	if description == "" {
		return &pb.Tag{}, status.Error(codes.InvalidArgument, "invalid argument")
	}

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.Tag{}, status.Error(codes.Internal, "internal error")
	}

	res, err := db.Exec("INSERT INTO tags (description) VALUES (?)", description)
	if err != nil {
		log.Println(err)
		return &pb.Tag{}, status.Error(codes.Internal, "internal db error")
	}

	tagId, err := res.LastInsertId()
	if err != nil {
		log.Println(err)
		return &pb.Tag{}, status.Error(codes.Internal, "internal db error")
	}

	return &pb.Tag{
		Id:          uint64(tagId),
		Description: description,
	}, nil
}

func (t TagServer) UpdateTag(_ context.Context, r *pb.UpdateTagRequest) (*empty.Empty, error) {
	description := r.GetDescription()
	if description == "" {
		return &empty.Empty{}, status.Error(codes.InvalidArgument, "invalid argument")
	}

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	if _, err := db.Exec("UPDATE tags SET description = ? WHERE id = ?", description, r.GetTagId()); err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}

	return &empty.Empty{}, nil
}

func (t TagServer) DeleteTag(ctx context.Context, r *pb.DeleteTagRequest) (*empty.Empty, error) {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	tagId := r.GetTagId()
	if _, err := db.Exec("DELETE FROM tasks_have_tags WHERE tag_id = ?", tagId); err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}
	if _, err := db.Exec("DELETE FROM tags WHERE id = ?", tagId); err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}

	return &empty.Empty{}, nil
}

func (t TagServer) SetTagToTask(ctx context.Context, r *pb.TagToTaskRequest) (*empty.Empty, error) {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	taskId := r.GetTaskId()
	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &empty.Empty{}, nil
	}

	return &empty.Empty{}, nil
}

func (t TagServer) UnSetTagToTask(ctx context.Context, r *pb.TagToTaskRequest) (*empty.Empty, error) {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	taskId := r.GetTaskId()
	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &empty.Empty{}, nil
	}

	return &empty.Empty{}, nil
}
