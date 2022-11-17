import React, {createContext, useEffect, useState} from 'react';
import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./pages/Home";
import {UserInfo} from "./proto/user_pb";
import {LoginServiceClient} from "./proto/UserServiceClientPb";
import {Empty} from "google-protobuf/google/protobuf/empty_pb";
import Login from "./pages/guest/Login";
import CreateAccount from "./pages/guest/CreateAccount";

// axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

export const UserContext = createContext<{
    user: UserInfo | null,
    setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>
}>({
    user: null,
    setUser: () => undefined
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

    return (
        <div className="App">
            <UserContext.Provider value={{user, setUser}}>
                <BrowserRouter>
                    {
                        user ?
                            <Routes>
                                <Route path={"/"} element={<Home/>}/>
                            </Routes>
                            : !isWaitingLogin &&
                            <Routes>
                                <Route path={"/"} element={<Login/>}/>
                                <Route path={"/create-account"} element={<CreateAccount/>}/>
                            </Routes>
                    }
                </BrowserRouter>
            </UserContext.Provider>
        </div>
    );
}

export default App;
