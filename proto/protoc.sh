#!/bin/sh

protoc -I. \
            --go_out=plugins="grpc:server" \
            --go_opt=paths=source_relative \
            --js_out=import_style=commonjs:client \
            --grpc-web_out=import_style=typescript,mode=grpcwebtext:client  *.proto
