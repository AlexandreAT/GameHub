import { useState, useEffect, FormEvent } from 'react';
import { axios } from '../axios-config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";
import Cookies from 'js-cookie';
import * as qs from 'qs';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import classes from './GamesPage.module.css';
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

interface Game {
    id: string;
    name: string;
    genres: string[];
    imageUrl?: string;
}

const GamesPage = () => {

    const [user, setUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Game[] | null>([]);
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

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        const query = searchQuery;

        try {
            const response = await axios.post('/Igdb/search', query);
            const data = response.data;
            setSearchResults(data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user} />}</div>

            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <form action="submit" className={classes.searchForm} onSubmit={handleSearch}>
                    <div className={classes.searchBar}>
                        <FaSearch className={classes.icon} />
                        <input type="text" className={classes.searchGames} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar jogos..." />
                    </div>
                </form>

                {searchResults !== null && searchResults.length > 0 && (
                    <>
                        <button onClick={() => setSearchResults(null)} className={classes.btnClearSearch}>Limpar pesquisa</button>
                        <ul>
                            {searchResults.map((game) => (
                                <li key={game.id}>
                                    <p>{game.name}</p>
                                    <p>{game.genres.map((genre: string) => <span>{genre} </span>)}</p>
                                    <img src={game.imageUrl} alt={game.name} className={classes.gameImg}/>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

            </div>
        </div>
    )
}

export default GamesPage