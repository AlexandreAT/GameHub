import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import * as qs from 'qs';

import { FaRegComment } from "react-icons/fa";
import { SlDislike, SlLike } from "react-icons/sl";
import { FaCommentSlash } from "react-icons/fa6";
import { IoTrashBin } from "react-icons/io5";

import classes from './IsolatedPost.module.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CommentsForm from '../components/CommentsForm';

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
    backgroundImage: string;
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
    backgroundImage: string;
}

interface SimplifiedCommunity {
    id: string;
    name: string;
    creatorId: string;
    iconeImageSrc: string;
}

const IsolatedPost = () => {

    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [post, setPost] = useState<Post | null>(null);
    const [anotherAuthor, setAnotherAuthor] = useState<SimplifiedUser | null>(null);
    const [showFormComment, setShowFormComment] = useState<{ id: string; show: boolean }[]>([]);
    const [activeCommentButtons, setActiveCommentButtons] = useState<Record<string, boolean>>({});
    const [opinionButtons, setOpinionButtons] = useState<Record<string, 'like' | 'dislike' | null>>({});
    const [updatedPosts, setUpdatedPosts] = useState(false);
    const [showImage, setShowImage] = useState<{ id: string; show: boolean }[]>([]);
    const [activeImageButton, setActiveImageButton] = useState<Record<string, boolean>>({});
    const [community, setCommunity] = useState<SimplifiedCommunity | null>(null);
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
    };

    const GetPost = async () => {
        try {
            const response = await axios.get<Post>(`/Posts/getPost/${id}`, {
                params: {
                    id: id
                }
            });

            response.data.date = isValidDateString(response.data.date) ? new Date(response.data.date) : new Date();
            setPost(response.data)
        } catch (error) {
            console.clear();
            console.error('Error fetching post:', error);
        }
    }

    const checksFeedback = () => {
        // Verifica se o usuário já deu like ou dislike
        if (post && user) {
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

    const getAuthor = async () => {
        if(user && post){
            if (user.id !== post.idAuthor) {
                try {
                    const response = await axios.get<SimplifiedUser>('/Users/getSimplifiedUser', {
                        params: {
                            userId: post.idAuthor
                        }
                    });
                    setAnotherAuthor(response.data);
                } catch (error) {
                    console.clear();
                    console.error('Error fetching author:', error);
                }
            }
        }
    }

    useEffect(() => {
        GetPost();
        getAuthor();
    }, [user]);

    useEffect(() => {
        checksFeedback();
    }, [post])

    if (!user) {
        return <h1 className='loading'>Carregando...</h1>
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
        window.location.reload();
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
            navigate("/");
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
        } catch (error) {
            console.error('Error getting community:', error);
            return null;
        }
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar />}</div>
            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <div className={classes.divContent}>
                    {post ? (
                        <div className={classes.containerPost}>

                            <div className={classes.divAuthor}>
                                {user.backgroundImage || anotherAuthor?.backgroundImage ? (
                                    <>
                                        {!anotherAuthor ? (
                                            <img src={user.backgroundImage} alt={user.nickname} className={classes.imgBackground} />
                                        ) : (
                                            <img src={anotherAuthor.backgroundImage} alt={anotherAuthor.nickName} className={classes.imgBackground} />
                                        )}
                                    </>
                                ) : (
                                    <img src='..\src\image\background3.jpg' alt='Sem imagem' className={classes.imgBackground} />
                                )}
                                <div className={classes.infoAuthor}>
                                    {post.authorImage ? (
                                        <img src={post.authorImage} alt={post.author} />
                                    ) : (
                                        <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
                                    )}

                                    {post.idAuthor === user.id ? (
                                        <div className={classes.authorHeader}>
                                            <Link to={"/profile"}><p className={classes.author}>{post.author} <span className={classes.youSpan}>(você)</span></p></Link>
                                            <span>-</span>
                                            <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                                        </div>
                                    ) : (
                                        <div className={classes.authorHeader}>
                                            <Link to={`/anotherProfile/${post.idAuthor}`}><p className={classes.author}>{post.author}</p></Link>
                                            <span>-</span>
                                            <p className={classes.date}>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(post.date)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={classes.divPost}>
                                {post.communityId && (
                                    <Link to={`/communityPage/${post.communityId}`} className={classes.communityLink}><p onMouseOver={() => getCommunity(post.communityId)}>Post de comunidade <span className={classes.community}><img src={community?.iconeImageSrc}></img> {community?.name}</span></p></Link>
                                )}
                                <div className={classes.postOption}>
                                    {post.idAuthor === user.id && (<button className={classes.trashButton} onClick={() => deletePost(post.id)}><IoTrashBin className={classes.trashIcon} /></button>)}
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
                        </div>
                    ) : (
                        <h1 className={classes.loading}>Carregando post...</h1>
                    )}
                </div>
            </div>
        </div>
    )
}

export default IsolatedPost