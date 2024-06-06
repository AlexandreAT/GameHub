import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { Link, useNavigate } from 'react-router-dom';
import * as qs from 'qs';

import classes from "./AllPostsComponent.module.css"

import { FaRegComment } from "react-icons/fa";
import { SlDislike, SlLike } from "react-icons/sl";
import { FaCommentSlash } from "react-icons/fa6";
import { IoTrashBin } from "react-icons/io5";
import { IoIosExpand } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

import CommentsForm from './CommentsForm';
import LoadingAnimation from './LoadingAnimation';

interface Props {
    user: User;
}

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
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
    communityId: string;
}

interface LikeDisLike {
    simplifiedUser: SimplifiedUser
    IsSelected: boolean;
}

interface SimplifiedUser {
    userId: string;
    nickName: string;
    userImageSrc: string;
}

interface SimplifiedCommunity {
    id: string;
    name: string;
    creatorId: string;
    iconeImageSrc: string;
}

interface PaginatedResult<T> {
    posts: T[];
    totalPages: number;
    currentPage: number;
}

const AllPostsComponent = ({ user }: Props) => {

    const [posts, setPosts] = useState<Post[]>([]);
    const [showFormComment, setShowFormComment] = useState<{ id: string; show: boolean }[]>([]);
    const [activeCommentButtons, setActiveCommentButtons] = useState<Record<string, boolean>>({});
    const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});
    const [updatedPosts, setUpdatedPosts] = useState(false);
    const [showImage, setShowImage] = useState<{ id: string; show: boolean }[]>([]);
    const [activeImageButton, setActiveImageButton] = useState<Record<string, boolean>>({});
    const [community, setCommunity] = useState<SimplifiedCommunity | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const navigate = useNavigate();

    function isValidDateString(dateString: Date): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    };

    const getPosts = async () => {
        try {
          if (!user) return;
          const response = await axios.get<PaginatedResult<Post>>(`/Posts/getPagePost/${page}`, {
            params: {
                page: page,
            }
          });
          if (response.data) {
            setPosts(response.data.posts.map(post => ({
                ...post,
                date: isValidDateString(post.date) ? new Date(post.date) : new Date()
            })));
            setTotalPages(response.data.totalPages);
            
            
          } else {
            console.log('Nenhum dado retornado do servidor');
          }
        } catch (error) {
          console.clear();
          console.log('Erro ao buscar posts:', error);
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
    }, [user, updatedPosts, page]);

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

    const handleShowImage = (id: string) => {

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

    const getCommunity = async (communityId: string) => {
        setCommunity(null);
        try {
            const response = await axios.get<SimplifiedCommunity>(`/Community/getSimplifiedCommunity`, {
                params: {
                    communityId
                }
            });
            setCommunity(response.data)
        } catch(error){
            console.error('Error getting community:', error);
            return null;
        }
    }

    const navigatePost = (id: string) => {
        navigate(`/post/${id}`);
    }

    const truncateText = (html: string, maxLength: number) => {
        const text = html.replace(/<br\/?>/g, '').replace(/<[^>]+>/g, '');
        if (text.length > maxLength) {
            const truncatedText = text.substring(0, maxLength) + "";
            return truncatedText.replace(/\s+$/, '') + '[...]'; // Remover espaços em branco no final
        }
        return html; // Se o texto for curto, retorna o conteúdo original
    };

    return (
        <>
            {posts.length <= 0 ? (
                <div className={classes.containerPosts}>
                    {<LoadingAnimation opt='post' />}
                </div>
            ) : (
                <div className={classes.containerPosts}>
                    <LoadingAnimation />
                    <div className={classes.pagination}>
                        <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon}/> Página anterior</button>
                        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon}/></button>
                    </div>
                    {posts && posts.map((post: Post) => (
                        <div key={post.id} className={classes.divPost}>
                            <div className={classes.postHeader}>
                                {post.authorImage ? (
                                    <img src={post.authorImage} alt={post.author} />
                                ) : (
                                    <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
                                )}
                                {post.idAuthor === user.id ? (
                                    <div className={classes.headerControl}>
                                        <div className={classes.headerInfo}>
                                            <Link to={"/profile"}><p className={classes.author}>{post.author} <span className={classes.youSpan}>(você)</span></p></Link>
                                            <span>-</span>
                                            <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                                        </div>
                                        <div className={classes.postOption}>
                                            <button className={classes.iconButton} onClick={() => navigatePost(post.id)}><IoIosExpand className={classes.buttonIcon}/></button>
                                            <button className={classes.iconButton} onClick={() => deletePost(post.id)}><IoTrashBin className={classes.trashIcon} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={classes.headerControl}>
                                        <div className={classes.headerInfo}>
                                            <Link to={`/anotherProfile/${post.idAuthor}`}><p className={classes.author}>{post.author}</p></Link>
                                            <span>-</span>
                                            <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                                        </div>
                                        <div className={classes.postOption}>
                                            <button className={classes.iconButton} onClick={() => navigatePost(post.id)}><IoIosExpand className={classes.buttonIcon} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {post.communityId && (
                                <Link to={`/communityPage/${post.communityId}`} className={classes.communityLink}><p onMouseOver={() => getCommunity(post.communityId)}>Post de comunidade <span className={classes.community}><img src={community?.iconeImageSrc}></img> {community?.name}</span></p></Link>
                            )}
                            <div className={classes.postContent}>
                                <h3 className={classes.title}>{post.title}</h3>
                                <div
                                    className={classes.content}
                                    dangerouslySetInnerHTML={{
                                        __html: truncateText(post.content, 600).replace(/\n/g, '<br/>')
                                    }}
                                >
                                </div>
                                {post.imageSrc &&
                                    <div className={classes.divBtnImage}>
                                        {activeImageButton[post.id] ? (
                                            <button className={classes.btnShowImage} onClick={() => handleShowImage(post.id)}>Ocultar imagem</button>
                                        ) : (
                                            <div>
                                                <label htmlFor='btnImage'>Este post contém uma imagem</label>
                                                <button name='btnImage' className={classes.btnShowImage} onClick={() => handleShowImage(post.id)}>Mostrar imagem</button>
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
                    <div className={classes.pagination}>
                        <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon}/> Página anterior</button>
                        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon}/></button>
                    </div>
                </div>
            )}
        </>
    )
}

export default AllPostsComponent