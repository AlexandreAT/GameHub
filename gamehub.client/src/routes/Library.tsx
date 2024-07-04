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
import { GoXCircle } from "react-icons/go";

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
    followers: string[];
    backgroundImage: string;
    gamesLibrary: LibraryGame[];
}

interface Game {
    id: string;
    name: string;
    genres: string[];
    imageUrl?: string;
    totalRating?: number;
    releaseDate?: string;
    siteUrl: string;
}

interface SimplifiedUser {
    userId: string;
    nickName: string;
    userImageSrc: string;
    backgroundImage: string;
}

interface LibraryGame {
    id: string;
    state?: string;
    pin?: boolean;
    rating?: number;
}

const Library = () => {

    const { id } = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [simplifiedUsers, setSimplifiedUsers] = useState<SimplifiedUser[] | undefined>(undefined);
    const [games, setGames] = useState<Game[]>([]);
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
        const getLibrary = async () => {
            try {
                const gameIds = user?.gamesLibrary.map(libraryGame => libraryGame.id);
                const response = await axios.post('/Igdb/getLibrary', gameIds);
                const data = response.data;
                setGames(data.map((game: Game) => ({
                    ...game,
                    id: game.id.toString()
                })));
            } catch (error) {
                console.error(error);
            }
        }

        getLibrary();
    }, [user])

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    const postLibrary = async (url: string, data: any) => {
        try {
            await axios.post(url, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (error) {
            console.clear();
            console.error(error);
        }
    }

    const addGameLibrary = async (gameId: string) => {
        try {
            await postLibrary("/Users/handleGameLibrary", {
                gameId: gameId,
                userId: user.id
            });
        } catch (error) {
            console.error(error);
        }
        const existingLibraryGame = user.gamesLibrary.find(libraryGame => libraryGame.id === gameId);
        if (existingLibraryGame) {
            updateLibrary(gameId, false);
        } else {
            const newLibraryGame = { id: gameId, state: '', pin: false, rating: 0 };
            user.gamesLibrary.push(newLibraryGame);
            setUser({ ...user, gamesLibrary: user.gamesLibrary });
        }
    }

    const updateLibrary = (gameId: string, add: boolean) => {
        if (add) {
            const newLibraryGame = { id: gameId, state: '', pin: false, rating: 0 };
            user.gamesLibrary.push(newLibraryGame);
            setUser({ ...user, gamesLibrary: user.gamesLibrary });
        } else {
            user.gamesLibrary = user.gamesLibrary.filter(libraryGame => libraryGame.id !== gameId);
            setUser({ ...user, gamesLibrary: user.gamesLibrary });
        }
    };

    return (
        <div className={classes.divMain}>
            <div className='navbar'>{<Navbar user={user} />}</div>

            <div className={classes.divCenter}>
                {<Sidebar user={user} />}

                <Link to={`/gamesPage`} className={classes.linkAdd}>
                    <GoPlusCircle className={classes.linkIcon} />
                    <p>Adicionar jogo</p>
                </Link>

                <div className={classes.content}>
                    {user.gamesLibrary != undefined && user.gamesLibrary.length > 0 ? (
                        games !== null && games.length > 0 ? (
                            <div className={classes.gamesDiv}>
                                {games.map((game) => (
                                    <div key={game.id} className={classes.gameData}>
                                        <img src={game.imageUrl} alt={game.name} className={classes.gameImg} />
                                        <div className={classes.divSimplifiedData}>
                                            <Link to={game.siteUrl}><h2>{game.name}</h2></Link>
                                            <p>Gêneros: {game.genres.map((genre) => <span>{genre}, </span>)}</p>
                                            <p>Data de lançamento: <span>{game.releaseDate}</span></p>
                                            <div className={classes.btnDiv}>
                                                <button className={classes.btnAdd} onClick={() => addGameLibrary(game.id)}>
                                                    <GoXCircle className={`${classes.sideIcon} ${classes.iconRemove}`} />
                                                    <span className={classes.spanRemove}>Retirar da biblioteca</span>
                                                </button>
                                                <button className={classes.btnState}>Alterar status</button>
                                            </div>
                                        </div>
                                        <div className={classes.gameState}>
                                            <p>Sem status</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <LoadingAnimation opt='generic' />
                        )
                    ) : (
                        <p>Você não tem nenhum jogo adicionado!</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Library