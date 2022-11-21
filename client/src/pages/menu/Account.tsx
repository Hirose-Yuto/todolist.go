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
    Stack, Typography
} from "@mui/material";
import {grey} from "@mui/material/colors";
import {SnackBarContext, UserContext} from "../../App";
import {modalStyle} from "../../Style";
import {UserServiceClient} from "../../proto/UserServiceClientPb";
import {AccountNameUpdateRequest, DeleteUserRequest, PasswordUpdateRequest} from "../../proto/user_pb";

const Account = () => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)
    const {user, setUser} = useContext(UserContext)
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [newPasswordValid, setNewPasswordValid] = useState("")

    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const handleChangePasswordOpen = () => setChangePasswordOpen(true)
    const handleChangePasswordClose = () => setChangePasswordOpen(false)

    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
    const handleDeleteAccountOpen = () => setDeleteAccountOpen(true)
    const handleDeleteAccountClose = () => setDeleteAccountOpen(false)


    const changeAccountName = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!e.target.value || !user || e.target.value === user.getAccountName()) return
        const client = new UserServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new AccountNameUpdateRequest()
        req.setAccountName(e.target.value)
        client.updateAccountName(req, null).then(() => {
            user.setAccountName(e.target.value)
            setUser(user)

            setSuccessSnackBar(`アカウント名が「${e.target.value}」に更新されました`)
            console.log("account name updated")
            window.location.reload()
        }).catch((r) => {
            setWarningSnackBar(`アカウント名の更新に失敗しました`)
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
            setSuccessSnackBar(`パスワードを更新しました`)
            console.log("password updated")
            handleChangePasswordClose()
        }).catch((r) => {
            setWarningSnackBar(`パスワードの更新に失敗しました`)
            console.log(r)
            handleChangePasswordClose()
        })
    }

    const [deletePassword, setDeletePassword] = useState("")
    const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("")
    const deleteAccount = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const client = new UserServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        const req = new DeleteUserRequest()
        req.setPassword(deletePassword)
        client.deleteUser(req, null).then(() => {
            setUser(null)

            setSuccessSnackBar(`アカウントを削除しました`)
            console.log("account deleted")
        }).catch(() => {
            setWarningSnackBar(`アカウント削除に失敗しました`)
            console.log("account deletion failed")
            handleDeleteAccountClose()
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
            <Button color="error" onClick={handleDeleteAccountOpen} fullWidth>アカウント削除</Button>
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
            <Modal open={deleteAccountOpen} onClose={handleDeleteAccountClose}>
                <form onSubmit={deleteAccount}>
                    <Stack sx={modalStyle} spacing={2}>
                        <Typography>本当にアカウントを削除しますか？</Typography>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="delete_password">パスワード</InputLabel>
                            <Input id="delete_password"
                                   onChange={(e) => setDeletePassword(e.target.value)}
                                   type="password"
                                   fullWidth/>
                        </FormControl>
                        <FormControl variant="standard" required>
                            <InputLabel htmlFor="delete_confirm_password">パスワード(再入力)</InputLabel>
                            <Input id="delte_confirm_password"
                                   onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                                   type="password"
                                   fullWidth/>
                            {deletePassword !== "" && deleteConfirmPassword !== "" && deletePassword !== deleteConfirmPassword &&
                                <FormHelperText error>パスワードが異なっています</FormHelperText>}
                        </FormControl>
                        <Button type={"submit"} color="error">アカウントを削除する</Button>
                    </Stack>
                </form>
            </Modal>
        </Container>)
}

export default Account;