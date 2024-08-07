import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from "./ListFollowersOrFollowing.module.css";
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

interface AnotherUser {
    id: string;
    nickname: string;
    imageSrc: string;
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

const ListFollowersOrFollowing = () => {

    const { id } = useParams();
    const { opt } = useParams();
    const [anotherUser, setAnotherUser] = useState<AnotherUser>();
    const [user, setUser] = useState<User | null>(null);
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
        if (user) {
            getUsers();
        }
        if (user?.id !== id) {
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
    }, [user])

    if (!user) {
        return <LoadingAnimation opt='user' />
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

    const getUsers = async () => {

        try {
            await getFollowersOrFollowing("/Users/getFollowersOrFollowing", {
                opt: opt,
                userId: id
            });
        }
        catch (error) {
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
                {!anotherUser && (
                    <div className={classes.content}>
                        <div className={classes.contentHearder}>
                            {opt === "following" ? (
                                <>
                                    <h3>Usuários que você segue</h3>
                                    <p>Total: {user.following && user.following.length > 0 ? user.following.length : (0)}</p>
                                </>
                            ) : (
                                <>
                                    <h3>Usuário que te seguem</h3>
                                    <p>Total: {user.followers && user.followers.length > 0 ? user.followers.length : (0)}</p>
                                </>
                            )}
                        </div>
                        <div className={classes.mainContent}>
                            {opt === "following" ? (
                                !user.following || user.following.length <= 0 ? (
                                    <span className={classes.noRegistry}>Não segue ninguém</span>
                                ) :
                                    <div className={classes.usersDiv}>
                                        {filteredUsers !== undefined && (
                                            filteredUsers.map((user: SimplifiedUser) => (
                                                <Link to={`/anotherProfile/${user.userId}`} key={user.userId} className={classes.userData}>
                                                    {user.backgroundImage && (
                                                        <img src={user.backgroundImage} alt={user.nickName} className={classes.userBackground}/>
                                                    )}
                                                    <img src={user.userImageSrc} className={classes.userImg}/>
                                                    <p>{user.nickName}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                            ) : (
                                !user.followers || user.followers.length <= 0 ? (
                                    <span className={classes.noRegistry}>Não tem seguidores</span>
                                ) :
                                    <div className={classes.usersDiv}>
                                        {filteredUsers !== undefined && (
                                            filteredUsers.map((user: SimplifiedUser) => (
                                                <Link to={`/anotherProfile/${user.userId}`} key={user.userId} className={classes.userData}>
                                                    {user.backgroundImage && (
                                                        <img src={user.backgroundImage} alt={user.nickName} className={classes.userBackground}/>
                                                    )}
                                                    <img src={user.userImageSrc} className={classes.userImg}/>
                                                    <p>{user.nickName}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                            )}
                        </div>
                    </div>
                )}

                {anotherUser && (
                    <div className={classes.content}>
                        <div className={classes.contentHearder}>
                            <h3>Usuários que {anotherUser.nickname} segue</h3>
                            <p>Total: {anotherUser.following && anotherUser.following.length > 0 ? anotherUser.following.length : (0)}</p>
                        </div>
                        {!anotherUser.following || anotherUser.following.length <= 0 ? (
                            <span className={classes.noRegistry}>Não segue ninguém</span>
                        ) :
                            <div className={classes.usersDiv}>
                                {filteredUsers !== undefined && (
                                    filteredUsers.map((mapUser: SimplifiedUser) => (
                                        mapUser.userId === user.id ? (
                                            <Link to={"/profile"} key={mapUser.userId} className={classes.userData}>
                                                {mapUser.backgroundImage && (
                                                    <img src={mapUser.backgroundImage} alt={mapUser.nickName} className={classes.userBackground}/>
                                                )}
                                                <img src={mapUser.userImageSrc} className={classes.userImg}/>
                                                <p>{mapUser.nickName}</p>
                                                <span className={classes.youSpan}>(você)</span>
                                            </Link>
                                        ) : (
                                            <Link to={`/anotherProfile/${mapUser.userId}`} key={mapUser.userId} className={classes.userData}>
                                                {mapUser.backgroundImage && (
                                                    <img src={mapUser.backgroundImage} alt={mapUser.nickName} className={classes.userBackground}/>
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
                )}
            </div>
        </div>
    )
}

export default ListFollowersOrFollowing