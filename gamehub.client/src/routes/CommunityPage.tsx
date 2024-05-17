import { useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { useNavigate, Link, useParams } from 'react-router-dom';
import * as qs from 'qs';

import UserPostsComponent from '../components/UserPostsComponent';
import UpdateUserComponnent from '../components/UpdateUserComponnent';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

import classes from "./CommunityPage.module.css";

interface Community {
    id: string;
    creator: string;
    creatorImageSrc: string;
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
    const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
    const [showEditForm, setShowEditForm] = useState(false);
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

        fetchCommunity();
    }, [id])

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
                                    <h2>{community.name}</h2>
                                    <div>
                                        {community.creator !== user.id &&
                                            <button className='btnTransparent' onClick={followCommunity}>
                                                {community.followers != undefined && community.followers.includes(user.id) ? (
                                                    <span>deixar de seguir</span>
                                                ) : (
                                                    <span>seguir</span>
                                                )}
                                            </button>
                                        }
                                    </div>
                                </div>
                                {community.creator === user.id && (
                                    <button className={classes.btnEdit} onClick={showFormEdit}>Editar comunidade</button>
                                )}
                            </div>
                        </div>
                        {/* Posts */}
                    </div>

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