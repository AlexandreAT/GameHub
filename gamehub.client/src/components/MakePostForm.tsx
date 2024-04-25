import { FormEvent, useState } from 'react';
import classes from './MakePostForm.module.css'
import { axios } from '../axios-config';

interface User {
    id: string;
    nickname: string;
  }

const MakePostForm = ({ user }: { user: User | null }) => {

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    if(!user){
        return <h1 className='loading'>Carregando...</h1>
    }

    const postData = async (url: string, data: any) => {
    try{
      // Converte as propriedades do objeto Post para PascalCase
      const postPascalCase = {
        Author: data.author,
        IdAuthor: data.idAuthor,
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

    const author = user.nickname;
    const idAuthor = user.id;
    try{
      const response = await postData('/Posts', {
        author,
        idAuthor,
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
        clearPostForm();
      }
    }catch (error) {
      console.error('Erro ao postar:', error);
    }
  }

  return (
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
  )
}

export default MakePostForm