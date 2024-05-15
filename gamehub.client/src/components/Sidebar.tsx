import { FormEvent, useState, useEffect } from 'react';
import classes from './Sidebar.module.css';
import { Link } from 'react-router-dom';
import { axios } from '../axios-config';
import * as qs from 'qs';

import { FaPeopleGroup } from "react-icons/fa6";
import { TiGroup } from "react-icons/ti";
import { FaRunning } from "react-icons/fa";
import { GoPlusCircle } from "react-icons/go";

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: SimplifiedCommunity[];
    userCreatedCommunities: SimplifiedCommunity[];
    following: SimplifiedUser[];
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
    const [showFollowing, setShowFollowing] = useState(false);

    useEffect(() => {
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
                    console.clear();
                    console.error(error);
                }
            }
        }
        getFollowing();
    }, [user])

    if (!user) {
        return <h1 className='loading'>Carregando...</h1>
    }

    const showUsers = () => {
        setShowFollowing(!showFollowing);
    }

    return (
        <>
            <div className={classes.sideDiv}>
                <div className={classes.sideDivContainer}>
                    <div className={classes.sideHeader}>
                        <FaPeopleGroup className={classes.sideIcon} />
                        <label htmlFor="communities">Comunidades</label>
                    </div>
                    <div className={classes.sideContent}>
                        {user.userCommunities ? (
                            user.userCommunities.map((community: SimplifiedCommunity) => (
                                <div key={community.id} className={classes.divData}>
                                    <img src={community.iconeImageSrc} alt={community.name} />
                                    <p>{community.name}</p>
                                </div>
                            ))
                        ) : (
                            <p className={classes.noRegistry}>Sem comunidades</p>
                        )}
                    </div>
                </div>
                <div className={classes.sideDivContainer}>
                    <div className={classes.sideHeader}>
                        <TiGroup className={classes.sideIcon} />
                        <label htmlFor="communitiesCreated">Comunidades criadas</label>
                    </div>
                    <div className={classes.sideContent}>
                        {user.userCreatedCommunities ? (
                            user.userCreatedCommunities.map((community: SimplifiedCommunity) => (
                                <div key={community.id} className={classes.divData}>
                                    <img src={community.iconeImageSrc} alt={community.name} />
                                    <p>{community.name}</p>
                                </div>
                            ))
                        ) : (
                            <p className={classes.noRegistry}>Sem comunidades</p>
                        )}
                    </div>
                    <div className={classes.sideFooter}>
                        <GoPlusCircle className={classes.sideIcon} />
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
                            <Link to={"/usersPosts"} className={classes.link}>Posts dos usuários...</Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Sidebar