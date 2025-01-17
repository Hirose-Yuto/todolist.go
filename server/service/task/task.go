package task

import (
	"context"
	"database/sql"
	"github.com/golang/protobuf/ptypes/empty"
	"github.com/jmoiron/sqlx"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log"
	database "server/db"
	pb "server/proto"
	"server/service/auth"
	"time"
)

type TaskServer struct {
}

func (t TaskServer) GetTask(ctx context.Context, r *pb.GetTaskRequest) (*pb.Task, error) {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.Task{}, status.Error(codes.Internal, "internal error")
	}

	taskId := r.GetTaskId()
	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &pb.Task{}, err
	}

	task, tags, err := getTaskAndTags(taskId, db)
	if err != nil {
		return &pb.Task{}, err
	}

	return database.TransTask(task, tags), nil
}

func (t TaskServer) CreateTask(ctx context.Context, r *pb.CreateTaskRequest) (*pb.Task, error) {
	title := r.GetTitle()
	memo := r.GetMemo()
	isDone := r.GetIsDone()
	priority := r.GetPriority()
	deadline := r.GetDeadline().AsTime()
	if title == "" {
		return &pb.Task{}, status.Error(codes.InvalidArgument, "title is required")
	}

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.Task{}, status.Error(codes.Internal, "internal error")
	}
	var res sql.Result
	if deadline.Unix() != 0 {
		res, err = db.Exec("INSERT INTO tasks (title, memo, deadline, is_done, priority) VALUES (?, ?, ?, ?, ?)",
			title, memo, deadline, isDone, priority)
	} else {
		res, err = db.Exec("INSERT INTO tasks (title, memo, is_done, priority) VALUES (?, ?, ?, ?)",
			title, memo, isDone, priority)
	}
	if err != nil {
		log.Println(err)
		return &pb.Task{}, status.Error(codes.Internal, "internal db error")
	}

	taskId, err := res.LastInsertId()
	if err != nil {
		log.Println(err)
		return &pb.Task{}, status.Error(codes.Internal, "internal db error")
	}

	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return &pb.Task{}, status.Errorf(codes.Internal, "internal error: &s", err)
	}

	_, err = db.Exec("INSERT INTO users_have_tasks (user_id, task_id) VALUES (?, ?)",
		userId, taskId)
	if err != nil {
		log.Println(err)
		return &pb.Task{}, status.Error(codes.Internal, "internal db error")
	}

	if err = SetTagsToTask(userId, uint64(taskId), r.GetTagIds()); err != nil {
		return &pb.Task{}, err
	}

	task, tags, err := getTaskAndTags(uint64(taskId), db)
	if err != nil {
		return &pb.Task{}, err
	}

	return database.TransTask(task, tags), nil
}

func (t TaskServer) UpdateTask(ctx context.Context, r *pb.UpdateTaskRequest) (*empty.Empty, error) {
	taskId := r.GetTaskId()

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &empty.Empty{}, err
	}

	title := r.GetTitle()
	memo := r.GetMemo()
	isDone := r.GetIsDone()
	priority := r.GetPriority()
	deadline := r.GetDeadline().AsTime()
	if title == "" {
		return &empty.Empty{}, status.Error(codes.InvalidArgument, "title is required")
	}

	if deadline.Unix() != 0 {
		_, err = db.Exec("UPDATE tasks SET title = ?, memo = ?, deadline = ?, is_done = ?, priority = ?, updated_at = ? WHERE id = ?",
			title, memo, deadline, isDone, priority, time.Now(), taskId)
	} else {
		_, err = db.Exec("UPDATE tasks SET title = ?, memo = ?, is_done = ?, priority = ?, updated_at = ? WHERE id = ?",
			title, memo, isDone, priority, time.Now(), taskId)
	}
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}

	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return &empty.Empty{}, status.Errorf(codes.Internal, "internal error: &s", err)
	}
	if err = SetTagsToTask(userId, taskId, r.GetTagIds()); err != nil {
		return &empty.Empty{}, err
	}

	return &empty.Empty{}, nil
}

func (t TaskServer) DeleteTask(ctx context.Context, r *pb.DeleteTaskRequest) (*empty.Empty, error) {
	taskId := r.GetTaskId()

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	if err = checkTaskPermission(ctx, taskId, db); err != nil {
		return &empty.Empty{}, err
	}

	_, err = db.Exec("DELETE FROM tasks WHERE id = ?", taskId)
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}

	return &empty.Empty{}, nil
}

func (t TaskServer) GetAllTasks(ctx context.Context, empty *empty.Empty) (*pb.TaskList, error) {
	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return &pb.TaskList{}, status.Errorf(codes.Internal, "internal error: &s", err)
	}

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.TaskList{}, status.Error(codes.Internal, "internal error")
	}

	var tasks []database.Task
	if err = db.Select(&tasks, `
SELECT tasks.id, title, memo, is_done, priority, deadline, created_at, updated_at
FROM tasks
	 INNER JOIN users_have_tasks uht on tasks.id = uht.task_id AND uht.user_id = ?;`, userId); err != nil {
		log.Println(err)
		return &pb.TaskList{}, status.Error(codes.Internal, "internal db error")
	}

	var taskList pb.TaskList
	for _, e := range tasks {
		task, tags, err := getTaskAndTags(e.ID, db)
		if err != nil {
			return &pb.TaskList{}, err
		}
		taskList.Tasks = append(taskList.Tasks, database.TransTask(task, tags))
	}

	return &taskList, nil
}

func (t TaskServer) AssignTask(ctx context.Context, r *pb.AssignTaskRequest) (*empty.Empty, error) {
	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &empty.Empty{}, status.Error(codes.Internal, "internal error")
	}

	var assignee database.User
	if err := db.Get(&assignee, "SELECT * FROM users WHERE account_name = ?", r.GetAccountName()); err != nil {
		log.Println(err)
		if err.Error() == "sql: no rows in result set" {
			return &empty.Empty{}, status.Error(codes.NotFound, "user not found")
		}
		return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
	}

	taskIds := r.GetTaskIds()
	for _, taskId := range taskIds {
		if err = checkTaskPermission(ctx, uint64(taskId), db); err != nil {
			return &empty.Empty{}, err
		}

		var exist database.ExistCheck
		if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM users_have_tasks WHERE user_id = ? AND task_id = ?) as exist", assignee.ID, taskId); err != nil {
			log.Println(err)
			return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
		}
		if exist.Exist {
			continue
		}
		_, err = db.Exec("INSERT INTO users_have_tasks (user_id, task_id) VALUES (?, ?)",
			assignee.ID, taskId)
		if err != nil {
			log.Println(err)
			return &empty.Empty{}, status.Error(codes.Internal, "internal db error")
		}
	}

	return &empty.Empty{}, nil
}

func (t TaskServer) GetSharedTasks(ctx context.Context, e *empty.Empty) (*pb.SharedTaskList, error) {
	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return &pb.SharedTaskList{}, status.Errorf(codes.Internal, "internal error: &s", err)
	}

	db, err := database.GetConnection()
	if err != nil {
		log.Println(err)
		return &pb.SharedTaskList{}, status.Error(codes.Internal, "internal error")
	}

	var simpleTasks []database.SimpleTask
	if err := db.Select(&simpleTasks, `
SELECT tasks.id, tasks.title
FROM tasks
WHERE id IN (SELECT task_id
             FROM users_have_tasks as uht
             WHERE uht.task_id IN (SELECT task_id FROM users_have_tasks WHERE user_id = ?)
             GROUP BY uht.task_id
             HAVING COUNT(user_id) > 1)
`, userId); err != nil {
		log.Println(err)
		if err.Error() == "sql: no rows in result set" {
			return &pb.SharedTaskList{}, nil
		}
		return &pb.SharedTaskList{}, status.Error(codes.Internal, "internal db error")
	}

	var sts []*pb.SharedTask
	for _, simpleTask := range simpleTasks {
		var users []database.User
		if err := db.Select(&users, `
SELECT users.id, account_name, password_hash
FROM users INNER JOIN users_have_tasks uht on users.id = uht.user_id WHERE task_id = ?
`, simpleTask.Id); err != nil {
			log.Println(err)
			return &pb.SharedTaskList{}, status.Error(codes.Internal, "internal db error")
		}
		sts = append(sts, &pb.SharedTask{
			TaskId:       simpleTask.Id,
			Title:        simpleTask.Title,
			SharingUsers: *database.TransUsers(&users),
		})
	}

	return &pb.SharedTaskList{SharedTask: sts}, nil

}

func checkTaskPermission(ctx context.Context, taskId uint64, db *sqlx.DB) error {
	userId, err := auth.GetUserId(&ctx)
	if err != nil {
		return status.Errorf(codes.Internal, "internal error: &s", err)
	}

	var exist database.ExistCheck
	if err := db.Get(&exist, "SELECT EXISTS(SELECT * FROM users_have_tasks WHERE user_id = ? AND task_id = ?) as exist", userId, taskId); err != nil {
		log.Println(err)
		return status.Error(codes.Internal, "internal db error")
	}
	if !exist.Exist {
		return status.Error(codes.PermissionDenied, "you don't have the task")
	}
	return nil
}

func getTaskAndTags(taskId uint64, db *sqlx.DB) (*database.Task, *[]database.Tag, error) {
	var task database.Task
	if err := db.Get(&task, "SELECT * FROM tasks WHERE id = ?", taskId); err != nil {
		log.Println(err)
		return &database.Task{}, &[]database.Tag{}, status.Error(codes.Internal, "internal db error")
	}

	var tags []database.Tag
	if err := db.Select(&tags, `
SELECT tags.id, description, user_id
FROM tags        
	INNER JOIN tasks_have_tags tht on tags.id = tht.tag_id WHERE tht.task_id = ?;`, taskId); err != nil {
		log.Println(err)
		return &database.Task{}, &[]database.Tag{}, status.Error(codes.Internal, "internal db error")
	}

	return &task, &tags, nil
}
