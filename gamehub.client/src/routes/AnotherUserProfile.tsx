import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { axios } from '../axios-config';
import { useParams, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

interface SimplifiedCommunity{
  id: string;
  name: string;
  creatorId: string;
}

interface AnotherUser {
    id: string;
    name: string;
    surname: string;
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

  return (
    <div>
        <div className='navbar'>{<Navbar />}</div>
        <h1>Another User Profile</h1>
        <h3>Nome: {anotherUser.name}</h3>
        <p>Sobrenome: {anotherUser.surname}</p>
        <p>Seguindo: {!anotherUser.following ? (
          <span>Sem seguidores</span> 
        ):
        anotherUser.following.map((following: SimplifiedUser) => (
          <p key={following.userId}>{following.nickName}</p>
        ))
        }</p>
        <p>Biografia: {!anotherUser.biography ? (
          <span>Sem biografia</span>
        ):
          anotherUser.biography
        }</p>
        <p>Cidade: {!anotherUser.city ? (
          <span>Sem uma cidade registrada</span>
         ):
          anotherUser.city
         }</p>
        <p>Estado: {!anotherUser.state ? (
          <span>Sem um estado registrado</span>
        ):
          anotherUser.state
        }</p>
        <p>Comunidades em que faz parte: {!anotherUser.UserCommunities ? (
          <span>Não faz parte de comunidades</span>
        ): 
          anotherUser.UserCommunities.map((community: SimplifiedCommunity) => (
          <p key={community.id}>{community.name}</p>
        ))
        }</p>
        <p>Comunidades criadas: {!anotherUser.UserCreatedCommunities ? (
          <span>Sem comunidades criadas</span>
        ):
          anotherUser.UserCreatedCommunities.map((community: SimplifiedCommunity) => (
            <p key={community.id}>{community.name}</p>
          ))
        }</p>
        <br />
        <br />
        <h3>Posts:</h3>
    </div>
  )
}

export default AnotherUserProfile