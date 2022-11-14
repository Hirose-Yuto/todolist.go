import React, {useEffect, useState} from "react"
import axios from "axios";
import {MessengerClient} from "../proto/MessangerServiceClientPb"
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {MessageRequest} from "../proto/messanger_pb";
import {credentials, Metadata} from "@grpc/grpc-js";
import {LoginServiceClient} from "../proto/UserServiceClientPb";
import {LoginRequest} from "../proto/user_pb";
import {Button} from "@mui/material";

const Home = () => {
    const [a, setA] = useState("")

    // useEffect(() => {
    // }, [])

    const Login = () => {
        const client = new LoginServiceClient('http://localhost:8080')
        const req = new LoginRequest()
        req.setAccountName("aaa")
        req.setPassword("ssss")
        client.login(req, null).then(r => console.log(r))
    }

    const Message = () => {
        const client = new MessengerClient('http://localhost:8080', null, {
            withCredentials: true
        })
        const req = new MessageRequest()
        req.setMessage("dddssksk")
        client.createMessage(req, null, res => console.log(res))
        client.getMessages(new Empty())
            .on("data", m => {
                setA(m.getMessage())
            }, )
    }

    return (<>
        <Button onClick={Login}>ログイン</Button>
        <Button onClick={Message}>メッセージ</Button>
        {
            a
        }
    </>)
}


    export default Home;