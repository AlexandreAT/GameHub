import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';
import classes from './FollowingCommunitiesPost.module.css';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ListCommunitiesPosts from '../components/ListCommunitiesPosts';
import LoadingAnimation from '../components/LoadingAnimation';

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
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

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user}/>}</div>
            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <div className={classes.divContent}>
                    {user && (<ListCommunitiesPosts user={user}/>)}
                </div>
            </div>
        </div>
    )
}

export default FollowingCommunitiesPost