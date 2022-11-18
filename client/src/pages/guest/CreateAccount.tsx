import React, {useContext, useState} from "react"
import {Box, Button, Container, FormControl, FormHelperText, Input, InputLabel, Stack, Typography} from "@mui/material";
import {grey} from "@mui/material/colors";
import {Link} from "react-router-dom";
import {UserContext} from "../../App";
import {LoginServiceClient, UserServiceClient} from "../../proto/UserServiceClientPb";
import {LoginRequest, UserCreateRequest, UserInfo} from "../../proto/user_pb";

const CreateAccount = () => {
    const {setUser} = useContext(UserContext)

    const [accountName, setAccountName] = useState("")
    const [password, setPassword] = useState("")
    const [passwordValid, setPasswordValid] = useState("")

    const CreateAccount = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new UserServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new UserCreateRequest()
        req.setAccountName(accountName)
        req.setPassword(password)
        client.createUser(req, null)
            .then((r: UserInfo) => {
                setUser(r)
                console.log(r)
            }).catch((r) => {
                console.log(r)
        })
    }

    return (<Container sx={{py: 5}}>
            <Typography variant="h4">アカウント作成</Typography>
            <Box sx={{border: 1, borderColor: grey[200], boxShadow: 1, my: 1}}>
                <form onSubmit={CreateAccount}>
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
                                   fullWidth/>
                        </FormControl>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="password_valid">パスワード(再入力)</InputLabel>
                            <Input id="password_valid"
                                   onChange={(e) => setPasswordValid(e.target.value)}
                                   type="password"
                                   fullWidth/>
                            {password !== "" && passwordValid !== "" && password !== passwordValid &&
                                <FormHelperText error>パスワードが異なっています</FormHelperText>}
                        </FormControl>
                        <Button type="submit">アカウント作成</Button>
                    </Stack>
                </form>
            </Box>
            <Link to={"/"}>ログイン</Link>
        </Container>
    )
}

export default CreateAccount;