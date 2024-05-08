import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from './AnotherUserProfile.module.css'
import UserPostsComponent from '../components/UserPostsComponent';

interface SimplifiedCommunity {
  id: string;
  name: string;
  creatorId: string;
}

interface AnotherUser {
  id: string;
  name: string;
  surname: string;
  nickname: string;
  imageSrc: string;
  following: SimplifiedUser[];
  followers: string[];
  biography: string;
  city: string;
  state: string;
  UserCommunities: SimplifiedCommunity[];
  UserCreatedCommunities: SimplifiedCommunity[];
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
}

const AnotherUserProfile = () => {

  const { id } = useParams();
  const [anotherUser, setAnotherUser] = useState<AnotherUser>();
  const [user, setUser] = useState<User | null>(null);
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

  return (
    <div className={classes.divProfileMain}>
      <div className='navbar'>{<Navbar />}</div>
      <div className={classes.divUser}>
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
                  {anotherUser.followers.includes(user.id) ? (
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
              <p>Seguindo: {!anotherUser.following ? (
                <span className={classes.noRegistry}>Não segue ninguém</span>
              ) :
                <div className={classes.divShowSimplified}>
                  <span className={classes.spanData}>{anotherUser.following.length}</span>
                  <div className={classes.divSimplifiedData}>
                    {anotherUser.following.map((mapUser: SimplifiedUser) => (
                      mapUser.userId === user.id ? (
                        <Link to={"/profile"}><p key={mapUser.userId} className={classes.spanData}><img src={mapUser.userImageSrc} /> {mapUser.nickName} <span className={classes.youSpan}>(você)</span></p></Link>
                      ): (
                        <p key={mapUser.userId} className={classes.spanData} onClick={(e) => navigateAnotherUser(mapUser.userId)}><img src={mapUser.userImageSrc} /> {mapUser.nickName}</p>
                      )
                    ))}
                  </div>
                </div>
              }</p>
              <p>Comunidades em que faz parte: {!anotherUser.UserCommunities ? (
                <span className={classes.noRegistry}>Não faz parte de comunidades</span>
              ) :
                anotherUser.UserCommunities.map((community: SimplifiedCommunity) => (
                  <p key={community.id} className={classes.spanData}>{community.name}</p>
                ))
              }</p>
              <p>Comunidades criadas: {!anotherUser.UserCreatedCommunities ? (
                <span className={classes.noRegistry}>Sem comunidades criadas</span>
              ) :
                anotherUser.UserCreatedCommunities.map((community: SimplifiedCommunity) => (
                  <p key={community.id} className={classes.spanData}>{community.name}</p>
                ))
              }</p>
            </div>
            <div className={classes.divBiography}>
              <p>Biografia: <br/>{!anotherUser.biography ? (
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