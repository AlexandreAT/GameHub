import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { axios } from '../axios-config';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from './AnotherUserProfile.module.css'
import UserPostsComponent from '../components/UserPostsComponent';

interface SimplifiedCommunity{
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

interface SimplifiedUser{
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
        const response = await axios.get(`/Users/anotherUser/${id}`, {params: {
          userId: id,
        }});
        setAnotherUser(response.data);
      } catch (error){
        console.clear();
        console.error('Error fetching user:', error);
      }
    }

    fetchAnotherUser();
  }, [])

  if(!anotherUser){
    return <h1 className='loading'>Carregando usuário...</h1>
  }

  if(!user){
    return <h1 className='loading'>Carregando...</h1>
  }

  const followUser = async () => {

    const data = {
      followingId: anotherUser.id,
      userId: user.id,
    };

    try{
      await axios.post("/Users/followUser", qs.stringify(data), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      window.location.reload();
    } catch(error){
      console.clear();
      console.log('Error following user:', error);
    }
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
                      {anotherUser.followers.length !== 0 ? 
                      (anotherUser.followers.map((followerId: string) => (
                        followerId !== user.id ? (
                          <span>seguir</span>
                        ): (
                          <span>deixar de seguir</span>
                        )
                      ))): (
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
                      ):
                        <span className={classes.spanData}>{anotherUser.city}</span>
                      }</p>
                      <p>Estado: {!anotherUser.state ? (
                        <span className={classes.noRegistry}>Sem um estado registrado</span>
                      ):
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
                    ):
                      <span>{anotherUser.following.length}</span>
                    }</p>
                    <p>Comunidades em que faz parte: {!anotherUser.UserCommunities ? (
                      <span className={classes.noRegistry}>Não faz parte de comunidades</span>
                    ): 
                    anotherUser.UserCommunities.map((community: SimplifiedCommunity) => (
                      <p key={community.id}>{community.name} className={classes.spanData}</p>
                    ))
                    }</p>
                    <p>Comunidades criadas: {!anotherUser.UserCreatedCommunities ? (
                      <span className={classes.noRegistry}>Sem comunidades criadas</span>
                    ):
                    anotherUser.UserCreatedCommunities.map((community: SimplifiedCommunity) => (
                        <p key={community.id}>{community.name} className={classes.spanData}</p>
                      ))
                    }</p>
                  </div>
                  <div className={classes.divBiography}>
                    <p>Biografia: {!anotherUser.biography ? (
                      <span className={classes.noRegistry}>Sem biografia</span>
                    ):
                      <span className={classes.spanData} dangerouslySetInnerHTML={{ __html: anotherUser.biography.replace(/\n/g, '<br/>') }}></span>
                    }</p>
                  </div>
                </div>
            </div>

            <UserPostsComponent user={user} anotherUser={anotherUser}/>
          </div>
    </div>
  )
}

export default AnotherUserProfile