import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

import { FaSearch } from "react-icons/fa";

import classes from "./Navbar.module.css";
import axios from 'axios';

interface Props {
  user?: User;
}

interface User {
  id: string;
  nickname: string;
  imageSrc: string;
}

interface SimplifiedUser {
  userId: string;
  nickName: string;
  userImageSrc: string;
  backgroundImage: string;
}

interface SimplifiedCommunity {
  id: string;
  name: string;
  creatorId: string;
  iconeImageSrc: string;
}

function Navbar({ user }: Props) {

  const [showOpt, setShowOpt] = useState(false);
  const [search, setSearch] = useState('');
  const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
  const [simplifiedCommunities, setSimplifiedCommunities] = useState<SimplifiedCommunity[] | undefined>(undefined);
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('.AspNetCore.Application.Authorization');
    navigate('/');
  }

  const handleOpt = () => {
    setShowOpt(!showOpt);
  }

  const getUsers = async (url: string, query: string) => {
    try {
      const response = await axios.get<SimplifiedUser[]>(url, {
        params: {
          query: query
        }
      });
      setSimplifiedUsers(response.data);
    } catch (error) {

    }
  }

  const getCommunities = async (url: string, query: string) => {
    try {
      const response = await axios.get<SimplifiedCommunity[]>(url, {
        params: {
          query: query
        }
      });
      setSimplifiedCommunities(response.data);
    } catch (error) {

    }
  }

  useEffect(() => {
    if (search !== '') {
      try {
        getUsers('/Users/search', search);
      } catch (error) {
        console.log(error);
      }

      try {
        getCommunities('/Community/search', search);
      } catch (error) {
        console.log(error);
      }
    } else {
      setSimplifiedUsers(undefined); // Limpar o estado quando o usuário apaga o conteúdo da barra de pesquisa
      setSimplifiedCommunities(undefined);
    }
  }, [search])

  const navigateSearch = (search: string) => {
    navigate(`/searchPage/${search}`);
  }

  return (
    <div className={classes.divNavbar}>
      <div className={classes.logoLink}><h1><Link to={'/logado'} className='linkLogo'>Game<span className='logoDetail'>Hub</span></Link></h1></div>
      <form className={classes.searchBar} onSubmit={() => navigateSearch(search)}>
        <FaSearch className={classes.icon} />
        <input type='text' name="search" id="search" placeholder='Procurar usuário ou comunidade...' onChange={(e) => setSearch(e.target.value)} value={search} />
        {simplifiedUsers && simplifiedCommunities && (
          <div className={classes.simplifiedDisplay}>
            <p className={classes.divisionSearch}>Usuários</p>
            {simplifiedUsers.length > 0 ? simplifiedUsers.map((anotherUser: SimplifiedUser) =>
              anotherUser.userId !== user?.id && (
                <Link to={`/anotherProfile/${anotherUser.userId}`} key={anotherUser.userId}><p className={classes.spanData}>
                  <img src={anotherUser.userImageSrc} />
                  {anotherUser.nickName}
                </p></Link>
              )
            ) : (
              <p className={classes.noRegistry}>Usuário não encontrado</p>
            )}

            <p className={classes.divisionSearchCommunity}>Comunidades</p>
            {simplifiedCommunities.length > 0 ? simplifiedCommunities.map((community: SimplifiedCommunity) =>
              <Link to={`/communityPage/${community.id}`} key={community.id}><p className={classes.spanData}>
                <img src={community.iconeImageSrc} />
                {community.name}
              </p></Link>
            ) : (
              <p className={classes.noRegistry}>Comunidade não encontrada</p>
            )}
          </div>
        )}
      </form>
      <ul className={classes.ulNavbar}>
        <li><Link to={'/logado'} className={classes.navbarLink}><span>Início</span></Link></li>
        <li className={classes.navbarLink} onClick={handleOpt}>
          <span><img src={user?.imageSrc} className={classes.img} /> Perfil</span>
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