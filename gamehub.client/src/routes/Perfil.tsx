import Navbar from '../components/Navbar'
import React, { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';

interface Community {
  id: string;
  creator: AnotherUser;
  name: string;
  game: string;
}

interface AnotherUser {
  id: string;
  name: string;
  imgSrc: string;
}

interface User {
    id: string;
    name: string;
    surname: string;
    cpf: string;
    phone: string;
    email: string;
    password: string;
    posts: Post[];
    imgSrc: string;
    following: AnotherUser[];
    UserCommunities: Community[];
    UserCreatedCommunities: Community[];
    biography: string;
    city: string;
    state: string;
}

interface LikeDisLike {
  userId: string;
  userName: string;
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

function Perfil() {

    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
          try {
            const response = await axios.get<User>('/Users/current');
            setUser(response.data);
          } catch (error) {
            console.error('Error fetching users:', error);
          }
        };
    
        fetchUsers();
    }, []);
    
    if(!user){
        return <h1 className='loading'>Loading...</h1>
    }

  return (
    <div>
        <div className='navbar'>{<Navbar />}</div>
        <h1>{user.name}</h1>
        <p>{user.surname}</p>
        <p>{user.cpf}</p>
        <p>{user.phone}</p>
        <p>{user.email}</p>
        <p>{user.password}</p>
        <p>Seguindo: {!user.following ? (
          <span>Sem seguidores</span> 
        ):
        user.following.map((following: AnotherUser) => (
          <p key={following.id}>{following.name}</p>
        ))
        }</p>
        <p>Biografia: {!user.biography ? (
          <span>Sem biografia</span>
        ):
          user.biography
        }</p>
        <p>Cidade: {!user.city ? (
          <span>Sem uma cidade registrada</span>
         ):
          user.city
         }</p>
        <p>Estado: {!user.state ? (
          <span>Sem um estado registrado</span>
        ):
          user.state
        }</p>
        <p>Comunidades em que faz parte: {!user.UserCommunities ? (
          <span>Não faz parte de comunidades</span>
        ): 
          user.UserCommunities.map((community: Community) => (
          <p key={community.id}>{community.name}</p>
        ))
        }</p>
        <p>Comunidades criadas: {!user.UserCreatedCommunities ? (
          <span>Sem comunidades criadas</span>
        ):
          user.UserCreatedCommunities.map((community: Community) => (
            <p key={community.id}>{community.name}</p>
          ))
        }</p>
        <br />
        <br />
        <h3>Posts:</h3>
        {user.posts && user.posts.map((post: Post) => (
            <div key={post.id}>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <br />
            </div>
        ))}

    </div>
  )
}

export default Perfil