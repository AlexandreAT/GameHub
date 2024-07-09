import { useState, useEffect, FormEvent } from 'react';
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
import { TiPinOutline } from "react-icons/ti";
import { TiPin } from "react-icons/ti";
import { PiNeedleBold } from 'react-icons/pi';

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
    summary?: string;
    bigGameData?: boolean;
    pin?: boolean;
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
    rating: number;
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

    const getLibrary = async () => {
        try {
            const libraryIds = user?.gamesLibrary.map((libraryGame) => libraryGame.id);
            const response = await axios.post('/Igdb/getLibrary', libraryIds, {
                params: {
                    page: page,
                    userId: user?.id
                },
            });
            const data = response.data;
            const games = data.games;
            if (user && user.gamesLibrary) {
                const updatedGames = updatePinnedGames(games, user?.gamesLibrary);
                setGames(updatedGames);
                const sortedGames = sortGamesByPin(updatedGames);
                setGames(sortedGames);
            }
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        getLibrary();
    }, [user, page])

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    const updatePinnedGames = (games: Game[], userGamesLibrary: LibraryGame[]) => {
        games.forEach((game) => {
            const gameFound = userGamesLibrary.find((libraryGame) => libraryGame.id === game.id.toString());
            if (gameFound) {
                game.pin = gameFound.pin;
            }
        });
        return games;
    };

    const sortGamesByPin = (games: Game[]) => {
        return games.sort((a, b) => {
            if (a.pin && !b.pin) return -1;
            if (!a.pin && b.pin) return 1;
            return 0;
        });
    };

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

    const handlePin = async (pin: boolean, gameId: string) => {
        try {
            await postLibrary("/Users/handlePin", {
                pin: pin,
                gameId: gameId,
                userId: user.id
            });
            const updatedGamesLibrary = [...user.gamesLibrary];
            const gameIndex = updatedGamesLibrary.findIndex(game => game.id === gameId);
            if (gameIndex !== -1) {
                updatedGamesLibrary[gameIndex].pin = pin;
            }

            setUser({ ...user, gamesLibrary: updatedGamesLibrary });
        } catch (error) {
            console.error(error);
        }
    }

    const handleRating = async (rating: number, gameId: string, e: FormEvent) => {
        e.preventDefault();
        try{
            await postLibrary("/Users/handleRating", {
                rating: rating,
                gameId: gameId,
                userId: user.id
            });
            const updatedGamesLibrary = [...user.gamesLibrary];
            const gameIndex = updatedGamesLibrary.findIndex(game => game.id === gameId);
            if (gameIndex !== -1) {
                updatedGamesLibrary[gameIndex].rating = rating;
            }

            setUser({ ...user, gamesLibrary: updatedGamesLibrary });
        } catch (error) {
            console.log(error);
        }
    }

    const showGameSummary = (gameId: string) => {
        if (games) {
            setGames(
                games.map((game) => {
                    if (game.id === gameId) {
                        game.bigGameData = !game.bigGameData;
                    }
                    return game;
                })
            );
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
                            <>
                                <div className={classes.pagination}>
                                    <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon} /> Página anterior</button>
                                    <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon} /></button>
                                </div>
                                <p>Página {page} de {totalPages}</p>
                                <div className={classes.gamesDiv}>
                                    {games.map((game) => (
                                        <div key={game.id} className={`${classes.gameData} ${game.bigGameData && classes.bigGameData} ${user.gamesLibrary.find((currentGame) => currentGame.id === game.id.toString())?.state === "ja platinei" ? classes.platinumGame : ""}`}>
                                            <img src={game.imageUrl} alt={game.name} className={classes.gameImg} />
                                            <div className={classes.divRating}>
                                                {user.gamesLibrary.map((currentGame: LibraryGame) =>
                                                    game.id.toString() === currentGame.id && (
                                                        currentGame.rating >= 0 && (
                                                            <div className={`${classes.ratingController} ${currentGame.rating >= 5 && currentGame.rating < 8 && classes.aboveAverage} ${currentGame.rating >= 8 && currentGame.rating < 10 && classes.almostPerfect} ${currentGame.rating < 5 && currentGame.rating >= 3 && classes.bad} ${currentGame.rating < 3 && currentGame.rating > 0 && classes.horrible} ${currentGame.rating == 0 && classes.unplayable} ${currentGame.rating == 10 && classes.perfect}`}>{currentGame.rating}</div>
                                                        )
                                                    )
                                                )}
                                            </div>
                                            <div className={classes.divPin}>
                                                {user.gamesLibrary.map((currentGame: LibraryGame) =>
                                                    game.id.toString() === currentGame.id && (
                                                        currentGame.pin === true && (
                                                            <div className={classes.pinController}><TiPin className={classes.iconPin} /></div>
                                                        )
                                                    )
                                                )}
                                            </div>
                                            <div className={classes.divSimplifiedData}>
                                                <div className={classes.divPin}>
                                                    {user.gamesLibrary.map((currentGame: LibraryGame) =>
                                                        game.id.toString() === currentGame.id && (
                                                            currentGame.pin === false ? (
                                                                <button onClick={() => handlePin(true, currentGame.id)}><TiPinOutline className={classes.iconDontPin} /></button>
                                                            ) : (
                                                                <button onClick={() => handlePin(false, currentGame.id)}><TiPin className={classes.iconPin} /></button>
                                                            )
                                                        )
                                                    )}
                                                </div>
                                                <Link to={game.siteUrl}><h2>{game.name}</h2></Link>
                                                <p>Gêneros: {game.genres.map((genre) => <span>{genre}, </span>)}</p>
                                                <p>Data de lançamento: <span>{game.releaseDate}</span></p>
                                                <button className={classes.btnSummary} onClick={() => showGameSummary(game.id)}>Abrir resumo</button>
                                                {game.bigGameData && (
                                                    <div className={classes.divSummary} onMouseLeave={() => showGameSummary(game.id)}>
                                                        <div className={classes.divContent}><p className={classes.summaryContent}>{game.summary}</p></div>
                                                        <button className={classes.btnSummary} onClick={() => showGameSummary(game.id)}>Fechar resumo</button>
                                                    </div>
                                                )}
                                                <div className={classes.btnDiv}>
                                                    <div className={classes.divEditRating}>
                                                        {user.gamesLibrary.map((currentGame: LibraryGame) =>
                                                            game.id.toString() === currentGame.id && (
                                                                currentGame.rating >= 0 ? (
                                                                    <form className={classes.ratingController} onSubmit={(e) => handleRating(currentGame.rating, game.id, e)}>
                                                                        <label htmlFor="rating">Adicione uma nova nota!</label>
                                                                        <input name='rating' type="number" inputMode='numeric' step="0.1" max="10" placeholder='0.0' onChange={(e) => currentGame.rating = e.target.valueAsNumber} />
                                                                        <button type='submit'>Registrar nova nota</button>
                                                                    </form>
                                                                ) : (
                                                                    <form className={classes.ratingController} onSubmit={(e) => handleRating(currentGame.rating, game.id, e)}>
                                                                        <label htmlFor="rating">Adicione uma nota!</label>
                                                                        <input name='rating' type='number' inputMode='numeric' step="0.1" max="10" placeholder='0.0' onChange={(e) => currentGame.rating = e.target.valueAsNumber} className={classes.noRegistry} />
                                                                        <button type='submit'>Registrar nota</button>
                                                                    </form>
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                    <button className={classes.btnAdd} onClick={() => addGameLibrary(game.id)}>
                                                        <GoXCircle className={`${classes.sideIcon} ${classes.iconRemove}`} />
                                                        <span className={classes.spanRemove}>Retirar da biblioteca</span>
                                                    </button>
                                                    <div className={classes.divStatus}>
                                                        <button className={classes.labelStatus} onClick={() => setShowStatus(!showStatus)}>Alterar status</button>
                                                        {showStatus && (
                                                            user.gamesLibrary.map((currentGame) =>
                                                                currentGame.id === game.id.toString() && (
                                                                    <div className={classes.selectStatus}>
                                                                        <button className={`${classes.statusOptions} ${!currentGame.state && classes.select}`}>Selecine o status</button>
                                                                        <button onClick={() => updateStatus("vou jogar", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "vou jogar" && classes.select}`}>Vou jogar</button>
                                                                        <button onClick={() => updateStatus("jogando", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "jogando" && classes.select}`}>Jogando</button>
                                                                        <button onClick={() => updateStatus("ja joguei", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "ja joguei" && classes.select}`}>Já joguei</button>
                                                                        <button onClick={() => updateStatus("vou platinar", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "vou platinar" && classes.select}`}>Vou platinar</button>
                                                                        <button onClick={() => updateStatus("platinando", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "platinando" && classes.select}`}>Platinando</button>
                                                                        <button onClick={() => updateStatus("ja platinei", currentGame.id)} className={`${classes.statusOptions} ${currentGame.state === "ja platinei" && classes.select}`}>Já platinei</button>
                                                                    </div>
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
                                                                            currentGame.state === "vou platinar" ? classes.statusVouPlatinar :
                                                                                currentGame.state === "platinando" ? classes.statusPlatinando :
                                                                                    currentGame.state === "ja platinei" ? classes.statusJaPlatinei :
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