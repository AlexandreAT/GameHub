import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar'
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from "./ListFollowersOrFollowing.module.css";

interface Prop {
    opt?: string;
}

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    following: string[];
    followers: string[];
}

interface AnotherUser {
    id: string;
    nickname: string;
    imageSrc: string;
    following: string[];
    followers: string[];
}

interface SimplifiedUser {
    userId: string;
    nickName: string;
    userImageSrc: string;
}

const ListFollowersOrFollowing = () => {

    const { id } = useParams();
    const { opt } = useParams();
    const [anotherUser, setAnotherUser] = useState<AnotherUser>();
    const [user, setUser] = useState<User | null>(null);
    const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
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
        if (user) {
            getUsers();
        }
    }, [user])

    if (!user) {
        return <h1 className='loading'>Carregando...</h1>
    }

    if (user.id !== id) {
        const fetchAnotherUser = async () => {
            try {
                const response = await axios.get(`/Users/anotherUser/${id}`, {
                    params: {
                        userId: id,
                    }
                });
                setAnotherUser(response.data);
            } catch (error) {
                console.clear();
                console.error('Error fetching user:', error);
            }
        }

        fetchAnotherUser();
    }

    const getFollowersOrFollowing = async (url: string, data: any) => {
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

    const getUsers = () => {

        try {
            getFollowersOrFollowing("/Users/getFollowersOrFollowing", {
                opt: opt,
                userId: id
            });
        }
        catch (error) {
            console.error(error);
        }
    }

    const navigateAnotherUser = (userId: string) => {
        navigate(`/anotherProfile/${userId}`);
        window.location.reload();
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar />}</div>

            <div className={classes.divCenter}>
                {!anotherUser && (
                    <div className={classes.paragraph}>
                        <h1>{user.nickname}</h1>
                        <span className={classes.spanPublic}>(info publica)</span>Seguindo: {!user.following || user.following.length <= 0 ? (
                            <span className={classes.noRegistry}>Não segue ninguém</span>
                        ) :
                            <div className={classes.divShowSimplified}>
                                <span className={classes.spanData}>{user.following.length}</span>
                                {simplifiedUsers !== undefined && (
                                    <div className={classes.divSimplifiedData}>
                                        {simplifiedUsers && simplifiedUsers.map((user: SimplifiedUser) => (
                                            <Link to={`/anotherProfile/${user.userId}`} key={user.userId}><p className={classes.spanData}><img src={user.userImageSrc} /> {user.nickName}</p></Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        }</div>
                )}

                {anotherUser && (
                    <div className={classes.paragraph}>
                        <h1>{anotherUser.nickname}</h1>
                        Seguindo: {!anotherUser.following || anotherUser.following.length <= 0 ? (
                            <span className={classes.noRegistry}>Não segue ninguém</span>
                        ) :
                            <div className={classes.divShowSimplified}>
                                <span className={classes.spanData}>{anotherUser.following.length}</span>
                                <div className={classes.divSimplifiedData}>
                                    {simplifiedUsers && simplifiedUsers.map((mapUser: SimplifiedUser) => (
                                        mapUser.userId === user.id ? (
                                            <Link to={"/profile"}><p key={mapUser.userId} className={classes.spanData}><img src={mapUser.userImageSrc} /> {mapUser.nickName} <span className={classes.youSpan}>(você)</span></p></Link>
                                        ) : (
                                            <p key={mapUser.userId} className={classes.spanData} onClick={(e) => navigateAnotherUser(mapUser.userId)}><img src={mapUser.userImageSrc} /> {mapUser.nickName}</p>
                                        )
                                    ))}
                                </div>
                            </div>
                        }</div>
                )}
            </div>
        </div>
    )
}

export default ListFollowersOrFollowing