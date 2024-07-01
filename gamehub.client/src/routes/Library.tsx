import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import Cookies from 'js-cookie';
import * as qs from 'qs';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import classes from './Library.module.css';
import LoadingAnimation from '../components/LoadingAnimation';

import { GoPlusCircle } from "react-icons/go";

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

interface Game {
    id: string;
    name: string;
}

const Library = () => {

    const { id } = useParams();
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

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user} />}</div>

            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <Link to={`/gamesPage`} className={classes.linkAdd}>
                    <GoPlusCircle className={classes.linkIcon}/>
                    <p>Adicionar jogo</p>
                </Link>

            </div>
        </div>
    )
}

export default Library