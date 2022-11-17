import React, {useContext, useState} from "react"
import {
    Box,
    Button,
    Container,
    FormControl,
    FormHelperText,
    Input,
    InputLabel,
    Modal,
    Stack
} from "@mui/material";
import {grey} from "@mui/material/colors";
import {UserContext} from "../../App";
import {modalStyle} from "../../Style";
import {UserServiceClient} from "../../proto/UserServiceClientPb";
import {AccountNameUpdateRequest, PasswordUpdateRequest} from "../../proto/user_pb";

const Account = () => {
    const {user, setUser} = useContext(UserContext)
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [newPasswordValid, setNewPasswordValid] = useState("")

    const handleChangePasswordOpen = () => {
        setChangePasswordOpen(true)
    }
    const handleChangePasswordClose = () => {
        setChangePasswordOpen(false)
    }


    const changeAccountName = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if(!e.target.value || !user || e.target.value === user.getAccountName()) return
        const client = new UserServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new AccountNameUpdateRequest()
        req.setAccountName(e.target.value)
        client.updateAccountName(req, null).then(() => {
            user.setAccountName(e.target.value)
            setUser(user)
            console.log("account name updated")
            window.location.reload()
        }).catch((r) => {
            console.log(r)
        })
    }

    const changePassword = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new UserServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new PasswordUpdateRequest()
        req.setOldPassword(oldPassword)
        req.setNewPassword(newPassword)
        client.updatePassword(req, null).then(() => {
            console.log("password updated")
        }).catch((r) => {
            console.log(r)
        })
    }


    return (
        <Container sx={{py: 5}}>
            <Box sx={{border: 1, borderColor: grey[200], boxShadow: 1, my: 1}}>
                <Stack spacing={2} sx={{p: 2}}>
                    <FormControl variant="standard">
                        <InputLabel htmlFor="name">アカウント名</InputLabel>
                        <Input id="name"
                               defaultValue={user?.getAccountName()}
                               onBlur={changeAccountName}
                               fullWidth/>
                    </FormControl>
                    <Button onClick={handleChangePasswordOpen}>パスワードの変更はこちらから</Button>
                </Stack>
            </Box>
            <Modal open={changePasswordOpen} onClose={handleChangePasswordClose}>
                <form onSubmit={changePassword}>
                    <Stack sx={modalStyle} spacing={2}>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="password">パスワード</InputLabel>
                            <Input id="password"
                                   onChange={(e) => setOldPassword(e.target.value)}
                                   type="password"
                                   fullWidth/>
                        </FormControl>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="new_password">新しいパスワード</InputLabel>
                            <Input id="new_password"
                                   onChange={(e) => setNewPassword(e.target.value)}
                                   type="password"
                                   fullWidth/>
                        </FormControl>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="new_password_valid">新しいパスワード(再入力)</InputLabel>
                            <Input id="new_password_valid"
                                   onChange={(e) => setNewPasswordValid(e.target.value)}
                                   type="password"
                                   fullWidth/>
                            {newPassword !== "" && newPasswordValid !== "" && newPassword !== newPasswordValid &&
                                <FormHelperText error>パスワードが異なっています</FormHelperText>}
                        </FormControl>
                        <Button type={"submit"}>変更</Button>
                    </Stack>
                </form>
            </Modal>
        </Container>)
}

export default Account;