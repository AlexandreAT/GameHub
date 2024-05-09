import { Navigate, useNavigate, Link } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import { FaRegComment } from "react-icons/fa";
import { SlDislike, SlLike } from "react-icons/sl";
import { TbPencilPlus, TbPencilX } from "react-icons/tb";
import { FaCommentSlash } from "react-icons/fa6";
import { IoTrashBin } from "react-icons/io5";
import { FaPeopleGroup } from "react-icons/fa6";
import { TiGroup } from "react-icons/ti";
import { FaRunning } from "react-icons/fa";
import { GoPlusCircle } from "react-icons/go";

import Navbar from '../components/Navbar'

import * as qs from 'qs';
import Cookies from 'js-cookie';

import classes from "./Logado.module.css";
import MakePostForm from '../components/MakePostForm';
import CommentsForm from '../components/CommentsForm';

interface User {
  id: string;
  nickname: string;
  imageSrc: string;
  userCommunities: SimplifiedCommunity[];
  userCreatedCommunities: SimplifiedCommunity[];
  following: SimplifiedUser[];
}

interface SimplifiedCommunity{
  id: string;
  name: string;
  creatorId: string;
  iconeImageSrc: string;
}

interface SimplifiedUser {
  userId: string;
  nickName: string;
  userImageSrc: string;
}

interface LikeDisLike {
  simplifiedUser: SimplifiedUser
  IsSelected: boolean;
}

interface Post {
  id: string;
  author: string;
  idAuthor: string;
  authorImage: string;
  title: string;
  content: string;
  date: Date;
  like: LikeDisLike[];
  dislike: LikeDisLike[];
  imageSrc: string;
}

const Logado = () => {

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showFormComment, setShowFormComment] = useState<{ id: string; show: boolean }[]>([]);
  const [activeCommentButtons, setActiveCommentButtons] = useState<Record<string, boolean>>({});
  const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [updatedPosts, setUpdatedPosts] = useState(false);
  const [showImage, setShowImage] = useState<{ id: string; show: boolean }[]>([]);
  const [activeImageButton, setActiveImageButton] = useState<Record<string, boolean>>({});

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
    try {
      if (!user) return;
      const response = await axios.get<Post[]>('/Posts');
      setPosts(response.data.map(post => ({
        ...post,
        date: isValidDateString(post.date) ? new Date(post.date) : new Date()
      })));
    } catch (error) {
      console.clear();
      console.log('Error fetching user:', error);
    }
  }

  const checksFeedback = () => {
    // Verifica se o usuário já deu like ou dislike
    if (user) {
      for (const post of posts) {
        if (post.like && post.dislike) {
          const userLike = post.like.find(like => like.simplifiedUser.userId === user.id);
          const userDislike = post.dislike.find(dislike => dislike.simplifiedUser.userId === user.id);

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
          } else {
            setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: null,
            }));
          }
        }
        else if (post.like) {
          const userLike = post.like.find(like => like.simplifiedUser.userId === user.id);

          if (userLike) {
            setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: 'like',
            }));
          }
          else {
            setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: null,
            }));
          }
        }
        else if (post.dislike) {
          const userDislike = post.dislike.find(dislike => dislike.simplifiedUser.userId === user.id);

          if (userDislike) {
            setOpinionButtons(prevState => ({
              ...prevState,
              [post.id]: 'dislike',
            }));
          }
          else {
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
  }, [user, showForm, updatedPosts]);

  useEffect(() => {
    checksFeedback();
  }, [posts])

  if (!user) {
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
      newShowFormComment[index] = { id, show: !newShowFormComment[index].show };
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

  const deletePost = async (postId: string) => {
    try {
      await axios.delete(`/Posts/${postId}`, {
        params: {
          postId
        }
      });
      setUpdatedPosts(!updatedPosts);
    } catch (error) {
      console.error('Error delete post:', error);
    }
  }

  const handleShowImage = (id: string, image?: any) => {

    setActiveImageButton(prevState => ({
      ...prevState,
      [id]: !prevState[id]
    }));

    const index = showImage.findIndex(item => item.id === id);
    if (index >= 0) {
      const newShowImage = [...showImage];
      newShowImage[index] = { id, show: !newShowImage[index].show };
      setShowImage(newShowImage);
    } else {
      setShowImage([...showImage, { id, show: true }]);
    }
  }

  return (
    <div className={classes.divMain}>

      <div className='navbar'>{<Navbar />}</div>

      <div className={classes.divCenter}>

        <div className={classes.sideDiv}>
          <div className={classes.sideDivContainer}>
            <div className={classes.sideHeader}>
              <FaPeopleGroup className={classes.sideIcon}/>
              <label htmlFor="communities">Comunidades</label>
            </div>
            <div className={classes.sideContent}>
              {user.userCommunities ? (
                user.userCommunities.map((community: SimplifiedCommunity) => (
                  <div key={community.id} className={classes.divData}>
                    <img src={community.iconeImageSrc} alt={community.name} />
                    <p>{community.name}</p>
                  </div>
                ))
              ): (
                <p className={classes.noRegistry}>Sem comunidades</p>
              )}
            </div>
          </div>
          <div className={classes.sideDivContainer}>
            <div className={classes.sideHeader}>
              <TiGroup className={classes.sideIcon}/>
              <label htmlFor="communitiesCreated">Comunidades criadas</label>
            </div>
            <div className={classes.sideContent}>
              {user.userCreatedCommunities ? (
                user.userCreatedCommunities.map((community: SimplifiedCommunity) => (
                  <div key={community.id} className={classes.divData}>
                    <img src={community.iconeImageSrc} alt={community.name} />
                    <p>{community.name}</p>
                  </div>
                ))
              ): (
                <p className={classes.noRegistry}>Sem comunidades</p>
              )}
            </div>
            <div className={classes.sideFooter}>
              <GoPlusCircle className={classes.sideIcon}/>
            </div>
          </div>
          <div className={classes.sideDivContainer}>
            <div className={classes.sideHeader}>
              <FaRunning className={classes.sideIcon}/>
              <label htmlFor="following">Pessoas que você segue</label>
            </div>
            <div className={classes.sideContent}>
              {user.following ? (
                user.following.map((following: SimplifiedUser) => (
                  <Link to={`/anotherProfile/${following.userId}`}><div key={following.userId} className={classes.divData}>
                    <img src={following.userImageSrc} alt={following.nickName} />
                    <p>{following.nickName}</p>
                  </div></Link>
                ))
              ): (
                <p className={classes.noRegistry}>Sem comunidades</p>
              )}
            </div>
          </div>
        </div>

        <button className={classes.buttonMakePost} onClick={handleShowForm}>
          {showForm ? (
            <div className={classes.divMakePost}>
              <TbPencilX className={classes.makePostIcon} />
              <p>Cancelar</p>
            </div>
          ) : (
            <div className={classes.divMakePost}>
              <TbPencilPlus className={classes.makePostIcon} />
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
                  {post.authorImage ? (
                    <img src={post.authorImage} alt={post.author} />
                  ) : (
                    <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
                  )}
                  {post.idAuthor === user.id ? (
                    <div className={classes.postUser}>
                      <div className={classes.postHeader}>
                        <Link to={"/profile"}><p className={classes.author}>{post.author} <span className={classes.youSpan}>(você)</span></p></Link>
                        <span>-</span>
                        <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                      </div>
                      <button className={classes.trashButton} onClick={() => deletePost(post.id)}><IoTrashBin className={classes.trashIcon} /></button>
                    </div>
                  ) : (
                    <div className={classes.postHeader}>
                      <Link to={`/anotherProfile/${post.idAuthor}`}><p className={classes.author}>{post.author}</p></Link>
                      <span>-</span>
                      <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                    </div>
                  )}
                </div>
                <div className={classes.postContent}>
                  <h3 className={classes.title}>{post.title}</h3>
                  <div className={classes.content} dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}></div>
                  {post.imageSrc &&
                    <div className={classes.divBtnImage}>
                      {activeImageButton[post.id] ? (
                        <button className={classes.btnShowImage} onClick={() => handleShowImage(post.id)}>Ocultar imagem</button>
                      ) : (
                        <div>
                          <label htmlFor='btnImage'>Este post contém uma imagem</label>
                          <button name='btnImage' className={classes.btnShowImage} onClick={() => handleShowImage(post.id, post.imageSrc)}>Mostrar imagem</button>
                        </div>
                      )}</div>
                  }
                  {showImage.some(item => item.id === post.id) && showImage.find(item => item.id === post.id)!.show && post.imageSrc && (
                    <img className={classes.postImage} src={post.imageSrc} alt={post.title} />
                  )}
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
                  {showFormComment.some(item => item.id === post.id) && showFormComment.find(item => item.id === post.id)!.show && <CommentsForm postId={post.id} userId={user.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Logado;