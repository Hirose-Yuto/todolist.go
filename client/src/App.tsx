import React, {createContext, useEffect, useState} from 'react';
import './App.css';
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import {UserInfo} from "./proto/user_pb";
import {LoginServiceClient} from "./proto/UserServiceClientPb";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import Login from "./pages/guest/Login";
import CreateAccount from "./pages/guest/CreateAccount";
import Header from "./components/header/Header";
import Account from "./pages/menu/Account";
import TaskList from "./pages/task/TaskList";
import {Alert, Snackbar} from "@mui/material";
import TagList from "./pages/task/TagList";
import Sharing from "./pages/task/Sharing";

export const UserContext = createContext<{
    user: UserInfo | null,
    setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>
}>({
    user: null,
    setUser: () => undefined
})

export const SnackBarContext = createContext<{
    setSuccessSnackBar: (s: string) => void
    setWarningSnackBar: (s: string) => void
}>({
    setSuccessSnackBar: () => {
    },
    setWarningSnackBar: () => {
    }
})

function App() {
    const [user, setUser] = useState<UserInfo | null>(null)
    const [isWaitingLogin, setIsWaitingLogin] = useState(true)

    useEffect(() => {
        const client = new LoginServiceClient(process.env.REACT_APP_BACKEND_URL ?? "", null, {
            withCredentials: true
        })
        client.loginWithCredentials(new Empty(), null).then((r: UserInfo) => {
            setUser(r)
            setIsWaitingLogin(false)
            console.log(r)
        }).catch(r => {
            setIsWaitingLogin(false)
            console.log(r)
            console.log("auto login failed")
        })
    }, [])

    const [isSuccessSnackBarOpen, setIsSuccessSnackBarOpen] = useState(false)
    const handleIsSuccessSnackBarOpen = () => setIsSuccessSnackBarOpen(true)
    const handleIsSuccessSnackBarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsSuccessSnackBarOpen(false)
    }
    const [isWarningSnackBarOpen, setIsWarningSnackBarOpen] = useState(false)
    const handleIsWarningSnackBarOpen = () => setIsWarningSnackBarOpen(true)
    const handleIsWarningSnackBarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsWarningSnackBarOpen(false)
    }
    const [successSnackBarComment, setSuccessSnackBarComment] = useState<string>("")
    const [warningSnackBarComment, setWarningSnackBarComment] = useState<string>("")
    const setSuccessSnackBar = (s: string) => {
        setSuccessSnackBarComment(s)
        handleIsSuccessSnackBarOpen()
    }
    const setWarningSnackBar = (s: string) => {
        setWarningSnackBarComment(s)
        handleIsWarningSnackBarOpen()
    }

    return (
        <div className="App">
            <UserContext.Provider value={{user, setUser}}>
                <SnackBarContext.Provider value={{setSuccessSnackBar, setWarningSnackBar}}>
                    <BrowserRouter>
                        {
                            user ?
                                <>
                                    <Header/>
                                    <Routes>
                                        <Route path={"/menu/account"} element={<Account/>}/>
                                        <Route path={"/task"} element={<TaskList/>}/>
                                        <Route path={"/tag"} element={<TagList/>}/>
                                        <Route path={"/share"} element={<Sharing/>}/>
                                        <Route path={"/"} element={<TaskList/>}/>
                                        <Route path={"*"} element={<Navigate to={"/"}/>}/>
                                    </Routes>
                                </>
                                : !isWaitingLogin &&
                                <Routes>
                                    <Route path={"/create-account"} element={<CreateAccount/>}/>
                                    <Route path={"/"} element={<Login/>}/>
                                    <Route path={"/*"} element={<Navigate to={"/"}/>}/>
                                </Routes>
                        }
                    </BrowserRouter>
                    <Snackbar open={isSuccessSnackBarOpen} autoHideDuration={3000}
                              onClose={handleIsSuccessSnackBarClose}>
                        <Alert onClose={handleIsSuccessSnackBarClose} severity="success" sx={{width: '100%'}}>
                            {successSnackBarComment}
                        </Alert>
                    </Snackbar>
                    <Snackbar open={isWarningSnackBarOpen} autoHideDuration={3000}
                              onClose={handleIsWarningSnackBarClose}>
                        <Alert onClose={handleIsWarningSnackBarClose} severity="warning" sx={{width: '100%'}}>
                            {warningSnackBarComment}
                        </Alert>
                    </Snackbar>
                </SnackBarContext.Provider>
            </UserContext.Provider>
        </div>
    );
}

export default App;
