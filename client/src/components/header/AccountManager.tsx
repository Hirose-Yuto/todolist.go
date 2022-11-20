import React, {useContext} from "react";
import {Avatar, Box, IconButton, Menu, MenuItem, Tooltip, Typography} from "@mui/material";
import {SnackBarContext, UserContext} from "../../App";
import {useNavigate} from "react-router-dom";
import {LoginServiceClient} from "../../proto/UserServiceClientPb";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";

type settingFunctionArray = {
    [index: string]: () => void
}

const AccountManager = () => {
    const {setSuccessSnackBar, setWarningSnackBar} = useContext(SnackBarContext)

    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const navigate = useNavigate()
    const {user, setUser} = useContext(UserContext)

    const logout = () => {
        const client = new LoginServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.logout(new Empty(), null).then(() => {
            setUser(null)

            setSuccessSnackBar("ログアウトしました")
            console.log("logout")
        }).catch((r) => {
            setWarningSnackBar("ログアウトに失敗しました")
            console.log(r)
        })
    }

    const settings: settingFunctionArray = {
        'アカウント': () => {
            navigate("/menu/account");
        },
        'ログアウト': logout
    }

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    return (<>
        <Box sx={{flexGrow: 0}}>
            {
                user && <>
                    <Tooltip title="アカウント設定を開く">
                        <IconButton onClick={handleOpenUserMenu} sx={{p: 0}}>
                            <Avatar alt={user.getAccountName()}/>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        sx={{mt: '45px'}}
                        id="menu-appbar"
                        anchorEl={anchorElUser}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorElUser)}
                        onClose={handleCloseUserMenu}
                    >
                        {Object.keys(settings).map((setting: string) => (
                            <MenuItem key={setting} onClick={handleCloseUserMenu}>
                                <Typography textAlign="center"
                                            onClick={settings[setting]}>{setting}</Typography>
                            </MenuItem>
                        ))}
                    </Menu>
                </>
            }
        </Box>
    </>)
}

export default AccountManager;