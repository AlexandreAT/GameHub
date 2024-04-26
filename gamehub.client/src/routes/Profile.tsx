import Navbar from '../components/Navbar'
import React, { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { Navigate, useNavigate } from 'react-router-dom';

import classes from "./Profile.module.css";

interface SimplifiedCommunity{
  id: string;
  name: string;
  creatorId: string;
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

interface User {
    id: string;
    name: string;
    surname: string;
    nickname: string;
    cpf: string;
    phone: string;
    email: string;
    password: string;
    imgSrc: string;
    following: SimplifiedUser[];
    Followers: SimplifiedUser[];
    UserCommunities: SimplifiedCommunity[];
    UserCreatedCommunities: SimplifiedCommunity[];
    biography: string;
    city: string;
    state: string;
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

function Profile() {

    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [showPostsContainer, setShowPostsContainer] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showBiographyForm, setShowBiographyForm] = useState(false);
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
    
    if(!user){
        return <h1 className='loading'>Carregando...</h1>
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
        await getUserPosts(`/Posts/userPosts/${user.id}`, user.id);
        setShowPostsContainer(!showPostsContainer);
      } catch(error){
        console.clear();
        console.log('Error fetching posts: ' +error);
      }
    }

    const showForm = () => {
      setShowEditForm(!showEditForm);
    }

    const handleBiography = () => {
      setShowBiographyForm(!showBiographyForm);
    }

  return (
    <div className={classes.divProfileMain}>
        <div className='navbar'>{<Navbar />}</div>
        {!showEditForm ? (
          <div className={classes.divUser}>
            <div className={classes.divUserInfo}>
              <div className={classes.userInfoContent}>
                <div className={classes.userImg}>
                  <img src={user.imgSrc} alt='Foto de perfil' className={classes.userImage}/>
                  <button className={classes.btnImg}>Alterar imagem</button>
                </div>
                <div className={classes.userData}>
                  <header className={classes.userDataHeader}>
                    <h2>{user.nickname}</h2>
                    <button className={classes.btnProfile} onClick={showForm}>Editar perfil</button>
                  </header>
                  <div className={classes.userDataContent}>
                    <div>
                      <p>Nome: <span className={classes.spanData}>{user.name}</span></p>
                      <p>Sobrenome: <span className={classes.spanData}>{user.surname}</span></p>
                    </div>
                    <div>
                      <p>CPF: <span className={classes.spanData}>{user.cpf}</span></p>
                      <p>Telefone: {user.phone ? (
                        <span className={classes.spanData}>{user.phone}</span>
                      ): (
                        <span className={classes.noRegistry}>Sem telefone</span>
                      )}</p>
                    </div>
                    <div>
                      <p>Cidade: {!user.city ? (
                        <span className={classes.noRegistry}>Sem uma cidade registrada</span>
                      ):
                        <span className={classes.spanData}>user.city</span>
                      }</p>
                      <p>Estado: {!user.state ? (
                        <span className={classes.noRegistry}>Sem um estado registrado</span>
                      ):
                        <span className={classes.spanData}>user.state</span>
                      }</p>
                    </div>
                    <div>
                      <p className={classes.emailParagraph}>Email: <span className={classes.spanData}>{user.email}</span></p>
                    </div>
                    <div>
                      <p>Senha: <input type="password" value={user.password} disabled/></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={classes.userInfoFooter}>
                  <div className={classes.footerDiv}>
                    <p>Seguindo: {!user.following ? (
                      <span className={classes.noRegistry}>Não segue ninguém</span> 
                    ):
                    user.following.map((following: SimplifiedUser) => (
                      <span key={following.userId} className={classes.spanData}>{following.nickName}</span>
                    ))
                    }</p>
                    <p>Seguidores: {!user.Followers ? (
                      <span className={classes.noRegistry}>Sem seguidores</span> 
                    ):
                    user.Followers.map((followers: SimplifiedUser) => (
                      <span key={followers.userId} className={classes.spanData}>{followers.nickName}</span>
                    ))
                    }</p>
                    <p>Comunidades em que faz parte: {!user.UserCommunities ? (
                      <span className={classes.noRegistry}>Não faz parte de comunidades</span>
                    ): 
                      user.UserCommunities.map((community: SimplifiedCommunity) => (
                      <p key={community.id}>{community.name} className={classes.spanData}</p>
                    ))
                    }</p>
                    <p>Comunidades criadas: {!user.UserCreatedCommunities ? (
                      <span className={classes.noRegistry}>Sem comunidades criadas</span>
                    ):
                      user.UserCreatedCommunities.map((community: SimplifiedCommunity) => (
                        <p key={community.id}>{community.name} className={classes.spanData}</p>
                      ))
                    }</p>
                  </div>
                  <div className={classes.divBiography}>
                    <p>Biografia: {!user.biography ? (
                      <span className={classes.noRegistry}>Sem biografia</span>
                    ):
                      <span className={classes.spanData}>user.biography</span>
                    }</p>
                    <button onClick={handleBiography}>Editar biografia</button>
                    {showBiographyForm && (
                      <div className={classes.formBiography}>
                        <textarea className={classes.biographyText} placeholder='Digite sua biografia...'></textarea>
                        <div className={classes.footerFormBiography}>
                            <button>Enviar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            <button onClick={showPosts}>Mostrar seus posts</button>
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
        ): (
          <button onClick={showForm} className={classes.btnCancelar}>Cancelar</button>
        )}
    </div>
  )
}

export default Profile