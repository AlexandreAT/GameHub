import { axios } from '../axios-config';
import { FormEvent, useEffect, useState } from 'react';
import classes from './CommentsForm.module.css';

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
        }, 1000);
        return () => {
            clearInterval(interval);
        }
    })

  return (
    <div className={classes.divComments}>
        <form className={classes.formComment}>
            <textarea name="comment" placeholder='Digite seu comentário' onChange={(e) => setNewComment(e.target.value)} value={newComment}>
            </textarea>
        </form>
        {!comments ? (
            <div className={classes.containerComments}>
                <h1 className="loading">Carregando posts...</h1>
            </div>
        ) : (
            <div>
                {comments && comments.map((comment: Comments) => (
                    <div key={comment.id} className={classes.containerComments}>
                        <div className={classes.commentHeader}>
                            <p className={classes.name}>{comment.user.name}</p>
                        </div>
                        <div className={classes.commentContent}>
                            <p className={classes.content}>{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  )
}

export default CommentsForm