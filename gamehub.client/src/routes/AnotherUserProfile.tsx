import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from './AnotherUserProfile.module.css'
import UserPostsComponent from '../components/UserPostsComponent';
import Sidebar from '../components/Sidebar';

interface AnotherUser {
  id: string;
  name: string;
  surname: string;
  nickname: string;
  imageSrc: string;
  following: string[];
  followers: string[];
  biography: string;
  city: string;
  state: string;
  userCommunities: string[];
  userCreatedCommunities: string[];
  backgroundImage: string;
}

interface SimplifiedUser {
  userId: string;
  nickName: string;
  userImageSrc: string;
}

interface User {
  id: string;
  nickname: string;
  imageSrc: string;
  userCommunities: string[];
  userCreatedCommunities: string[];
  following: string[];
}

interface SimplifiedCommunity {
  id: string;
  name: string;
  creatorId: string;
  iconeImageSrc: string;
}

const AnotherUserProfile = () => {

  const { id } = useParams();
  const [anotherUser, setAnotherUser] = useState<AnotherUser>();
  const [user, setUser] = useState<User | null>(null);
  const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
  const [simplifiedCommunity, setSimplifiedCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);
  const [simplifiedFollowingCommunity, setSimplifiedFollowingCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get<User>('/Users/current');
        setUser(response.data);
      } catch (error) {
        console.clear();
        console.error('Error fetching user:', error);

        const token = Cookies.get('.AspNetCore.Application.Authorization');

        if (!token) {
          navigate('/');
          alert("Faça o login novamente");
        }
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAnotherUser = async () => {
      try {
        const response = await axios.get(`/Users/anotherUser/${id}`, {
          params: {
            userId: id,
          }
        });
        setAnotherUser(response.data);
      } catch (error) {
        console.clear();
        console.error('Error fetching user:', error);
      }
    }

    fetchAnotherUser();
  }, [id])

  if (!anotherUser) {
    return <h1 className='loading'>Carregando usuário...</h1>
  }

  if (!user) {
    return <h1 className='loading'>Carregando...</h1>
  }

  const followUser = async () => {

    const data = {
      followingId: anotherUser.id,
      userId: user.id,
    };

    try {
      await axios.post("/Users/followUser", qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      window.location.reload();
    } catch (error) {
      console.clear();
      console.log('Error following user:', error);
    }
  }

  const navigateAnotherUser = (userId: string) => {
    navigate(`/anotherProfile/${userId}`);
    window.location.reload();
  }

  const getFollowersOrFollowing = async (url: string, data: any) => {
    try {
      const response = await axios.post(url, qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      setSimplifiedUsers(response.data);
    } catch (error) {
      console.clear();
      console.error(error);
    }
  }

  const getUsers = (opt: string) => {
    try {
      getFollowersOrFollowing("/Users/getFollowersOrFollowing", {
        opt: opt,
        userId: anotherUser.id
      });
    }
    catch (error) {
      console.error(error);
    }
  }

  const getCreatedOrFollowingCommunities = async (url: string, data: any, opt: string) => {
    try {
      const response = await axios.post(url, qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (opt === "following") {
        setSimplifiedFollowingCommunity(response.data);
      }
      else if (opt === "created") {
        setSimplifiedCommunity(response.data);
      }
    } catch (error) {
      console.clear();
      console.error(error);
    }
  }

  const getCommunity = async (opt: string) => {
    if (opt === "following") {
      setSimplifiedFollowingCommunity(undefined);
    }
    else if (opt === "created") {
      setSimplifiedCommunity(undefined);
    }
    if (user) {
      try {
        await getCreatedOrFollowingCommunities("/Users/getFollowingCommunityOrCreatedCommunity", {
          opt: opt,
          userId: anotherUser.id
        }, opt);
      } catch (error) {
        console.clear();
        console.error(error);
      }
    }
  }

  return (
    <div className={classes.divProfileMain}>
      <div className='navbar'>{<Navbar />}</div>
      <div className={classes.divUser}>

        <Sidebar user={user} />

        <div className={classes.divUserInfo}>
          <div className={classes.userInfoContent}>
            <div className={classes.userImg}>
              {anotherUser.imageSrc ? (
                <img src={anotherUser.imageSrc} alt={anotherUser.nickname} />
              ) : (
                <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
              )}
            </div>
            <div className={classes.anotherUserData}>
              <header className={classes.anotherUserDataHeader}>
                <h2>{anotherUser.nickname}</h2>
                <button className='btnTransparent' onClick={followUser}>
                  {anotherUser.followers != undefined && anotherUser.followers.includes(user.id) ? (
                    <span>deixar de seguir</span>
                  ) : (
                    <span>seguir</span>
                  )}
                </button>
              </header>
              <div className={classes.anotherUserDataContent}>
                <div>
                  <p>Nome: <span className={classes.spanData}>{anotherUser.name}</span></p>
                  <p>Sobrenome: <span className={classes.spanData}>{anotherUser.surname}</span></p>
                </div>
                <div>
                  <p>Cidade: {!anotherUser.city ? (
                    <span className={classes.noRegistry}>Sem uma cidade registrada</span>
                  ) :
                    <span className={classes.spanData}>{anotherUser.city}</span>
                  }</p>
                  <p>Estado: {!anotherUser.state ? (
                    <span className={classes.noRegistry}>Sem um estado registrado</span>
                  ) :
                    <span className={classes.spanData}>{anotherUser.state}</span>
                  }</p>
                </div>
              </div>
            </div>
          </div>
          <div className={classes.anotherUserInfoFooter}>
            <div className={classes.footerDiv}>
              <div className={classes.paragraph}><Link to={`/listFollowersOrFollowings/${anotherUser.id}/${"following"}`} className={classes.link}>Seguindo: </Link>{!anotherUser.following || anotherUser.following.length <= 0 ? (
                <span className={classes.noRegistry}>Não segue ninguém</span>
              ) :
                <div className={classes.divShowSimplified}>
                  <span className={classes.spanData} onMouseOver={() => getUsers("following")}>{anotherUser.following.length}</span>
                  <div className={classes.divSimplifiedData}>
                    {simplifiedUsers && simplifiedUsers.map((mapUser: SimplifiedUser) => (
                      mapUser.userId === user.id ? (
                        <Link to={"/profile"} key={mapUser.userId}><p className={classes.spanData}><img src={mapUser.userImageSrc} /> {mapUser.nickName} <span className={classes.youSpan}>(você)</span></p></Link>
                      ) : (
                        <p key={mapUser.userId} className={classes.spanData} onClick={() => navigateAnotherUser(mapUser.userId)}><img src={mapUser.userImageSrc} /> {mapUser.nickName}</p>
                      )
                    ))}
                  </div>
                </div>
              }</div>

              <div className={classes.paragraph}><Link to={`/listCommunities/${anotherUser.id}/${"following"}`} className={classes.link}>Comunidades em que faz parte: </Link>{!anotherUser.userCommunities ? (
                <span className={classes.noRegistry}>Não faz parte de comunidades</span>
              ) :
                <div className={classes.divShowSimplified}>
                  <span className={classes.spanData} onMouseOver={() => getCommunity("following")}>{anotherUser.userCommunities.length}</span>
                  {simplifiedFollowingCommunity !== undefined && (
                    <div className={classes.divSimplifiedData}>
                      {simplifiedFollowingCommunity && simplifiedFollowingCommunity.map((community: SimplifiedCommunity) => (
                        <Link to={`/communityPage/${community.id}`} key={community.id}><p className={classes.spanData}>
                          <img src={community.iconeImageSrc} />
                          {community.name}
                        </p></Link>
                      ))}
                    </div>
                  )}
                </div>
              }</div>

              <div className={classes.paragraph}><Link to={`/listCommunities/${anotherUser.id}/${"created"}`} className={classes.link}>Comunidades criadas: </Link>{!anotherUser.userCreatedCommunities || anotherUser.userCreatedCommunities.length <= 0 ? (
                <span className={classes.noRegistry}>Sem comunidades criadas</span>
              ) :
                <div className={classes.divShowSimplified}>
                  <span className={classes.spanData} onMouseOver={() => getCommunity("created")}>{anotherUser.userCreatedCommunities.length}</span>
                  {simplifiedCommunity !== undefined && (
                    <div className={classes.divSimplifiedData}>
                      {simplifiedCommunity && simplifiedCommunity.map((community: SimplifiedCommunity) => (
                        <Link to={`/communityPage/${community.id}`} key={community.id}><p className={classes.spanData}>
                          <img src={community.iconeImageSrc} />
                          {community.name}
                        </p></Link>
                      ))}
                    </div>
                  )}
                </div>
              }</div>

            </div>
            <div className={classes.divBiography}>
              <p>Biografia: <br />{!anotherUser.biography ? (
                <span className={classes.noRegistry}>Sem biografia</span>
              ) :
                <span className={classes.spanData} dangerouslySetInnerHTML={{ __html: anotherUser.biography.replace(/\n/g, '<br/>') }}></span>
              }</p>
            </div>
          </div>
        </div>

        <UserPostsComponent user={user} anotherUser={anotherUser} />
      </div>
    </div>
  )
}

export default AnotherUserProfile