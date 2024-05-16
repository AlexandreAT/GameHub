import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import Cookies from 'js-cookie';
import * as qs from 'qs';

import classes from './ListCommunities.module.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';


interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
    followers: string[];
}

interface AnotherUser {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
}

interface SimplifiedCommunity {
    id: string;
    name: string;
    creatorId: string;
    iconeImageSrc: string;
}

const ListCommunities = () => {

    const { id } = useParams();
    const { opt } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [anotherUser, setAnotherUser] = useState<AnotherUser>();
    const [simplifiedCommunity, setSimplifiedCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);
    const [searchCommunitites, setSearchCommunitites] = useState('');
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
            getCommunities();
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

    const getCreatedOrFollowingCommunities = async (url: string, data: any) => {
        try {
            const response = await axios.post(url, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            setSimplifiedCommunity(response.data);
        } catch (error) {
            console.clear();
            console.error(error);
        }
    }

    const getCommunities = async () => {
        try {
            await getCreatedOrFollowingCommunities("/Users/getFollowingCommunityOrCreatedCommunity", {
                opt: opt,
                userId: id
            });
        } catch (error) {
            console.clear();
            console.error(error);
        }
    }

    const lowerSearch = searchCommunitites.toLowerCase();
    const filteredCommunities = simplifiedCommunity?.filter((simplifiedCommunity) => simplifiedCommunity.name.toLowerCase().includes(lowerSearch));

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar />}</div>
            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <div className={classes.searchBar}>
                    <FaSearch className={classes.icon} />
                    <input type='text' name="search" id="search" placeholder='Procurar usuário...' onChange={(e) => setSearchCommunitites(e.target.value)} value={searchCommunitites} />
                </div>

                {!anotherUser && (
                    <div className={classes.content}>
                        <div className={classes.contentHearder}>
                            {opt === "following" ? (
                                <>
                                    <h3>Comunidades que você segue</h3>
                                    <p>Total: {user.userCommunities && user.userCommunities.length > 0 ? user.userCommunities.length : (0)}</p>
                                </>
                            ) : (
                                <>
                                    <h3>Comunidades que você criou</h3>
                                    <p>Total: {user.userCreatedCommunities && user.userCreatedCommunities.length > 0 ? user.userCreatedCommunities.length : (0)}</p>
                                </>
                            )}
                        </div>
                        <div className={classes.mainContent}>
                            {opt === "following" ? (
                                !user.userCommunities || user.userCommunities.length <= 0 ? (
                                    <span className={classes.noRegistry}>Não segue nenhuma comunidade</span>
                                ) :
                                    (<div className={classes.communityDiv}>
                                        {filteredCommunities !== undefined && (
                                            filteredCommunities.map((community: SimplifiedCommunity) => (
                                                <Link to={`/anotherProfile/${community.creatorId}`} key={community.id} className={classes.communityData}>
                                                    <img src={community.iconeImageSrc} />
                                                    <p>{community.name}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>)
                            ) : (
                                !user.followers || user.followers.length <= 0 ? (
                                    <span className={classes.noRegistry}>Não criou nenhuma comunidade</span>
                                ) :
                                    (<div className={classes.communityDiv}>
                                        {filteredCommunities !== undefined && (
                                            filteredCommunities.map((community: SimplifiedCommunity) => (
                                                <Link to={`/anotherProfile/${community.creatorId}`} key={community.id} className={classes.communityData}>
                                                    <img src={community.iconeImageSrc} />
                                                    <p>{community.name}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>)
                            )}
                        </div>
                    </div>
                )}

                {anotherUser && (
                    <div className={classes.content}>
                        <div className={classes.contentHearder}>
                            {opt === "following" ? (
                                <>
                                    <h3>Comunidades que {anotherUser.nickname} segue</h3>
                                    <p>Total: {anotherUser.userCommunities && anotherUser.userCommunities.length > 0 ? anotherUser.userCommunities.length : (0)}</p>
                                </>
                            ) : (
                                <>
                                    <h3>Comunidades que {anotherUser.nickname} criou</h3>
                                    <p>Total: {anotherUser.userCreatedCommunities && anotherUser.userCreatedCommunities.length > 0 ? anotherUser.userCreatedCommunities.length : (0)}</p>
                                </>
                            )}
                        </div>
                        <div className={classes.mainContent}>
                            {opt === "following" ? (
                                !anotherUser.userCommunities || anotherUser.userCommunities.length <= 0 ? (
                                    <span className={classes.noRegistry}>Não segue nenhuma comunidade</span>
                                ) : (
                                    <div className={classes.communityDiv}>
                                        {filteredCommunities !== undefined && (
                                            filteredCommunities.map((community: SimplifiedCommunity) => (
                                                <Link to={`/anotherProfile/${community.creatorId}`} key={community.id} className={classes.communityData}>
                                                    <img src={community.iconeImageSrc} />
                                                    <p>{community.name}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )
                            ) : (
                                !anotherUser.userCreatedCommunities || anotherUser.userCreatedCommunities.length <= 0 ? (
                                    <span className={classes.noRegistry}>Não criou nenhuma comunidade</span>
                                ) : (
                                    <div className={classes.communityDiv}>
                                        {filteredCommunities !== undefined && (
                                            filteredCommunities.map((community: SimplifiedCommunity) => (
                                                <Link to={`/anotherProfile/${community.creatorId}`} key={community.id} className={classes.communityData}>
                                                    <img src={community.iconeImageSrc} />
                                                    <p>{community.name}</p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ListCommunities