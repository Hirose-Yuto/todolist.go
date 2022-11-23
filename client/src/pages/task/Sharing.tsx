import React, {useContext, useEffect, useState} from "react"
import {Container,} from "@mui/material";
import ShareTask from "../../components/share/ShareTask";
import SharedTaskList from "../../components/share/SharedTaskList";

const Sharing = () => {
    const [rerender, setRerender] = useState({})
    return (
        <Container sx={{py: 5}}>
            <ShareTask setRerender={setRerender}/>
            <SharedTaskList rerender={rerender}/>
        </Container>)
}

export default Sharing;