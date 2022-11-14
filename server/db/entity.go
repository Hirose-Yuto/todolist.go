package db

// schema.go provides data models in DB
import (
	"time"
)

type User struct {
	ID           uint64 `db:"id"`
	AccountName  string `db:"account_name"`
	PasswordHash []byte `db:"password_hash"`
}

type UserToken struct {
	ID        uint64    `db:"id"`
	Token     string    `db:"token"`
	UserId    uint64    `db:"user_id"`
	CreatedAt time.Time `db:"create_at"`
	UpdatedAt time.Time `db:"update_at"`
}

type Task struct {
	ID        uint64    `db:"id"`
	Title     string    `db:"title"`
	isDone    bool      `db:"is_done"`
	Priority  int       `db:"priority"`
	Deadline  time.Time `db:"created_at"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"created_at"`
}

type UserHasTask struct {
	ID     uint64 `db:"id"`
	UserId uint64 `db:"user_id"`
	TaskId uint64 `db:"task_id"`
}

type Tag struct {
	ID          uint64    `db:"id"`
	Description string    `db:"description"`
	CreatedAt   time.Time `db:"create_at"`
	UpdatedAt   time.Time `db:"update_at"`
}

type TaskHasTag struct {
	ID     uint64 `db:"id"`
	TaskId uint64 `db:"task_id"`
	TagId  uint64 `db:"tag_id"`
}

type Comments struct {
	ID        uint64    `db:"id"`
	Content   string    `db:"content"`
	UserId    uint64    `db:"user_id"`
	TaskId    uint64    `db:"task_id"`
	CreatedAt time.Time `db:"create_at"`
	UpdatedAt time.Time `db:"update_at"`
}
