import React, {useContext, useState} from "react"
import {Box, Button, Container, FormControl, Input, InputLabel, Stack, Typography} from "@mui/material";
import {grey} from "@mui/material/colors";
import {LoginServiceClient} from "../../proto/UserServiceClientPb";
import {LoginRequest, UserInfo} from "../../proto/user_pb";
import {UserContext} from "../../App";
import {Link} from "react-router-dom";

const Login = () => {
    const {user, setUser} = useContext(UserContext)

    const [accountName, setAccountName] = useState("")
    const [password, setPassword] = useState("")

    const Login = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const client = new LoginServiceClient(process.env.REACT_APP_BACKEND_URL ?? "")
        const req = new LoginRequest()
        req.setAccountName(accountName)
        req.setPassword(password)
        client.login(req, null).then((r: UserInfo) => {
            setUser(r)
            console.log(r)
        })
    }

    return (
        <Container sx={{py: 5}}>
            <Typography variant="h4">ログインしてください</Typography>
            <Box sx={{border: 1, borderColor: grey[200], boxShadow: 1, my: 1}}>
                <form onSubmit={Login}>
                    <Stack spacing={2} sx={{p: 2}}>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="name">アカウント名</InputLabel>
                            <Input id="name"
                                   onChange={(e) => setAccountName(e.target.value)}
                                   fullWidth/>
                        </FormControl>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="password">パスワード</InputLabel>
                            <Input id="password"
                                   onChange={(e) => setPassword(e.target.value)}
                                   type="password"
                                   autoComplete="on"
                                   fullWidth/>
                        </FormControl>
                        <Button type="submit">ログイン</Button>
                    </Stack>
                </form>
            </Box>
            <Link to={"/create-account"}>新規アカウント作成</Link>
        </Container>)
}

export default Login;