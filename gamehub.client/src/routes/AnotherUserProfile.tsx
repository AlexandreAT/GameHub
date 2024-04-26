import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { axios } from '../axios-config';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import classes from './AnotherUserProfile.module.css'

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
    imgSrc: string;
    following: SimplifiedUser[];
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

interface LikeDisLike {
  simplifiedUser: SimplifiedUser
  IsSelected: boolean;
}

interface Post{
  id: string;
  author: string;
  idAuthor: string;
  title: string;
  content: string;
  date: Date;
  like: LikeDisLike[];
  dislike: LikeDisLike[];
  game: string;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostsContainer, setShowPostsContainer] = useState(false);
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

  function isValidDateString(dateString: Date): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  const getUserPosts = async (url: string, userId: string) => {
    try{
      const response = await axios.get<Post[]>(url, {params: {
        id: userId
      }})
      setPosts(response.data.map(post => ({
        ...post,
        date: isValidDateString(post.date) ? new Date(post.date) : new Date()
      })));
    } catch (error){
      console.clear();
      console.log('Error fetching posts: ' +error);
    }
  }

  const showPosts = async () => {
    try{
      await getUserPosts(`/Posts/userPosts/${anotherUser.id}`, anotherUser.id);
      setShowPostsContainer(!showPostsContainer);
    } catch(error){
      console.clear();
      console.log('Error fetching posts: ' +error);
    }
  }



  return (
    <div className={classes.divProfileMain}>
        <div className='navbar'>{<Navbar />}</div>
          <div className={classes.divUser}>
            <div className={classes.divUserInfo}>
              <div className={classes.userInfoContent}>
                <div className={classes.userImg}>
                  <img src={anotherUser.imgSrc} alt='Foto de perfil' className={classes.anotherUserImage}/>
                  <button className={classes.btnImg}>Alterar imagem</button>
                </div>
                <div className={classes.anotherUserData}>
                  <header className={classes.anotherUserDataHeader}>
                    <h2>{anotherUser.nickname}</h2>
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
                        <span className={classes.spanData}>anotherUser.city</span>
                      }</p>
                      <p>Estado: {!anotherUser.state ? (
                        <span className={classes.noRegistry}>Sem um estado registrado</span>
                      ):
                        <span className={classes.spanData}>anotherUser.state</span>
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
                    anotherUser.following.map((following: SimplifiedUser) => (
                      <span key={following.userId} className={classes.spanData}>{following.nickName}</span>
                    ))
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
                      <span className={classes.spanData}>anotherUser.biography</span>
                    }</p>
                  </div>
                </div>
            </div>

            <button onClick={showPosts}>Mostrar posts do usuário</button>
            {showPostsContainer === true && (
              <div className={classes.containerPosts}>
                {posts && posts.map((post: Post) => (
                    <div key={post.id} className={classes.divPost}>
                        <div className={classes.postHeader}>
                          <p className={classes.author}>{post.author}</p>
                          <span>-</span>
                          <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                        </div>
                        <div className={classes.postContent}>
                          <h3 className={classes.title}>{post.title}</h3>
                          <div className={classes.content} dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}></div>
                        </div>
                    </div>
                ))}
                {!posts.length && (
                  <h3>Usuário sem posts!</h3>
                )}
              </div>
            )}
          </div>
    </div>
  )
}

export default AnotherUserProfile