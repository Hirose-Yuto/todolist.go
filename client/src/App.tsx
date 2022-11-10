import React from 'react';
import './App.css';
import axios from "axios";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./pages/Home";

// axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;
// axios.defaults.baseURL = "localhost:9090";
axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';

function App() {
    return (
        <div className="App">
            Hello
            <BrowserRouter>
                <Routes>
                    <Route path={"/"} element={<Home/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
