import { useState, useEffect, FormEvent } from "react";
import { axios } from '../axios-config';
import { useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';
import classes from './ListPostsGame.module.css';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LoadingAnimation from '../components/LoadingAnimation';
import ListGamePost from "../components/ListGamePost";
import { FaSearch } from "react-icons/fa";

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
}

const ListPostsGame = () => {

    const [user, setUser] = useState<User | null>(null);
    const [searchGames, setSearchGames] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleSearchGames = async (e: FormEvent) => {
        e.preventDefault();
        if(searchGames !== ''){
            setSearchQuery(searchGames); // atualizar o estado de searchQuery com a query de pesquisa
        }
        else{
            alert("Digite o nome do jogo");
        }
    }

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user} />}</div>
            <div className={classes.divCenter}>
                {<Sidebar user={user} />}
                <div className={classes.divSearchBar}>
                    <form onSubmit={(e) => handleSearchGames(e)} className={classes.searchBar}>
                        <FaSearch className={classes.icon} />
                        <input type='text' name="search" id="search" placeholder='Digite o nome do jogo...' onChange={(e) => setSearchGames(e.target.value)} value={searchGames} />
                    </form>
                </div>

                <div className={classes.divContent}>
                    {user && searchQuery && (<ListGamePost user={user} query={searchQuery} />)}
                </div>
            </div>
        </div>
    )
}

export default ListPostsGame