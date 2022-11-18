import React, {useContext, useEffect, useState} from "react"
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import {LoginServiceClient} from "../proto/UserServiceClientPb";
import {LoginRequest, UserInfo} from "../proto/user_pb";
import {Button} from "@mui/material";
import {UserContext} from "../App";

const Home = () => {
    const {user, setUser} = useContext(UserContext)

    const Logout = () => {
        const client = new LoginServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.logout(new Empty(), null).then(() => {
            setUser(null)
            console.log("logout")
        }).catch((r) => {
            console.log(r)
        })
    }

    return (<>
        <Button onClick={Logout}>ログアウト</Button>
        {user && "name: " + user.getAccountName()}
    </>)
}


export default Home;