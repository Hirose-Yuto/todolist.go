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

type UserTokenUuid struct {
	ID        uint64    `db:"id"`
	UUID      string    `db:"uuid"`
	UserId    uint64    `db:"user_id"`
	ExpiredAt time.Time `db:"expired_at"`
}

type Task struct {
	ID        uint64    `db:"id"`
	Title     string    `db:"title"`
	Memo      string    `db:"memo"`
	IsDone    bool      `db:"is_done"`
	Priority  int32     `db:"priority"`
	Deadline  time.Time `db:"deadline"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type UserHasTask struct {
	ID     uint64 `db:"id"`
	UserId uint64 `db:"user_id"`
	TaskId uint64 `db:"task_id"`
}

type Tag struct {
	ID          uint64 `db:"id"`
	Description string `db:"description"`
	UserId      uint64 `db:"user_id"`
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

type ExistCheck struct {
	Exist bool `db:"exist"`
}
