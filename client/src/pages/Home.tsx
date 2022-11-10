import React, {useEffect, useState} from "react"
import axios from "axios";
import {MessengerClient} from "../proto/MessangerServiceClientPb"
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {MessageRequest} from "../proto/messanger_pb";

const Home = () => {
    const [a, setA] = useState("")

    useEffect(() => {
        const client = new MessengerClient('http://localhost:8080')
        const req = new MessageRequest()
        req.setMessage("dddssksk")
        client.createMessage(req, null, res => console.log(res))
        client.getMessages(new Empty()).on("data", m => {
            setA(m.getMessage())
        })
        // axios.get('http://localhost:9090').then(res => {
        //     console.log(res)
        //     setA(res.data)
        // })
    }, [])
    return (<>
        {
            a
        }
    </>)
}

export default Home;