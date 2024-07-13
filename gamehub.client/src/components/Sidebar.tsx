import { useState, useEffect } from 'react';
import classes from './Sidebar.module.css';
import { Link } from 'react-router-dom';
import { axios } from '../axios-config';
import * as qs from 'qs';

import { FaPeopleGroup } from "react-icons/fa6";
import { TiGroup } from "react-icons/ti";
import { FaRunning } from "react-icons/fa";
import { GoPlusCircle } from "react-icons/go";
import { IoLibrarySharp } from "react-icons/io5";
import RegisterCommunity from './RegisterCommunity';
import LoadingAnimation from './LoadingAnimation';

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
}

interface SimplifiedCommunity {
    id: string;
    name: string;
    creatorId: string;
    iconeImageSrc: string;
}

interface SimplifiedUser {
    userId: string;
    nickName: string;
    userImageSrc: string;
}

const Sidebar = ({ user }: { user: User | null }) => {

    const [simplifiedFollowing, setSimplifiedFollowing] = useState<SimplifiedUser[] | undefined>(undefined);
    const [simplifiedCommunity, setSimplifiedCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);
    const [simplifiedFollowingCommunity, setSimplifiedFollowingCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);
    const [showFormCommunity, setShowFormCommunity] = useState(false);
    const [showCommunity, setShowCommunity] = useState(false);
    const [showFollowingCommunity, setShowFollowingCommunity] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

    const getFollowing = async () => {
        const opt = "following";
        if (user) {
            try {
                const response = await axios.post("/Users/getFollowersOrFollowing", qs.stringify({
                    opt: opt,
                    userId: user.id
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                setSimplifiedFollowing(response.data);
            } catch (error) {
                console.error(error);
            }
        }
    }

    useEffect(() => {

        getFollowing();
        getCreatedCommunity();
        getFollowingCommunity();

    }, [user]);

    if (!user) {
        return <LoadingAnimation opt='small' />
    }

    const getCreatedCommunity = async () => {
        const opt = "created";
        if (user.userCreatedCommunities.length > 0) {
            try {
                const response = await axios.post("/Users/getFollowingCommunityOrCreatedCommunity", qs.stringify({
                    opt: opt,
                    userId: user.id
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                setSimplifiedCommunity(response.data);
            } catch (error) {
                console.error(error);
            }
        }
    }

    const getFollowingCommunity = async () => {
        const opt = "following";
        if (user.userCommunities.length > 0) {
            try {
                const response = await axios.post("/Users/getFollowingCommunityOrCreatedCommunity", qs.stringify({
                    opt: opt,
                    userId: user.id
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                setSimplifiedFollowingCommunity(response.data);
            } catch (error) {
                console.error(error);
            }
        }
    }

    const showUsers = () => {
        setShowFollowing(!showFollowing);
    }

    const showCommunities = () => {
        setShowCommunity(!showCommunity);
    }

    const showFollowingCommunities = () => {
        setShowFollowingCommunity(!showFollowingCommunity);
    }

    return (
        <>
            <div className={classes.sideDiv}>
                <div className={classes.sideDivContainer}>
                    <div className={classes.sideHeader}>
                        <FaPeopleGroup className={classes.sideIcon} />
                        <Link to={`/listCommunities/${user.id}/${"following"}`}><label htmlFor='communitiesCreated'>Comunidades seguidas</label></Link>
                    </div>
                    <div className={classes.sideContent}>
                        {simplifiedFollowingCommunity && simplifiedFollowingCommunity.length > 0 ? (
                            <div className={classes.divCommunities}>
                                <p className={classes.paragraph}>Comunidades <button className={`${showFollowingCommunity === true && classes.buttonActivated}`} onClick={showFollowingCommunities}></button></p>
                                {showFollowingCommunity === true && simplifiedFollowingCommunity.map((community: SimplifiedCommunity) => (
                                    <Link key={community.id} to={`/communityPage/${community.id}`}><div className={classes.divData}>
                                        <img src={community.iconeImageSrc} alt={community.name} />
                                        <p>{community.name}</p>
                                    </div></Link>
                                ))}
                            </div>
                        ) : (
                            <p className={classes.noRegistry}>Não segue nenhuma comunidade</p>
                        )}
                    </div>
                    {simplifiedFollowingCommunity && simplifiedFollowingCommunity.length > 0 && (
                        <div className={classes.sideFooter}>
                            <Link to={"/communitiesPosts"} className={classes.link}>Posts das comunidades</Link>
                        </div>
                    )}
                </div>
                <div className={classes.sideDivContainer}>
                    <div className={classes.sideHeader}>
                        <TiGroup className={classes.sideIcon} />
                        <Link to={`/listCommunities/${user.id}/${"created"}`}><label htmlFor='communitiesCreated'>Comunidades criadas</label></Link>
                    </div>
                    <div className={classes.sideContent}>
                        {simplifiedCommunity && simplifiedCommunity.length > 0 ? (
                            <div className={classes.divCommunities}>
                                <p className={classes.paragraph}>Comunidades <button className={`${showCommunity === true && classes.buttonActivated}`} onClick={showCommunities}></button></p>
                                {showCommunity === true && simplifiedCommunity.map((community: SimplifiedCommunity) => (
                                    <Link key={community.id} to={`/communityPage/${community.id}`}><div className={classes.divData}>
                                        <img src={community.iconeImageSrc} alt={community.name} />
                                        <p>{community.name}</p>
                                    </div></Link>
                                ))}
                            </div>
                        ) : (
                            <p className={classes.noRegistry}>Não criou nenhuma comunidade</p>
                        )}
                    </div>
                    <div className={classes.sideFooter}>
                        <GoPlusCircle className={classes.sideIcon} onClick={() => setShowFormCommunity(!showFormCommunity)} />
                        {showFormCommunity && (<div className={classes.formCommunity}><RegisterCommunity user={user} /></div>)}
                    </div>
                </div>
                <div className={classes.sideDivContainer}>
                    <div className={classes.sideHeader}>
                        <FaRunning className={classes.sideIcon} />
                        <Link to={`/listFollowersOrFollowings/${user.id}/${"following"}`}><label htmlFor='following'>Pessoas que você segue</label></Link>
                    </div>
                    <div className={classes.sideContent}>
                        {simplifiedFollowing && simplifiedFollowing.length > 0 ? (
                            <div className={classes.divFollowing}>
                                <p className={classes.paragraph}>Usuários <button className={`${showFollowing === true && classes.buttonActivated}`} onClick={showUsers}></button></p>
                                {showFollowing === true && simplifiedFollowing.map((following: SimplifiedUser) => (
                                    <Link key={following.userId} to={`/anotherProfile/${following.userId}`}><div className={classes.divData}>
                                        <img src={following.userImageSrc} alt={following.nickName} />
                                        <p>{following.nickName}</p>
                                    </div></Link>
                                ))}
                            </div>
                        ) : (
                            <p className={classes.noRegistry}>Não segue ninguém</p>
                        )}
                    </div>
                    {simplifiedFollowing && simplifiedFollowing.length > 0 && (
                        <div className={classes.sideFooter}>
                            <Link to={"/usersPosts"} className={classes.link}>Posts dos usuários</Link>
                        </div>
                    )}
                </div>
                <div className={classes.sideDivContainer}>
                    <div className={classes.sideHeader}>
                        <IoLibrarySharp className={classes.sideIcon} />
                        <Link to={`/library/${user.id}`}><label htmlFor="library">Acessar biblioteca</label></Link>
                    </div>
                    <div className={classes.sideFooter}>
                        <Link to={`/searchPostsByGame`} className={classes.link}>Procurar posts por jogo</Link>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Sidebar