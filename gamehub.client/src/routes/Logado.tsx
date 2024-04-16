import Navbar from '../components/Navbar'
import { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import { FaRegComment } from "react-icons/fa";
import { SlDislike, SlLike } from "react-icons/sl";
import { TbPencilPlus, TbPencilX } from "react-icons/tb";

import classes from "./Logado.module.css";
import MakePostForm from '../components/MakePostForm';

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
  date: Date;
}

const Logado = () => {

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [showForm, setShowForm] = useState(false);

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

  function isValidDateString(dateString: Date): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  const getPosts = async () => {
    try{
      if (!user) return;
      const response = await axios.get<Post[]>('/Posts');
      setPosts(response.data.map(post => ({
        ...post,
        date: isValidDateString(post.date) ? new Date(post.date) : new Date()
      })));
    }catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

  //Recarrega os posts após 1 segundo
  useEffect(() => {
    getPosts();
    const interval = setInterval(() => {
      getPosts();
    }, 1000); // 1000 ms = 1 segundo
  
    return () => {
      clearInterval(interval);
    }
  }, [user, showForm]);

  if(!user){
    return <h1 className='loading'>Loading...</h1>
  }

  const handleShowForm = (e: FormEvent) => {
    e.preventDefault();

    setShowForm(!showForm);

  }
  

  return (
    <div className={classes.divMain}>

      <div className='navbar'>{<Navbar />}</div>
      
      <button className={classes.buttonMakePost} onClick={handleShowForm}>
      {showForm ? (
        <div className={classes.divMakePost}>
          <TbPencilX  className={classes.makePostIcon}/>
          <p>Cancelar</p>
        </div>
      ) : (
        <div className={classes.divMakePost}>
          <TbPencilPlus className={classes.makePostIcon}/>
          <p>Criar post</p>
        </div>
      )}
      </button>

      <div className={classes.formMakePost}>
        {showForm && <MakePostForm />}
      </div>

      <div className={classes.containerPosts}>
        {posts && posts.map((post: Post) => (
          <div key={post.id} className={classes.divPost}>
            <div className={classes.postHeader}>
              <p className={classes.author}>{post.author}</p>
              <p>-</p>
              <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
            </div>
            <div className={classes.postContent}>
              <h3 className={classes.title}>{post.title}</h3>
              <p className={classes.content}>{post.content}</p>
            </div>
            <div className={classes.postFooter}>
              <button>{<SlLike className={classes.postIcon}/>}</button>
              <button>{<SlDislike className={classes.postIcon}/>}</button>
              <button>{<FaRegComment className={classes.postIcon}/>}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Logado;