import React from 'react'
import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useNavigate } from 'react-router-dom';
import { FaRegComment } from "react-icons/fa";
import { SlDislike, SlLike } from "react-icons/sl";
import { FaCommentSlash } from "react-icons/fa6";
import * as qs from 'qs';

import classes from './UserPostsComponent.module.css'
import CommentsForm from './CommentsForm';

interface PostProps{
  user: User;
  anotherUser?: AnotherUser;
}

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
}

interface AnotherUser {
  id: string;
  nickname: string;
  imgSrc: string;
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
    game: string;
}

function UserPostsComponent({user, anotherUser}: PostProps) {

    const [posts, setPosts] = useState<Post[]>([]);
    const [showFormComment, setShowFormComment] = useState<{ id: string; show: boolean }[]>([]);
    const [activeCommentButtons, setActiveCommentButtons] = useState<Record<string, boolean>>({});
    const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});
    const [showPostsContainer, setShowPostsContainer] = useState(false);

    function isValidDateString(dateString: Date): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    };

    const getUserPosts = async (url: string, userId?: string) => {
      if(userId){
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
      else{
        try{
          const response = await axios.get<Post[]>(url, {params: {
            id: user.id
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
    }

    const checksFeedback = () => {
      // Verifica se o usuário já deu like ou dislike
      if (user) {
        for (const post of posts) {
            if(post.like && post.dislike){
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
              } else{
                setOpinionButtons(prevState => ({
                  ...prevState,
                  [post.id]: null,
                }));
              }
            }
            else if(post.like){
              const userLike = post.like.find(like => like.simplifiedUser.userId === user.id);
      
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
            const userDislike = post.dislike.find(dislike => dislike.simplifiedUser.userId === user.id);
  
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
    if(showPostsContainer === true){
      if (anotherUser) {
        const interval = setInterval(() => {
          getUserPosts(`/Posts/userPosts/${anotherUser.id}`, anotherUser.id);
        }, 1000); // 1000 ms = 1 segundo
        return () => {
          clearInterval(interval);
        }
      }
      else {
        const interval = setInterval(() => {
          getUserPosts(`/Posts/userPosts/${user.id}`, user.id);
        }, 1000); // 1000 ms = 1 segundo
        return () => {
          clearInterval(interval);
        }
      }
    }
  }, [user, anotherUser, showPostsContainer]);

    useEffect(() => {
      checksFeedback();
    }, [posts])

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

    const showPosts = async (userId?: string) => {
      if(userId){
        try{
          await getUserPosts(`/Posts/userPosts/${userId}`, userId);
          setShowPostsContainer(!showPostsContainer);
          
        } catch(error){
          console.clear();
          console.log('Error fetching posts: ' +error);
        }
      }
      else {
        try{
          await getUserPosts(`/Posts/userPosts/${user.id}`);
          setShowPostsContainer(!showPostsContainer);
        } catch(error){
          console.clear();
          console.log('Error fetching posts: ' +error);
        }
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
    <>
      {!anotherUser ? (
        <button onClick={() => showPosts()} className='btnTransparent'>Mostrar seus posts</button>
      ): (
        <button onClick={() => showPosts(anotherUser.id)} className='btnTransparent'>Mostrar os posts deste usuário</button>
      )}
      
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
        {!posts.length && (
          <h3>Usuário sem posts!</h3>
        )}
      </div>
      )}
    </>
  )
}

export default UserPostsComponent