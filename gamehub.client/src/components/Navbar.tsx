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
        <Link to={'/logado'}><h1>Game<span className='logoDetail'>Hub</span></h1></Link>
        <ul className={classes.ulNavbar}>
            <li><Link to={'/logado'} className={classes.navbarLink}>Início</Link></li>
            <li><Link to={'/profile'} className={classes.navbarLink}>Perfil</Link></li>
            <li><button className='btn' onClick={handleLogout}>Sair</button></li>
        </ul>
    </div>
  )
}

export default Navbar