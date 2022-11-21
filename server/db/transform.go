package db

import (
	ts "google.golang.org/protobuf/types/known/timestamppb"
	pb "server/proto"
)

func TransUser(user *User) *pb.UserInfo {
	return &pb.UserInfo{UserId: user.ID, AccountName: user.AccountName}
}

func TransTask(task *Task, tags *[]Tag) *pb.Task {
	return &pb.Task{
		Id:        task.ID,
		Title:     task.Title,
		Memo:      task.Memo,
		IsDone:    task.IsDone,
		Priority:  task.Priority,
		Deadline:  ts.New(task.Deadline),
		CratedAt:  ts.New(task.CreatedAt),
		UpdatedAt: ts.New(task.UpdatedAt),
		Tags:      transTagList(tags),
	}
}

func TransTag(tag *Tag) *pb.Tag {
	return &pb.Tag{
		Id:          tag.ID,
		Description: tag.Description,
		UserId:      tag.UserId,
	}
}

func transTagList(tags *[]Tag) []*pb.Tag {
	l := make([]*pb.Tag, len(*tags))
	for i, e := range *tags {
		l[i] = TransTag(&e)
	}
	return l
}

func TransTagList(tags *[]Tag) *pb.TagList {
	l := make([]*pb.Tag, len(*tags))
	for i, e := range *tags {
		l[i] = TransTag(&e)
	}
	return &pb.TagList{Tags: l}
}
