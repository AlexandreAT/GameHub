import { Navigate, useNavigate, Link } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import { FaRegComment } from "react-icons/fa";
import { SlDislike, SlLike } from "react-icons/sl";
import { TbPencilPlus, TbPencilX } from "react-icons/tb";
import { FaCommentSlash } from "react-icons/fa6";
import Navbar from '../components/Navbar'

import * as qs from 'qs';
import Cookies from 'js-cookie';

import classes from "./Logado.module.css";
import MakePostForm from '../components/MakePostForm';
import CommentsForm from '../components/CommentsForm';

interface User {
  id: string;
  name: string;
  imageSrc: string;
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

const Logado = () => {

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showFormComment, setShowFormComment] = useState<{ id: string; show: boolean }[]>([]);
  const [activeCommentButtons, setActiveCommentButtons] = useState<Record<string, boolean>>({});
  const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});

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
      console.clear();
      console.log('Error fetching user:', error);
    }
  }

  const checksFeedback = () => {
    // Verifica se o usuário já deu like ou dislike
    if (user) {
      for (const post of posts) {
          if(post.like && post.dislike){
            const userLike = post.like.find(like => like.userId === user.id);
            const userDislike = post.dislike.find(dislike => dislike.userId === user.id);

            if (userLike) {
              setOpinionButtons(prevState => ({
                ...prevState,
                [post.id]: 'like',
              }));
            } else if (userDislike) {
              setOpinionButtons(prevState => ({
                ...prevState,
                [post.id]: 'dislike',
              }));
            } else{
              setOpinionButtons(prevState => ({
                ...prevState,
                [post.id]: null,
              }));
            }
          }
          else if(post.like){
            const userLike = post.like.find(like => like.userId === user.id);
    
            if (userLike) {
              setOpinionButtons(prevState => ({
                ...prevState,
                [post.id]: 'like',
              }));
            } 
            else{
              setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: null,
            }));
          }
        }
        else if(post.dislike){
          const userDislike = post.dislike.find(dislike => dislike.userId === user.id);

          if (userDislike) {
            setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: 'dislike',
            }));
          }
          else{
            setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: null,
            }));
          }
        }
      }
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

  useEffect(() => {
    checksFeedback();
  }, [posts])

  if(!user){
    return <h1 className='loading'>Carregando...</h1>
  }

  const handleShowForm = (e: FormEvent) => {
    e.preventDefault();
    setShowForm(!showForm);
  }

  const handleShowFormComment = (id: string) => {
    setActiveCommentButtons(prevState => ({
      ...prevState,
      [id]: !prevState[id]
    }));

    const index = showFormComment.findIndex(item => item.id === id);
    if (index >= 0) {
      const newShowFormComment = [...showFormComment];
      newShowFormComment[index] = { id, show:!newShowFormComment[index].show };
      setShowFormComment(newShowFormComment);
    } else {
      setShowFormComment([...showFormComment, { id, show: true }]);
    }
  }

  const handleOpinionButtonClick = async (postId: string, opinion: 'like' | 'dislike') => {
    setOpinionButtons(prevState => ({
      ...prevState,
      [postId]: opinion === prevState[postId] ? null : opinion
    }));

    if (opinion === 'like') {
      handleLike(postId);
    } else {
      handleDislike(postId);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
  
    try {
        await axios.post("Posts/like", qs.stringify({
        postId,
        userId: user.id,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };
  
  const handleDislike = async (postId: string) => {
    if (!user) return;
  
    try {
        await axios.post("Posts/dislike", qs.stringify({
        postId,
        userId: user.id,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    } catch (error) {
      console.error('Error disliking post:', error);
    }
  };

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
        {showForm && <MakePostForm user={user} />}
      </div>
        {!posts ? (
          <div className={classes.containerPosts}>
            <h1 className="loading">Carregando posts...</h1>
          </div>
        ) : (
          <div className={classes.containerPosts}>
            {posts && posts.map((post: Post) => (
              <div key={post.id} className={classes.divPost}>
                <div className={classes.postHeader}>
                  {post.idAuthor === user.id ? 
                    <Link to={"/perfil"}><p className={classes.author}>{post.author} (você)</p></Link>                
                  :
                    <Link to={`/AnotherProfile/${post.idAuthor}`}><p className={classes.author}>{post.author}</p></Link>
                  }
                  <span>-</span>
                  <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                </div>
                <div className={classes.postContent}>
                  <h3 className={classes.title}>{post.title}</h3>
                  <p className={classes.content}>{post.content}</p>
                </div>
                <div className={classes.postFooter}>
                  <button onClick={() => handleOpinionButtonClick(post.id, 'like')}>
                    {opinionButtons[post.id] === 'like' ? (
                      <div className={classes.divLike}>
                        <SlLike className={`${classes.postIcon} ${classes.opinionActivatedLike} iconOpinion`} />
                        {post.like && post.like.length > 0 && (
                          <p>{post.like.length}</p>
                        )}
                      </div>
                    ) : (
                      <div className={classes.divLike}>
                        <SlLike className={`${classes.postIcon} iconOpinion`} />
                        {post.like && post.like.length > 0 && (
                          <p>{post.like.length}</p>
                        )}
                      </div>
                    )}
                  </button>
                  <button onClick={() => handleOpinionButtonClick(post.id, 'dislike')}>
                    {opinionButtons[post.id] === 'dislike' ? (
                      <div className={classes.divLike}>
                        <SlDislike className={`${classes.postIconDislike} ${classes.opinionActivatedDislike} iconOpinion`} />
                        {post.dislike && post.dislike.length > 0 && post.idAuthor === user.id && (
                            <p>{post.dislike.length}</p>
                        )}
                      </div>
                    ) : (
                      <div className={classes.divLike}>
                        <SlDislike className={`${classes.postIconDislike} iconOpinion`} />
                        {post.dislike && post.dislike.length > 0 && post.idAuthor === user.id && (
                            <p>{post.dislike.length}</p>
                        )}
                      </div>
                    )}
                  </button>

                  <button onClick={() => handleShowFormComment(post.id)}>
                    {activeCommentButtons[post.id] ? (
                      <FaCommentSlash className={`${classes.postIcon} iconOpinion`} />
                    ) : (
                      <FaRegComment className={`${classes.postIcon} iconOpinion`} />
                    )}
                  </button>
                    
                </div>
                <div>
                { showFormComment.some(item => item.id === post.id) && showFormComment.find(item => item.id === post.id)!.show && <CommentsForm postId={post.id} userId={user.id}/>}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default Logado;