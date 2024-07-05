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
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";

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
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showStatus, setShowStatus] = useState(false);
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
                const libraryIds = user?.gamesLibrary.map(libraryGame => libraryGame.id);
                const response = await axios.post('/Igdb/getLibrary', libraryIds, {
                    params: {
                        page: page,
                    },
                });
                const data = response.data;
                setGames(data.games);
                setTotalPages(data.totalPages);
                setPage(data.currentPage);
            } catch (error) {
                console.error(error);
            }
        };

        getLibrary();
    }, [user, page])

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
        const existingLibraryGame = user.gamesLibrary.find(libraryGame => libraryGame.id === gameId.toString());
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
            user.gamesLibrary = user.gamesLibrary.filter(libraryGame => libraryGame.id !== gameId.toString());
            setUser({ ...user, gamesLibrary: user.gamesLibrary });
        }
    };

    const updateStatus = async (status: string, gameId: string) => {
        try {
            await postLibrary("/Users/handleStatus", {
                status: status,
                gameId: gameId,
                userId: user.id
            });
            const updatedGamesLibrary = [...user.gamesLibrary];
            const gameIndex = updatedGamesLibrary.findIndex(game => game.id === gameId);
            if (gameIndex !== -1) {
                updatedGamesLibrary[gameIndex].state = status;
            }

            setUser({ ...user, gamesLibrary: updatedGamesLibrary });
        } catch (error) {
            console.error(error);
        }
    }

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
                            <>
                                <div className={classes.pagination}>
                                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon} /> Página anterior</button>
                                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon} /></button>
                                </div>
                                <p>Página {page} de {totalPages}</p>
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
                                                    <div className={classes.divStatus}>
                                                        <button className={classes.labelStatus} onClick={() => setShowStatus(!showStatus)}>Alterar status</button>
                                                        {showStatus && (
                                                            user.gamesLibrary.map((currentGame) =>
                                                                currentGame.id === game.id.toString() && (
                                                                    !currentGame.state ? (
                                                                        <div className={classes.selectStatus}>
                                                                            <button className={`${classes.statusOptions} ${classes.select}`}>Selecine o status</button>
                                                                            <button onClick={() => updateStatus("vou jogar", currentGame.id)} className={`${classes.statusOptions}`}>Vou jogar</button>
                                                                            <button onClick={() => updateStatus("jogando", currentGame.id)} className={`${classes.statusOptions}`}>Jogando</button>
                                                                            <button onClick={() => updateStatus("ja joguei", currentGame.id)} className={`${classes.statusOptions}`}>Já joguei</button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={classes.selectStatus}>
                                                                            <button className={`${classes.statusOptions}`}>Selecine o status</button>
                                                                            <button onClick={() => updateStatus("vou jogar", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "vou jogar" && classes.select}`}>Vou jogar</button>
                                                                            <button onClick={() => updateStatus("jogando", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "jogando" && classes.select}`}>Jogando</button>
                                                                            <button onClick={() => updateStatus("ja joguei", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "ja joguei" && classes.select}`}>Já joguei</button>
                                                                        </div>
                                                                    )
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={classes.gameState}>
                                                {user.gamesLibrary.map((currentGame) =>
                                                    currentGame.id === game.id.toString() && (
                                                        !currentGame.state ? (
                                                            <p>Sem status</p>
                                                        ) : (
                                                            <p className={
                                                                currentGame.state === "vou jogar" ? classes.statusVouJogar :
                                                                    currentGame.state === "jogando" ? classes.statusJogando :
                                                                        currentGame.state === "ja joguei" ? classes.statusJaJoguei :
                                                                            ''
                                                            }>{currentGame.state.charAt(0).toUpperCase() + currentGame.state.slice(1)}</p>
                                                        )
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={classes.pagination}>
                                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon} /> Página anterior</button>
                                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon} /></button>
                                </div>
                                <p>Página {page} de {totalPages}</p>
                            </>
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