import Navbar from '../components/Navbar'
import React, { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';

import classes from "./Logado.module.css";

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

const Logado = () => {

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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
    return <h1>Loading...</h1>
  }

  const postData = async (url: string, data: any) => {
    try{
      // Converte as propriedades do objeto Post para PascalCase
      const postPascalCase = {
        Author: data.author,
        Title: data.title,
        Content: data.content
      };

      const response = await axios.post(url, postPascalCase, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return { data: response.data, error: null };
    }catch (error: any) {
      console.error('Error posting data:', error);
      if (error.response) {
        return { data: null, error: error.response.data };
      } else if (error.request) {
        return { data: null, error: { message: 'No response received from the server.' } };
      } else {
        return { data: null, error: { message: 'Error making the request.' } };
      }
    }
  }

  const addPostUser = async (url: string, post: any) => {
    try{
      await axios.post(url, post, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }catch (error: any) {
        console.error('Error posting data:', error);
        if (error.response) {
          return { data: null, error: error.response.data };
        } else if (error.request) {
          return { data: null, error: { message: 'No response received from the server.' } };
        } else {
          return { data: null, error: { message: 'Error making the request.' } };
        }
    }
  }

  const clearPostForm = () => {
    setTitle('');
    setContent('');
  }

  const submitPost = async (e: FormEvent) => {
    e.preventDefault();

    const author = user.name;
    try{
      const response = await postData('/Posts', {
        author,
        title,
        content
      })
      if (response.error) {
        console.log('Error from the backend:', response.error);
        if(response.error.errors.Title !== undefined){
          if(response.error.errors.Title[0] !== undefined) {
            alert('Erro: '+ response.error.errors.Title[0]);
          }
          else {
            alert('Erro: '+ response.error.errors.Title[1]);
          }
        }
        if(response.error.errors.Content !== undefined){
          if(response.error.errors.Content[0] !== undefined) {
            alert('Erro: '+ response.error.errors.Content[0]);
          }
          else {
            alert('Erro: '+ response.error.errors.Content[1]);
          }
        }
      } else {
        console.log('Postado com sucesso!', response.data);
        await addPostUser('/Users/posts/'+user.id, response.data);
        await getPosts();
        clearPostForm();
      }
    }catch (error) {
      console.error('Erro ao cadastrar post:', error);
    }
  }

  return (
    <div>
      <div className='navbar'>{<Navbar />}</div>
      <div className={classes.containerPost}>
        <h2>Fazer postagem</h2>
        <form className={classes.formPost} onSubmit={submitPost}>
          <div>
            <label htmlFor="title">Título: </label>
            <input type="text" name='title' placeholder='Digite um título...' onChange={(e) => setTitle(e.target.value)} value={title}/>
          </div>
          <div className={classes.divTextarea}>
            <label htmlFor="content">Conetúdo: </label>
            <textarea name="content" placeholder='Digite o conteúdo do post...' onChange={(e) => setContent(e.target.value)} value={content}></textarea>
          </div>
          <div className={classes.divButton}>
            <button className={classes.button} type='submit'>Postar</button>
          </div>
        </form>
      </div>


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
  );
};

export default Logado;