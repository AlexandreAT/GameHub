import {Link, useNavigate } from 'react-router-dom'
import { useState } from 'react';
import Cookies from 'js-cookie';

import { FaSearch } from "react-icons/fa";

import classes from "./Navbar.module.css";

interface Props{
  user?: User;
}

interface User {
  id: string;
  nickname: string;
  imageSrc: string;
}

function Navbar({ user }: Props) {

  const [showOpt, setShowOpt] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('.AspNetCore.Application.Authorization');
    navigate('/');
  }

  const handleOpt = () => {
    setShowOpt(!showOpt);
    console.log(showOpt);
  }

  return (
    <div className={classes.divNavbar}>
        <div className={classes.logoLink}><h1><Link to={'/logado'} className='linkLogo'>Game<span className='logoDetail'>Hub</span></Link></h1></div>
        <div className={classes.searchBar}>
          <FaSearch className={classes.icon} />
          <input type='text' name="search" id="search" placeholder='Procurar usuário ou comunidade...' />
        </div>
        <ul className={classes.ulNavbar}>
            <li><Link to={'/logado'} className={classes.navbarLink}><span>Início</span></Link></li>
            <li className={classes.navbarLink} onClick={handleOpt}>
              <span><img src={user?.imageSrc} className={classes.img}/> Perfil</span>
            </li>
            {showOpt === true && (
              <div className={classes.profileOpt}>
                <Link to={'/profile'} className={classes.option}>Ver perfil</Link>
                <p className={classes.option} onClick={handleLogout}>Sair</p>
              </div>
            )} 
        </ul>
    </div>
  )
}

export default Navbar