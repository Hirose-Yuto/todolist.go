package task

import (
	"context"
	"github.com/golang/protobuf/ptypes/empty"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log"
	database "server/db"
	pb "server/proto"
	"server/service/auth"
)

type TagServer struct {
}

func (t TagServer) GetAllTags(ctx context.Context, e *empty.Empty) (*pb.TagList, error) {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.TagList{}, status.Error(codes.Internal, "internal error")
	}

	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return &pb.TagList{}, status.Errorf(codes.Internal, "internal error: &s", err)
	}

	var tags []database.Tag
	if err = db.Select(&tags, "SELECT * FROM tags WHERE user_id = ?", userId); err != nil {
		log.Println(err)
		return &pb.TagList{}, status.Error(codes.Internal, "internal db error")
	}

	return database.TransTagList(&tags), nil
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
		UserId:      userId,
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

func SetTagsToTask(userId uint64, taskId uint64, tagIds []uint64) error {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return status.Error(codes.Internal, "internal error")
	}

	if _, err = db.Exec("DELETE FROM tasks_have_tags where task_id = ?", taskId); err != nil {
		log.Println(err)
		return status.Error(codes.Internal, "internal db error")
	}

	if len(tagIds) == 0 {
		return nil
	}

	var taskHasTag []database.TaskHasTag
	for _, tagId := range tagIds {
		taskHasTag = append(taskHasTag, database.TaskHasTag{TagId: tagId, TaskId: taskId})
	}

	if _, err = db.NamedExec("INSERT INTO tasks_have_tags (task_id, tag_id) VALUES (:task_id, :tag_id)", taskHasTag); err != nil {
		log.Println(err)
		return status.Error(codes.Internal, "internal db error")
	}

	return nil
}
