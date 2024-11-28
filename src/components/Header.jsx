import React from "react";
import HighlightIcon from "@mui/icons-material/Highlight";
import LogoutIcon from '@mui/icons-material/Logout';

function Header(props) {
  return (
    <header className="header">
      <div className="header-left">
        <HighlightIcon />
        <h1>Keeper</h1>
      </div>
      {props.userName && (<div className="header-right">
        <span className="username">{props.userName}</span>
        <LogoutIcon className="logout-icon" onClick={props.onLogout} />
      </div>)}

    </header>
  );
}

export default Header;
