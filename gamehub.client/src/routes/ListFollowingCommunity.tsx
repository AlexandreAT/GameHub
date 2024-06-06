import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from './ListFollowingCommunity.module.css'
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

interface Community {
    id: string;
    name: string;
    backgroundImageSrc: string;
    iconeImageSrc: string;
    followers: string[];
}

interface SimplifiedUser {
    userId: string;
    nickName: string;
    userImageSrc: string;
    backgroundImage: string;
}

const ListFollowingCommunity = () => {

    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [community, setCommunity] = useState<Community | null>(null);
    const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
    const [searchUsers, setSearchUsers] = useState('');
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
        setSimplifiedUsers(undefined);
        fetchCommunity();
    }, [id])

    useEffect(() => {
        if (user) {
            getUsers();
        }
    }, [user])

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    if (!community) {
        return <LoadingAnimation opt='generic' />
    }

    const getFollowers = async (url: string, data: any) => {
        try {
            const response = await axios.post(url, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            setSimplifiedUsers(response.data);
        } catch (error) {
            console.clear();
            console.error(error);
        }
    }

    const getUsers = async () => {
        setSimplifiedUsers(undefined);

        try {
            await getFollowers("/Community/getFollowers", {
                communityId: community.id
            });
        } catch (error) {
            console.error(error);
        }
    }

    const lowerSearch = searchUsers.toLowerCase();
    const filteredUsers = simplifiedUsers?.filter((simplifiedUser) => simplifiedUser.nickName.toLowerCase().includes(lowerSearch));

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user}/>}</div>

            <div className={classes.divCenter}>

                {<Sidebar user={user} />}

                <div className={classes.searchBar}>
                    <FaSearch className={classes.icon} />
                    <input type='text' name="search" id="search" placeholder='Procurar usuário...' onChange={(e) => setSearchUsers(e.target.value)} value={searchUsers} />
                </div>
                <div className={classes.content}>
                    <div className={classes.contentHearder}>
                        <h3>Usuários que seguem a comunidade: {community.name}</h3>
                        <p>Total: {community.followers && community.followers.length > 0 ? community.followers.length : (0)}</p>
                    </div>
                    {!community.followers || community.followers.length <= 0 ? (
                        <span className={classes.noRegistry}>Não tem seguidores</span>
                    ) :
                        <div className={classes.usersDiv}>
                            {filteredUsers !== undefined && (
                                filteredUsers.map((mapUser: SimplifiedUser) => (
                                    mapUser.userId === user.id ? (
                                        <Link to={"/profile"} key={mapUser.userId} className={classes.userData}>
                                            {mapUser.backgroundImage && (
                                                <img src={mapUser.backgroundImage} alt={mapUser.nickName} className={classes.userBackground} />
                                            )}
                                            <img src={mapUser.userImageSrc} className={classes.userImg}/>
                                            <p>{mapUser.nickName}</p>
                                            <span className={classes.youSpan}>(você)</span>
                                        </Link>
                                    ) : (
                                        <Link to={`/anotherProfile/${mapUser.userId}`} key={mapUser.userId} className={classes.userData}>
                                            {mapUser.backgroundImage && (
                                                <img src={mapUser.backgroundImage} alt={mapUser.nickName} className={classes.userBackground} />
                                            )}
                                            <img src={mapUser.userImageSrc} className={classes.userImg}/>
                                            <p>{mapUser.nickName}</p>
                                        </Link>
                                    )
                                ))
                            )}
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default ListFollowingCommunity