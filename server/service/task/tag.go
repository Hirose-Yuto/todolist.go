package task

import (
	"context"
	"github.com/golang/protobuf/ptypes/empty"
	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log"
	database "server/db"
	pb "server/proto"
	"server/service/auth"
)

type TagServer struct {
}

func (t TagServer) CreateTag(ctx context.Context, r *pb.CreateTagRequest) (*pb.Tag, error) {
	description := r.GetDescription()
	if description == "" {
		return &pb.Tag{}, status.Error(codes.InvalidArgument, "invalid argument")
	}

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.Tag{}, status.Error(codes.Internal, "internal error")
	}

	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return &pb.Tag{}, status.Errorf(codes.Internal, "internal error: &s", err)
	}

	res, err := db.Exec("INSERT INTO tags (description, user_id) VALUES (?, ?)", description, userId)
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
	tagId := r.GetTagId()
	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &empty.Empty{}, err
	}
	if err = checkTagPermission(ctx, tagId, db); err != nil {
		return &empty.Empty{}, err
	}

	if _, err = db.Exec("INSERT INTO tasks_have_tags (task_id, tag_id) VALUES (?, ?)", taskId, tagId); err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
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
	tagId := r.GetTagId()
	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &empty.Empty{}, err
	}
	if err = checkTagPermission(ctx, tagId, db); err != nil {
		return &empty.Empty{}, err
	}

	if _, err = db.Exec("DELETE FROM tasks_have_tags WHERE task_id = ? AND tag_id = ?", taskId, tagId); err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}

	return &empty.Empty{}, nil
}

// タグを作成したか。読むだけなら権限は必要ない
func checkTagPermission(ctx context.Context, tagId uint64, db *sqlx.DB) error {
	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return status.Errorf(codes.Internal, "internal error: &s", err)
	}

	var exist database.ExistCheck
	if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM tags WHERE id = ? AND user_id = ?) as exist", tagId, userId); err != nil {
		log.Println(err)
		return status.Error(codes.Internal, "internal db error")
	}
	if !exist.Exist {
		return status.Error(codes.PermissionDenied, "you haven't created the tag")
	}
	return nil
}
