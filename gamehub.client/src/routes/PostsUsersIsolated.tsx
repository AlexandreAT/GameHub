import { useState, useEffect } from 'react';
import { axios, getAuthToken } from '../axios-config';
import { useNavigate } from 'react-router-dom';

import classes from './PostsUsersIsolated.module.css';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ListUsersPostsComponnent from '../components/ListUsersPostsComponnent';
import LoadingAnimation from '../components/LoadingAnimation';

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
}

const PostsUsersIsolated = () => {

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

                const token = getAuthToken();

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
                
                <div className={classes.content}>
                    {user && (<ListUsersPostsComponnent user={user}/>)}
                </div>
            </div>
        </div>
    )
}

export default PostsUsersIsolated
