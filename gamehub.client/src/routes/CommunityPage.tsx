import { useEffect, useState, FormEvent } from 'react';
import { axios } from '../axios-config';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { TbPencilPlus, TbPencilX } from "react-icons/tb";
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from "./CommunityPage.module.css";

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MakePostForm from '../components/MakePostForm';
import CommunityPosts from '../components/CommunityPosts';

interface Community {
    id: string;
    creator: string;
    name: string;
    game: string;
    backgroundImageSrc: string;
    iconeImageSrc: string;
    description: string;
    post: string[];
    followers: string[];
}

interface SimplifiedUser {
    userId: string;
    nickName: string;
    userImageSrc: string;
}

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
}

const CommunityPage = () => {

    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [community, setCommunity] = useState<Community | null>(null);
    const [creator, setCreator] = useState<SimplifiedUser | null>(null);
    const [simplifiedFollowers, setSimplifiedFollowers] = useState<SimplifiedUser[] | undefined>(undefined);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showForm, setShowForm] = useState(false);
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

    useEffect(() => {
        const fetchCommunity = async () => {
            try {
                const response = await axios.get(`/Community/${id}`, {
                    params: {
                        Id: id,
                    }
                });
                setCommunity(response.data);
            } catch (error) {
                console.clear();
                console.error('Error fetching user:', error);
            }
        }
        setSimplifiedFollowers(undefined);
        fetchCommunity();
    }, [id])

    useEffect(() => {
        const getCreator = async () => {
            try {
                const response = await axios.get<SimplifiedUser>(`/Users/getSimplifiedUser`, {
                    params: {
                        userId: community?.creator
                    }
                });
                setCreator(response.data);
            } catch (error) {
                console.clear();
                console.error('Error: ', error);
            }
        }

        getCreator();
    }, [community])

    if (!user) {
        return <h1 className='loading'>Carregando...</h1>
    }

    if (!community) {
        return <h1 className='loading'>Carregando comunidade...</h1>
    }

    const handleImageChange = (event: any) => {
        setImage(event.target.files[0]);
        setImagePreview(URL.createObjectURL(event.target.files[0]));
    };

    const handleUploadImage = async () => {
        if (!image) return;

        const url = `https://api.imgbb.com/1/upload?key=b7374e73063a610d12c9922f0c360a20&name=${image.name}`;
        const formData = new FormData();
        formData.append('image', image);

        try {
            const responseJsonApi = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            const responseApi = await responseJsonApi.json();

            formData.delete('image');
            formData.append('image', responseApi.data.url);
            formData.append('id', user.id);

            // const response = await axios.post('/Users/upload-image', formData, {
            //     headers: {
            //         'Content-Type': 'multipart/form-data',
            //     },
            // });

            // Atualizar o estado do usuário com a nova imagem
            // setUser({ ...user, imageSrc: response.data.imageSrc });

        } catch (error) {
            console.error(error);
        }
    };

    const handleBackgroundChange = (event: any) => {
        setBackground(event.target.files[0]);
        setBackgroundImagePreview(URL.createObjectURL(event.target.files[0]));
    };

    const handleUploadBackground = async () => {
        if (!background) return;

        const url = `https://api.imgbb.com/1/upload?key=b7374e73063a610d12c9922f0c360a20&name=${background.name}`;
        const formData = new FormData();
        formData.append('image', background);

        try {
            const responseJsonApi = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            const responseApi = await responseJsonApi.json();

            formData.delete('image');
            formData.append('image', responseApi.data.url);
            formData.append('id', user.id);

            // const response = await axios.post('/Users/upload-image', formData, {
            //     headers: {
            //         'Content-Type': 'multipart/form-data',
            //     },
            // });

            // Atualizar o estado do usuário com a nova imagem
            // setUser({ ...user, imageSrc: response.data.imageSrc });

        } catch (error) {
            console.error(error);
        }
    };

    const followCommunity = async () => {

        const data = {
            userId: user.id,
            communityId: community.id,
        };

        try {
            await axios.post("/Community/followCommunity", qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            window.location.reload();
        } catch (error) {
            console.clear();
            console.log('Error following user:', error);
        }
    }

    const showFormEdit = () => {
        setShowEditForm(!showEditForm);
    }

    const getFollowers = async (url: string, data: any) => {
        try {
            const response = await axios.post(url, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            setSimplifiedFollowers(response.data);
        } catch (error) {
            console.clear();
            console.error(error);
        }
    }

    const getUsers = async () => {
        setSimplifiedFollowers(undefined);

        try {
            await getFollowers("/Community/getFollowers", {
                communityId: community.id
            });
        } catch (error) {
            console.error(error);
        }
    }

    const handleShowForm = (e: FormEvent) => {
        e.preventDefault();
        setShowForm(!showForm);
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'><Navbar /></div>

            {!showEditForm ? (
                <div className={classes.divCenter}>

                    {<Sidebar user={user} />}

                    <div className={classes.divContent}>
                        <div className={classes.communityInfo}>
                            <div className={classes.infoHeader}>
                                <div className={`${classes.background} ${!community.backgroundImageSrc && classes.defaultBakground}`}>
                                    {backgroundImagePreview ? (
                                        <img src={backgroundImagePreview} alt='Preview do background' />
                                    ) : (
                                        community.backgroundImageSrc && (
                                            <img src={community.backgroundImageSrc} alt={community.name} />
                                        )
                                    )}
                                </div>
                                <div className={classes.headerInfo}>
                                    <img src={community.iconeImageSrc} alt={community.name} />
                                    <div className={classes.divInfoController}>
                                        <div className={`${classes.infoDiv} ${classes.divName}`}><h2>{community.name}</h2></div>
                                        <div className={classes.infoDiv}>
                                            <div className={`${classes.paragraph} ${classes.infoCreator}`}>
                                                {community.creator !== user.id ? (
                                                    <Link to={`/anotherProfile/${community.creator}`} className={classes.infoLink}>Criador: {creator?.nickName} <img src={creator?.userImageSrc} className={classes.imgCreator} alt={creator?.nickName} /></Link>
                                                ) : (
                                                    <Link to={`/profile`} className={classes.infoLink}>Criador: {creator?.nickName} <img src={creator?.userImageSrc} className={classes.imgCreator} alt={creator?.nickName} /></Link>
                                                )}
                                            </div>
                                            <div className={classes.paragraph}><Link to={"/"} className={classes.infoLink}>Seguidores: </Link>{!community.followers || community.followers.length <= 0 ? (
                                                <span className={classes.noRegistry}>0</span>
                                            ) : (
                                                <div className={classes.divShowSimplified}>
                                                    <span className={classes.spanData} onMouseOver={() => getUsers()}>{community.followers.length}</span>
                                                    {simplifiedFollowers !== undefined && (
                                                        <div className={classes.divSimplifiedData}>
                                                            {simplifiedFollowers && simplifiedFollowers.map((user: SimplifiedUser) => (
                                                                <Link to={`/anotherProfile/${user.userId}`} key={user.userId}><p className={classes.spanData}>
                                                                    <img src={user.userImageSrc} />
                                                                    {user.nickName}
                                                                </p></Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}</div>
                                            <div className={`${classes.paragraph} ${classes.game}`}>
                                                <p className={classes.spanData}>Jogo: 
                                                {community.game ? (
                                                    <Link to={`/`} className={classes.infoLink}>{community.game}</Link>
                                                ): (
                                                    <span className={classes.noRegistry}>Sem jogo</span>
                                                )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={classes.divBtnController}>
                                        {community.creator !== user.id &&
                                            <button className='btnTransparent' onClick={followCommunity}>
                                                {community.followers != undefined && community.followers.includes(user.id) ? (
                                                    <span>Deixar de seguir</span>
                                                ) : (
                                                    <span>Seguir</span>
                                                )}
                                            </button>
                                        }
                                    </div>
                                </div>
                                {community.creator === user.id && (
                                    <button className={classes.btnEdit} onClick={showFormEdit}>Editar comunidade</button>
                                )}
                            </div>
                            <div className={classes.infoFooter}>
                                <div className={classes.description}>
                                    <p><span className={classes.title}>Descrição: </span>{!community.description ? (
                                        <span className={classes.noRegistry}>Sem descrição</span>
                                    ) :
                                        <span className={classes.spanData} dangerouslySetInnerHTML={{ __html: community.description.replace(/\n/g, '<br/>') }}></span>
                                    }</p>
                                </div>
                                <div className={classes.createPost}>
                                    <button className={`${classes.buttonMakePost} ${showForm === true && classes.formactivated}`} onClick={handleShowForm}>
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
                                        {showForm && <MakePostForm user={user} community={community.id} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {<CommunityPosts user={user} communityId={community.id} />}
                </div>
            ) : (
                <div className={classes.divCenter}>
                    <h1>editar</h1>
                    <button className={classes.btnEdit} onClick={showFormEdit}>Voltar</button>
                </div>
            )}
        </div>
    )
}

export default CommunityPage