import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';

import classes from "./SearchList.module.css";
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LoadingAnimation from '../components/LoadingAnimation';

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
    followers: string[];
    backgroundImage: string;
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
    backgroundImageSrc: string;
}

const SearchList = () => {

    const { search } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
    const [simplifiedCommunities, setSimplifiedCommunities] = useState<SimplifiedCommunity[] | undefined>(undefined);
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
        if (search && user) {
            getUsers('/Users/searchAll', search)
            getCommunities('/Community/searchAll', search)
        }
    }, [user])

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    const getUsers = async (url: string, query: string) => {
        try {
            const response = await axios.get<SimplifiedUser[]>(url, {
                params: {
                    query: query
                }
            });
            setSimplifiedUsers(response.data);
        } catch (error) {

        }
    }

    const getCommunities = async (url: string, query: string) => {
        try {
            const response = await axios.get<SimplifiedCommunity[]>(url, {
                params: {
                    query: query
                }
            });
            setSimplifiedCommunities(response.data);
        } catch (error) {

        }
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user} />}</div>

            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <div className={classes.content}>
                    <div className={classes.contentHearder}>
                        <h3>Procurando por: {search}</h3>
                    </div>
                    <div className={classes.mainContent}>
                        {!simplifiedUsers && !simplifiedCommunities ? (
                            <span className={classes.noRegistry}>Nada encontrado</span>
                        ) : (
                            <>
                                {simplifiedUsers && (
                                    <>
                                        <h2>Usuários encontrados: </h2>
                                        <div className={classes.dataDiv}>
                                            {simplifiedUsers.length > 0 ? simplifiedUsers.map((anotherUser: SimplifiedUser) => (
                                                anotherUser.userId !== user.id && (
                                                    <Link to={`/anotherProfile/${anotherUser.userId}`} key={anotherUser.userId} className={classes.data}>
                                                        {anotherUser.backgroundImage && (
                                                            <img src={anotherUser.backgroundImage} alt={anotherUser.nickName} className={classes.background} />
                                                        )}
                                                        <img src={anotherUser.userImageSrc} className={classes.img} />
                                                        <p>{anotherUser.nickName}</p>
                                                    </Link>
                                                )
                                            )) : (
                                                <p className={classes.noRegistry}>Usuário não encontrado</p>
                                            )}
                                        </div>
                                    </>
                                )}
                                {simplifiedCommunities && (
                                    <>
                                        <h2>Comunidades encontradas: </h2>
                                        <div className={classes.dataDiv}>
                                            {simplifiedCommunities.length > 0 ? simplifiedCommunities.map((community: SimplifiedCommunity) => (
                                                <Link to={`/communityPage/${community.id}`} key={community.id} className={classes.data}>
                                                    {community.backgroundImageSrc && (
                                                        <img src={community.backgroundImageSrc} alt={community.name} className={classes.background} />
                                                    )}
                                                    <img src={community.iconeImageSrc} className={classes.img} />
                                                    <p>{community.name}</p>
                                                </Link>
                                            )) : (
                                                <p className={classes.noRegistry}>Comunidade não encontrada</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchList