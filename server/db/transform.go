package db

import (
	pb "server/proto"
)

func TransUser(user *User) *pb.UserInfo {
	userInfo := pb.UserInfo{UserId: user.ID, AccountName: user.AccountName}
	return &userInfo
}
