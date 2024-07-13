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
import { IoFilter } from 'react-icons/io5';
import { GoListUnordered } from "react-icons/go";

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

interface AnotherUser {
    id: string;
    nickname: string;
    imageSrc: string;
    following: string[];
    followers: string[];
    backgroundImage: string;
    gamesLibrary: LibraryGame[];
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
    const [anotherUser, setAnotherUser] = useState<AnotherUser | null>();
    const [games, setGames] = useState<Game[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [showStatus, setShowStatus] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [optFilter, setOptFilter] = useState("");
    const [showOrder, setShowOrder] = useState(false);
    const [optOrder, setOptOrder] = useState("");
    const [searchGames, setSearchGames] = useState('');
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const response = await axios.get<User>('/Users/current');
            setUser(response.data);
            
        } catch (error) {
            console.error('Error fetching user:', error);

            const token = Cookies.get('.AspNetCore.Application.Authorization');

            if (!token) {
                navigate('/');
                alert("Faça o login novamente");
            }
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getLibrary = async (order?: string, filter?: string, searchGames?: string) => {
            if (user && id === user.id) {
                try {
                    const libraryIds = user.gamesLibrary.map((libraryGame) => libraryGame.id.toString());

                    const response = await axios.post('/Igdb/getLibrary', libraryIds, {
                        params: {
                            page: page,
                            userId: id,
                            order: order,
                            filter: filter,
                            searchQuery: searchGames
                        },
                    });
                    const data = response.data;
                    const games = data.games;
                    if (user && user.gamesLibrary) {
                        const updatedGames = updatePinnedGames(games, user.gamesLibrary);
                        setGames(updatedGames);
                        const sortedGames = sortGamesByPin(updatedGames);
                        setGames(sortedGames);
                    }
                    setTotalPages(data.totalPages);
                } catch (error) {
                    console.error(error);
                }
            }
            else if (anotherUser && id === anotherUser.id) {
                try {
                    const libraryIds = anotherUser.gamesLibrary.map((libraryGame) => libraryGame.id.toString());

                    const response = await axios.post('/Igdb/getLibrary', libraryIds, {
                        params: {
                            page: page,
                            userId: id,
                            order: order,
                            filter: filter,
                            searchQuery: searchGames
                        },
                    });
                    const data = response.data;
                    const games = data.games;
                    if (anotherUser && anotherUser.gamesLibrary) {
                        const updatedGames = updatePinnedGames(games, anotherUser.gamesLibrary);
                        setGames(updatedGames);
                        const sortedGames = sortGamesByPin(updatedGames);
                        setGames(sortedGames);
                    }
                    setTotalPages(data.totalPages);
                } catch (error) {
                    console.error(error);
                }
            }
        
    };

    const fetchAnotherUser = async () => {
        if(user && id !== user.id){
            try {
                const response = await axios.get(`/Users/anotherUser/${id}`, {
                    params: {
                        userId: id,
                    }
                });
                setAnotherUser(response.data);

            } catch (error) {
                console.error('Error fetching user:', error);
            }
        }
    }

    useEffect(() => {
        if(user){
            if (id == user.id) {
                getLibrary(optOrder, optFilter);
            }
            if(user.id !== id){
                getLibrary(optOrder, optFilter);
            }
        }
    }, [user, page, optFilter, optOrder, id])

    useEffect(() => {
        fetchAnotherUser();
    }, [user])

    useEffect(() => {
        if(user?.id !== id){
            getLibrary(optOrder, optFilter);
        }
    }, [anotherUser])

    useEffect(() => {
            setUser(null);
            fetchUsers();
            setGames([]);
            setPage(1);
            setAnotherUser(null);
            fetchAnotherUser();
            setTotalPages(0);
            setShowStatus(false);
            setShowFilter(false);
            setOptFilter("");
            setShowOrder(false);
            setOptOrder("");
            setSearchGames('');
            getLibrary(optOrder, optFilter);
      }, [id]);

    const handleSearchGames = async (e: FormEvent, searchGames: string) => {
        e.preventDefault();
        getLibrary(optOrder, optFilter, searchGames);
    }

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
        const existingLibraryGame = user.gamesLibrary.find(libraryGame => libraryGame.id == gameId.toString());
        console.log(existingLibraryGame);
        console.log(gameId);
        console.log(user.gamesLibrary);
        
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
        if (isNaN(rating)) {
            rating = 0;
        }
        try {
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

                {!anotherUser ? (
                    <>
                        <h2 className={classes.userTitle}>Sua biblioteca</h2>
                        <div className={classes.divSearchBar}>
                            <form onSubmit={(e) => handleSearchGames(e, searchGames)} className={classes.searchBar}>
                                <FaSearch className={classes.icon} />
                                <input type='text' name="search" id="search" placeholder='Procurar jogo...' onChange={(e) => setSearchGames(e.target.value)} value={searchGames} />
                            </form>
                        </div>

                        <Link to={`/gamesPage`} className={classes.linkAdd}>
                            <GoPlusCircle className={classes.linkIcon} />
                            <p>Adicionar jogo</p>
                        </Link>

                        <div className={classes.content}>
                            {page === 1 ? (
                                <div className={classes.divBtnOpt}>
                                    <div className={classes.divOpt}>
                                        <button className={classes.iconButton} onClick={() => setShowFilter(!showFilter)}><IoFilter className={classes.buttonIcon} /></button>
                                        {showFilter && (
                                            <div className={classes.filterOpt}>
                                                <p>Filtrar por status:</p>
                                                <span onClick={() => setOptFilter("")} className={optFilter === "" ? classes.select : classes.statusOptions}>Sem filtro</span>
                                                <span onClick={() => setOptFilter("vou jogar")} className={optFilter === "vou jogar" ? classes.select : classes.statusOptions}>Vou jogar</span>
                                                <span onClick={() => setOptFilter("jogando")} className={optFilter === "jogando" ? classes.select : classes.statusOptions}>Jogando</span>
                                                <span onClick={() => setOptFilter("ja joguei")} className={optFilter === "ja joguei" ? classes.select : classes.statusOptions}>Ja joguei</span>
                                                <span onClick={() => setOptFilter("vou platinar")} className={optFilter === "vou platinar" ? classes.select : classes.statusOptions}>Vou platinar</span>
                                                <span onClick={() => setOptFilter("platinando")} className={optFilter === "platinando" ? classes.select : classes.statusOptions}>Platinando</span>
                                                <span onClick={() => setOptFilter("ja platinei")} className={optFilter === "ja platinei" ? classes.select : classes.statusOptions}>Ja platinei</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={classes.divOpt}>
                                        <button className={classes.iconButton} onClick={() => setShowOrder(!showOrder)}><GoListUnordered className={classes.buttonIcon} /></button>
                                        {showOrder && (
                                            <div className={classes.filterOpt}>
                                                <p>Ordenar:</p>
                                                <span onClick={() => setOptOrder("name")} className={optOrder === "name" || optOrder === "" ? classes.select : classes.statusOptions}>Nome</span>
                                                <span onClick={() => setOptOrder("rating")} className={optOrder === "rating" ? classes.select : classes.statusOptions}>Nota</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className={classes.info}>Opções de filtro e ordem na página 1</p>
                            )}
                            {user.gamesLibrary != undefined && user.gamesLibrary.length > 0 ? (
                                games !== null && games.length > 0 ? (
                                    <>
                                        <div className={classes.pagination}>
                                            <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon} /> Página anterior</button>
                                            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon} /></button>
                                        </div>
                                        <p className={classes.info}>Página {page} de {totalPages}</p>
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
                                                        <p className={classes.pDate}>Data de lançamento: <span>{game.releaseDate}</span></p>
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
                                <p className={classes.noRegistry}>Você não tem nenhum jogo adicionado!</p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className={classes.userTitle}>Biblioteca do usuário: {anotherUser.nickname}</h2>
                        <div className={classes.divSearchBar}>
                            <form onSubmit={(e) => handleSearchGames(e, searchGames)} className={classes.searchBar}>
                                <FaSearch className={classes.icon} />
                                <input type='text' name="search" id="search" placeholder='Procurar jogo...' onChange={(e) => setSearchGames(e.target.value)} value={searchGames} />
                            </form>
                        </div>

                        <div className={classes.content}>
                            {page === 1 ? (
                                <div className={classes.divBtnOpt}>
                                    <div className={classes.divOpt}>
                                        <button className={classes.iconButton} onClick={() => setShowFilter(!showFilter)}><IoFilter className={classes.buttonIcon} /></button>
                                        {showFilter && (
                                            <div className={classes.filterOpt}>
                                                <p>Filtrar por status:</p>
                                                <span onClick={() => setOptFilter("")} className={optFilter === "" ? classes.select : classes.statusOptions}>Sem filtro</span>
                                                <span onClick={() => setOptFilter("vou jogar")} className={optFilter === "vou jogar" ? classes.select : classes.statusOptions}>Vou jogar</span>
                                                <span onClick={() => setOptFilter("jogando")} className={optFilter === "jogando" ? classes.select : classes.statusOptions}>Jogando</span>
                                                <span onClick={() => setOptFilter("ja joguei")} className={optFilter === "ja joguei" ? classes.select : classes.statusOptions}>Ja joguei</span>
                                                <span onClick={() => setOptFilter("vou platinar")} className={optFilter === "vou platinar" ? classes.select : classes.statusOptions}>Vou platinar</span>
                                                <span onClick={() => setOptFilter("platinando")} className={optFilter === "platinando" ? classes.select : classes.statusOptions}>Platinando</span>
                                                <span onClick={() => setOptFilter("ja platinei")} className={optFilter === "ja platinei" ? classes.select : classes.statusOptions}>Ja platinei</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={classes.divOpt}>
                                        <button className={classes.iconButton} onClick={() => setShowOrder(!showOrder)}><GoListUnordered className={classes.buttonIcon} /></button>
                                        {showOrder && (
                                            <div className={classes.filterOpt}>
                                                <p>Ordenar:</p>
                                                <span onClick={() => setOptOrder("name")} className={optOrder === "name" || optOrder === "" ? classes.select : classes.statusOptions}>Nome</span>
                                                <span onClick={() => setOptOrder("rating")} className={optOrder === "rating" ? classes.select : classes.statusOptions}>Nota</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className={classes.info}>Opções de filtro e ordem na página 1</p>
                            )}
                            {anotherUser.gamesLibrary != undefined && anotherUser.gamesLibrary.length > 0 ? (
                                games !== null && games.length > 0 ? (
                                    <>
                                        <div className={classes.pagination}>
                                            <button onClick={() => setPage(page - 1)} disabled={page === 1} className={`${page !== 1 && classes.able}`}><IoIosArrowBack className={classes.icon} /> Página anterior</button>
                                            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className={`${page !== totalPages && classes.able}`}>Próxima página <IoIosArrowForward className={classes.icon} /></button>
                                        </div>
                                        <p className={classes.info}>Página {page} de {totalPages}</p>
                                        <div className={classes.gamesDiv}>
                                            {games.map((game) => (
                                                <div key={game.id} className={`${classes.gameData} ${game.bigGameData && classes.bigGameData} ${anotherUser.gamesLibrary.find((currentGame) => currentGame.id === game.id.toString())?.state === "ja platinei" ? classes.platinumGame : ""}`}>
                                                    <img src={game.imageUrl} alt={game.name} className={classes.gameImg} />
                                                    <div className={classes.divRating}>
                                                        {anotherUser.gamesLibrary.map((currentGame: LibraryGame) =>
                                                            game.id.toString() === currentGame.id && (
                                                                currentGame.rating >= 0 && (
                                                                    <div className={`${classes.ratingController} ${currentGame.rating >= 5 && currentGame.rating < 8 && classes.aboveAverage} ${currentGame.rating >= 8 && currentGame.rating < 10 && classes.almostPerfect} ${currentGame.rating < 5 && currentGame.rating >= 3 && classes.bad} ${currentGame.rating < 3 && currentGame.rating > 0 && classes.horrible} ${currentGame.rating == 0 && classes.unplayable} ${currentGame.rating == 10 && classes.perfect}`}>{currentGame.rating}</div>
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                    <div className={classes.divPin}>
                                                        {anotherUser.gamesLibrary.map((currentGame: LibraryGame) =>
                                                            game.id.toString() === currentGame.id && (
                                                                currentGame.pin === true && (
                                                                    <div className={classes.pinController}><TiPin className={classes.iconPin} /></div>
                                                                )
                                                            )
                                                        )}
                                                    </div>
                                                    <div className={classes.divSimplifiedData}>
                                                        <Link to={game.siteUrl}><h2>{game.name}</h2></Link>
                                                        <p>Gêneros: {game.genres.map((genre) => <span>{genre}, </span>)}</p>
                                                        <p className={classes.pDate}>Data de lançamento: <span>{game.releaseDate}</span></p>
                                                        <button className={classes.btnSummary} onClick={() => showGameSummary(game.id)}>Abrir resumo</button>
                                                        {game.bigGameData && (
                                                            <div className={classes.divSummary} onMouseLeave={() => showGameSummary(game.id)}>
                                                                <div className={classes.divContent}><p className={classes.summaryContent}>{game.summary}</p></div>
                                                                <button className={classes.btnSummary} onClick={() => showGameSummary(game.id)}>Fechar resumo</button>
                                                            </div>
                                                        )}
                                                        <div className={classes.btnDiv}>
                                                            <button className={`${classes.btnAdd} ${classes.btnAddAnother}`} onClick={() => addGameLibrary(game.id)}>
                                                                {user.gamesLibrary != undefined && user.gamesLibrary.find(libraryGame => libraryGame.id === game.id.toString()) ? (
                                                                    <>
                                                                        <GoXCircle className={`${classes.sideIcon} ${classes.iconRemove}`} />
                                                                        <span className={classes.spanRemove}>Retirar da sua biblioteca</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <GoPlusCircle className={classes.sideIcon} />
                                                                        <span className={classes.spanAdd}>Adicionar na sua biblioteca</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className={classes.gameState}>
                                                        {anotherUser.gamesLibrary.map((currentGame) =>
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
                                <p className={classes.noRegistry}>O usuário não tem nenhum jogo adicionado!</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Library