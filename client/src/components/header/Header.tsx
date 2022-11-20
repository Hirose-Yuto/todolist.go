import React, {useContext} from "react"
import {Link} from "react-router-dom";
import {AppBar, Box, Container, ThemeProvider, Toolbar, Typography} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search"
import {Search, SearchIconWrapper, StyledInputBase, theme,} from "./SearchStyle";
import AccountManager from "./AccountManager";
import {UserContext} from "../../App";

const Header = () => {
    const {user} = useContext(UserContext)

    return (
        <ThemeProvider theme={theme}>
            <AppBar position={"static"} color={"primary"}>
                <Container maxWidth={"xl"}>
                    <Toolbar disableGutters>
                        <Box sx={{flexGrow: 1, display: 'flex'}}>
                            <Link to={"/"} color={"secondary"} style={{margin: 8}}>HOME</Link>
                            <Link to={"/task"} color={"secondary"} style={{margin: 8}}>Task</Link>
                        </Box>

                        <Search sx={{flexGrow: 0}}>
                            <SearchIconWrapper>
                                <SearchIcon/>
                            </SearchIconWrapper>
                            <StyledInputBase
                                placeholder="タスクを検索"
                                inputProps={{'aria-label': 'search'}}
                            />
                        </Search>
                        <AccountManager/>
                        <Box sx={{mx: 2}}>
                            <Typography>{user?.getAccountName()}</Typography>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
        </ThemeProvider>)
}

export default Header;