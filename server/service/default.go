package service

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"server/proto"
)

// Home renders index.gohtml
func Home(ctx *gin.Context) {
	newR := &proto.MessageRequest{Message: "aaa"}
	ctx.JSON(200, newR)
	//ctx.HTML(http.StatusOK, "index.gohtml", gin.H{"Title": newR.Message})
}

// NotImplemented renders error.gohtml with 501 Not Implemented
func NotImplemented(ctx *gin.Context) {
	msg := fmt.Sprintf("%s access to %s is not implemented yet", ctx.Request.Method, ctx.Request.URL)
	ctx.Header("Cache-Contrl", "no-cache")
	Error(http.StatusNotImplemented, msg)(ctx)
}

// Error returns a handler which renders error.gohtml
func Error(code int, message string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.HTML(code, "error.gohtml", gin.H{"Code": code, "Error": message})
	}
}
