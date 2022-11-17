import React from "react"
import {Link} from "react-router-dom";
import {AppBar, Box, Container, ThemeProvider, Toolbar} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search"
import {Search, SearchIconWrapper, StyledInputBase, theme,} from "./SearchStyle";

const Header = () => {
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
                                placeholder="Search…"
                                inputProps={{'aria-label': 'search'}}
                            />
                        </Search>
                        {/*<AccountManager/>*/}
                        {/*<AccountInfoBox/>*/}
                    </Toolbar>
                </Container>
            </AppBar>
        </ThemeProvider>)
}

export default Header;