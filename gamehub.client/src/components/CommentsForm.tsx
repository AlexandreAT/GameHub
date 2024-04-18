import { axios } from '../axios-config';
import { FormEvent, useEffect, useState } from 'react';
import classes from './CommentsForm.module.css';
import { SlDislike, SlLike } from "react-icons/sl";
import * as qs from 'qs';

interface CommentProps {
    postId: string;
    userId: string;
}

interface UserComment {
    id: string,
    name: string,
    imgSrc: string;
}

interface Comments {
    id: string,
    user: UserComment,
    content: string,
    like: number,
    dislike: number;
}

const CommentsForm = ({ postId, userId }: CommentProps) => {

    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comments[]>([]);

    const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});

    const getComments = async () => {
        try{
            const response = await axios.get<Comments[]>('/Posts/comments', {params: {
                id: postId
            }});
            setComments(response.data);
        } catch(error){
            console.error('Error fetching comments:', error);
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
    }, [newComment]);

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

    const handleOpinionButtonClick = (postId: string, opinion: 'like' | 'dislike') => {
        setOpinionButtons(prevState => ({
          ...prevState,
          [postId]: opinion === prevState[postId] ? null : opinion
        }));
    };

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
                        <div className={classes.commentHeader}>
                            <p className={classes.name}>{comment.user.name}</p>
                        </div>
                        <div className={classes.commentContent}>
                            <p className={classes.content}>{comment.content}</p>
                        </div>
                        <div className={classes.commentFooter}>
                            <button onClick={() => handleOpinionButtonClick(comment.id, 'like')}>
                                {opinionButtons[comment.id] === 'like' ? (
                                    <SlLike className={`${classes.commentIcon} ${classes.opinionActivatedLike} iconOpinion`} />
                                ) : (
                                    <SlLike className={`${classes.commentIcon} iconOpinion`} />
                                )}
                                </button>
                                <button onClick={() => handleOpinionButtonClick(comment.id, 'dislike')}>
                                {opinionButtons[comment.id] === 'dislike' ? (
                                    <SlDislike className={`${classes.commentIconDislike} ${classes.opinionActivatedDislike} iconOpinion`} />
                                ) : (
                                    <SlDislike className={`${classes.commentIconDislike} iconOpinion`} />
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