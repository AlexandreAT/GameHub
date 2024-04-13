import React from 'react'
import {Link, useNavigate  } from 'react-router-dom'
import Cookies from 'js-cookie';

import classes from "./Navbar.module.css";

function Navbar() {

    const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('.AspNetCore.Application.Authorization');
    navigate('/');
  }

  return (
    <div className={classes.divNavbar}>
        <Link to={'/logado'}>GameHub</Link>
        <ul>
            <li><Link to={'/logado'}>Início</Link></li>
            <li><button onClick={handleLogout}>Sair</button></li>
        </ul>
    </div>
  )
}

export default Navbar