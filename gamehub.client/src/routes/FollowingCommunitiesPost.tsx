import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';
import classes from './FollowingCommunitiesPost.module.css';

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

const FollowingCommunitiesPost = () => {

    const [user, setUser] = useState<User | null>(null);

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

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar />}</div>
            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <div className={classes.content}>
                    TESTE
                </div>
            </div>
        </div>
    )
}

export default FollowingCommunitiesPost