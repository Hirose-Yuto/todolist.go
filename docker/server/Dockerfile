FROM golang:1.17

ENV GOPATH=/go/src
ENV WORKSPACE=${GOPATH}/app
RUN mkdir -p ${WORKSPACE}

WORKDIR ${WORKSPACE}

COPY server/go.mod ./
COPY server/go.sum ./

RUN go mod download
RUN go mod tidy
