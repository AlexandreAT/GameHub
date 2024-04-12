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
  author: string;
  title: string;
  content: string;
  comments: string;
  date: number;
}

const Logado = () => {

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post | null>(null);

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
        alert('Error:'+ response.error);
      } else {
        console.log('Postado com sucesso!', response.data);
        await addPostUser('/Users/posts/'+user.id, response.data);
      }
    }catch (error) {
      console.error('Erro ao cadastrar post:', error);
    }
  }

  useEffect(() => {
    const getPosts = async (url: string, id: string) => {
      try{
        const response = await axios.get('/Users/posts/'+user.id, user.id)
      }
    }
  }, [postData]);

  return (
    <div>
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
            <button type='submit'>Postar</button>
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
      titulo post: {user.posts.title}
    </div>
  );
};

export default Logado;