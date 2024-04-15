import Navbar from '../components/Navbar'
import React, { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { Navigate } from 'react-router-dom';

interface User {
    id: string;
    name: string;
    surname: string;
    cpf: string;
    phone: string;
    email: string;
    password: string;
    posts: Post;
}

interface Post{
    id: string;
    author: string;
    title: string;
    content: string;
    comments: string;
    date: number;
}

function Perfil() {

    const [user, setUser] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);

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
    

    const getPosts = async () => {
        try{
          if (!user) return;
          const response = await axios.get('/Users/posts/'+user.id, {params: {
            id: user.id
          }})
          setPosts(response.data);
        }catch (error) {
          console.error('Error fetching posts:', error);
        }
    }

    useEffect(() => {
        getPosts();
        const interval = setInterval(() => {
          getPosts();
        }, 60000); // 60000 ms = 1 minuto
      
        return () => {
          clearInterval(interval);
        }
    }, [user]);
    
    if(!user){
        return <h1 className='loading'>Loading...</h1>
    }

  return (
    <div>
        <div className='navbar'>{<Navbar />}</div>
        {user.name}
        <br></br>
        {user.email}
        <br></br>
        {user.password}
        <br></br>
        {user.surname}
        <br></br>
        <br></br>
        {posts && posts.map((post: Post) => (
            <div key={post.id}>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
            </div>
        ))}
    </div>
  )
}

export default Perfil