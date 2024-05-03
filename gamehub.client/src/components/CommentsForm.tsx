import { axios } from '../axios-config';
import { FormEvent, useEffect, useState } from 'react';
import classes from './CommentsForm.module.css';
import { SlDislike, SlLike } from "react-icons/sl";
import { IoTrashBin } from "react-icons/io5";
import { Link } from 'react-router-dom';
import * as qs from 'qs';

interface CommentProps {
    postId: string;
    userId: string;
}

interface Comments {
    id: string,
    user: SimplifiedUser,
    content: string,
    like: LikeDisLike[],
    dislike: LikeDisLike[],
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

const CommentsForm = ({ postId, userId }: CommentProps) => {

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comments[]>([]);

    const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});
    const [updatedComments, setUpdatedComments] = useState(false);
    const [opinionChanges, setOpinionChanges] = useState(false);

    const getComments = async () => {
        try{
            const response = await axios.get<Comments[]>('/Posts/comments', {params: {
                id: postId
            }});
            setComments(response.data);
        } catch(error){
          console.clear();
          console.log('Error fetching comments:', error);
        }
    }

    const checksFeedback = () => {      
        for (const comment of comments) {
          if(comment.like && comment.dislike){
            const userLike = comment.like.find(like => like.simplifiedUser.userId === userId);
            const userDislike = comment.dislike.find(dislike => dislike.simplifiedUser.userId === userId);
            
            if (userLike) {
              setOpinionButtons(prevState => ({
                ...prevState,                    
                [comment.id]: 'like',
                }));
            } else if (userDislike) {
              setOpinionButtons(prevState => ({
                ...prevState,
                [comment.id]: 'dislike',
                }));
            } else{
              setOpinionButtons(prevState => ({
                ...prevState,
                [comment.id]: null,
                }));
            }
          }
          else if(comment.like){
            const userLike = comment.like.find(like => like.simplifiedUser.userId === userId);
        
            if (userLike) {
                setOpinionButtons(prevState => ({
                ...prevState,
                [comment.id]: 'like',
                }));
            } 
            else{
                setOpinionButtons(prevState => ({
                ...prevState,
                [comment.id]: null,
                }));
            }
        }
        else if(comment.dislike){
            const userDislike = comment.dislike.find(dislike => dislike.simplifiedUser.userId === userId);
    
            if (userDislike) {
                setOpinionButtons(prevState => ({
                ...prevState,
                [comment.id]: 'dislike',
                }));
            }
            else{
                setOpinionButtons(prevState => ({
                ...prevState,
                [comment.id]: null,
                }));
            }
            }
        }
    }

    useEffect(() => {
        getComments();
        
        const interval = setInterval(() => {
            getComments();
        }, 60000);
        return () => {
            clearInterval(interval);
        }
    }, [newComment, updatedComments, opinionChanges]);

    useEffect(() => {
        checksFeedback();
    }, [comments])

    const postData = async (url: string, data: any) => {
        try {
          const response = await axios.post(url, qs.stringify(data), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          return { data: response.data, error: null };
        } catch (error: any) {
          console.error('Error posting data:', error);
          if (error.response) {
            return { data: null, error: error.response.data };
          } else if (error.request) {
            return { data: null, error: { message: 'No response received from the server.' } };
          } else {
            return { data: null, error: { message: 'Error making the request.' } };
          }
        }
      };

    const clearCommentForm = () => {
        setNewComment('');
    }

    const submitComment = async (e: FormEvent) => {
        e.preventDefault();

        try{
            const response = await postData('/Posts/comment', {
                postId,
                userId,
                comment: newComment
              });
            if (response.error) {
                console.log('Error from the backend:', response.error);
              } else {
                console.log('Comentado com sucesso!', response.data);
                clearCommentForm();
              }
        } catch(error){
            console.error('Error submitting comment:', error);
        }
    }

    const handleOpinionButtonClick = async (commentId: string, opinion: 'like' | 'dislike') => {
        setOpinionButtons(prevState => ({
          ...prevState,
          [commentId]: opinion === prevState[commentId] ? null : opinion
        }));
    
        if (opinion === 'like') {
          handleLike(commentId, postId);
        } else {
          handleDislike(commentId, postId);
        }
      };
    
      const handleLike = async (commentId: string, postId: string) => {
      
        try {
          await axios.post("Posts/like", qs.stringify({
            postId,
            userId: userId,
            commentId: commentId,
          }), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          setOpinionChanges(!opinionChanges);
        } catch (error) {
          console.error('Error liking post:', error);
        }
      };
      
      const handleDislike = async (commentId: string, postId: string) => {
      
        try {
          await axios.post("Posts/dislike", qs.stringify({
            postId,
            userId: userId,
            commentId: commentId,
          }), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          setOpinionChanges(!opinionChanges);
        } catch (error) {
          console.error('Error disliking post:', error);
        }
      };

    const deleteComment = async (commentId: string) => {
        try{
            await axios.delete('/Posts/comment', {params: {
                postId,
                commentId
            }});
            setUpdatedComments(!updatedComments);
        } catch(error){
            console.error('Error delete comment:', error);
        }
    }

  return (
    <div className={classes.divComments}>
        <form className={classes.formComment} onSubmit={submitComment}>
            <textarea name="comment" placeholder='Digite seu comentário' onChange={(e) => setNewComment(e.target.value)} value={newComment}></textarea>
            <div className={classes.footerFormComment}>
                <button type='submit'>Enviar</button>
            </div>
        </form>
        {!comments ? (
            <div className={classes.containerComments}>
                <h1 className="loading">Carregando comentários...</h1>
            </div>
        ) : (
            <div className={classes.divCommentsList}>
                {comments && comments.map((comment: Comments) => (
                    <div key={comment.id} className={classes.containerComments}>
                        {comment.user.userId === userId ? (
                          <div className={classes.commentHeader}>
                            <div className={classes.commentUser}>
                              {comment.user.userImageSrc ? (
                                <img src={comment.user.userImageSrc} alt={comment.user.nickName} />
                              ) : (
                                <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
                              )}
                              <Link to={"/Profile"}><p className={classes.name}>{comment.user.nickName} <span className={classes.youSpan}>(você)</span></p></Link>
                            </div>
                            <button className={classes.trashButton} onClick={() => deleteComment(comment.id)}><IoTrashBin className={classes.trashIcon}/></button>
                          </div>
                        ): (
                          <div className={classes.commentHeader}>
                            <div>
                              {comment.user.userImageSrc ? (
                                <img src={comment.user.userImageSrc} alt={comment.user.nickName} />
                              ) : (
                                <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
                              )}
                              <Link to={`/AnotherProfile/${comment.user.userId}`}><p className={classes.name}>{comment.user.nickName}</p></Link>
                            </div>
                          </div>
                        )}
                        <div className={classes.commentContent}>
                            <p className={classes.content} dangerouslySetInnerHTML={{ __html: comment.content.replace(/\n/g, '<br/>') }}></p>
                        </div>
                        <div className={classes.commentFooter}>
                            <button onClick={() => handleOpinionButtonClick(comment.id, 'like')}>
                                {opinionButtons[comment.id] === 'like' ? (
                                    <div className={classes.divLike}>
                                        <SlLike className={`${classes.commentIcon} ${classes.opinionActivatedLike} iconOpinion`} />
                                        {comment.like && comment.like.length > 0 && (
                                            <p>{comment.like.length}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className={classes.divLike}>
                                        <SlLike className={`${classes.commentIcon} iconOpinion`} />
                                        {comment.like && comment.like.length > 0 && (
                                            <p>{comment.like.length}</p>
                                        )}
                                    </div>
                                )}
                            </button>
                            <button onClick={() => handleOpinionButtonClick(comment.id, 'dislike')}>
                                {opinionButtons[comment.id] === 'dislike' ? (
                                    <div className={classes.divLike}>
                                        <SlDislike className={`${classes.commentIconDislike} ${classes.opinionActivatedDislike} iconOpinion`} />
                                        {comment.dislike && comment.dislike.length > 0 && comment.user.userId === userId && (
                                            <p>{comment.dislike.length}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className={classes.divLike}>
                                        <SlDislike className={`${classes.commentIconDislike} iconOpinion`} />
                                        {comment.dislike && comment.dislike.length > 0 && comment.user.userId === userId && (
                                            <p>{comment.dislike.length}</p>
                                        )}
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export default CommentsForm