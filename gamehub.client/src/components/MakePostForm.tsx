import { FormEvent, useState } from 'react';
import classes from './MakePostForm.module.css'
import { axios } from '../axios-config';
import LoadingAnimation from './LoadingAnimation';
import { FaSearch } from 'react-icons/fa';

interface Props {
  user: User | null;
  community?: string | null;
}

interface User {
  id: string;
  nickname: string;
  imageSrc: string;
}

interface SimplifiedGames{
  gameId: string;
  name: string;
  imageUrl: string;
  siteUrl: string;
}

const MakePostForm = ({ user, community }: Props) => {

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [games, setGames] = useState<SimplifiedGames[]>([]);
  const [searchGames, setSearchGames] = useState('');
  const [chosenGame, setChosenGame] = useState<SimplifiedGames | null>(null);

  if (!user) {
    return <LoadingAnimation opt='small' />
  }

  const postData = async (url: string, data: any) => {
    try {
      // Converte as propriedades do objeto Post para PascalCase
      const postPascalCase = {
        Author: data.author,
        IdAuthor: data.idAuthor,
        Title: data.title,
        Content: data.content,
        ImageSrc: data.imageSrc,
        Game: data.game,
        CommunityId: data.communityId
      };

      const response = await axios.post(url, postPascalCase, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('Error posting data:', error);
      if (error.response) {
        return { data: null, error: error.response.data };
      } else if (error.request) {
        return { data: null, error: { message: 'No response received from the server.' } };
      } else {
        return { data: null, error: { message: 'Error making the request.' } };
      }
    }
  }

  const clearPostForm = () => {
    setTitle('');
    setContent('');
    setImage(null);
    setImagePreview(null);
  }

  const submitPost = async (e: FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    const author = user.nickname;
    const idAuthor = user.id;
    const game = chosenGame;
    let imageSrc = null;

    if (image) {
      const response = await handleUploadImage();
      imageSrc = response.data.url;
    }

    if (!community) {
      try {
        const response = await postData('/Posts', {
          author,
          idAuthor,
          title,
          content,
          imageSrc,
          game
        })

        if (response.error) {
          console.log('Error from the backend:', response.error);
          if (response.error.errors.Title !== undefined) {
            if (response.error.errors.Title[0] !== undefined) {
              alert('Erro: ' + response.error.errors.Title[0]);
            }
            else {
              alert('Erro: ' + response.error.errors.Title[1]);
            }
          }
          if (response.error.errors.Content !== undefined) {
            if (response.error.errors.Content[0] !== undefined) {
              alert('Erro: ' + response.error.errors.Content[0]);
            }
            else {
              alert('Erro: ' + response.error.errors.Content[1]);
            }
          }
        } else {
          console.log('Postado com sucesso!', response.data);
          clearPostForm();
        }
      } catch (error) {
        console.error('Erro ao postar:', error);
      } finally {
        setIsPosting(false);
      }
    }

    else {
      try {
        const communityId = community;
        const response = await postData('/Posts', {
          author,
          idAuthor,
          title,
          content,
          imageSrc,
          game,
          communityId
        });

        if (response.error) {
          console.log('Error from the backend:', response.error);
          if (response.error.errors.Title !== undefined) {
            if (response.error.errors.Title[0] !== undefined) {
              alert('Erro: ' + response.error.errors.Title[0]);
            }
            else {
              alert('Erro: ' + response.error.errors.Title[1]);
            }
          }
          if (response.error.errors.Content !== undefined) {
            if (response.error.errors.Content[0] !== undefined) {
              alert('Erro: ' + response.error.errors.Content[0]);
            }
            else {
              alert('Erro: ' + response.error.errors.Content[1]);
            }
          }
        } else {
          console.log('Postado com sucesso!', response.data);
          clearPostForm();
        }
      } catch (error) {
        console.error('Erro ao postar:', error);
      } finally {
        setIsPosting(false);
      }
    }
  }

  const handleFile = (event: any) => {
    setImage(event.target.files[0]);
    setImagePreview(URL.createObjectURL(event.target.files[0]));
  }

  const handleUploadImage = async () => {
    if (!image) return;

    const url = `https://api.imgbb.com/1/upload?key=b7374e73063a610d12c9922f0c360a20&name=${image}`;
    const formData = new FormData();
    formData.append('image', image);

    try {
      const responseJsonApi = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const responseApi = await responseJsonApi.json();
      return responseApi;
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchGames = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/Igdb/getSimplifiedGame', searchGames);
      const data = response.data;
      setGames(data.map((game: SimplifiedGames) => ({
        ...game,
        gameId: game.gameId.toString()
    })));
    } catch (error) {
      console.log(error);
    }
  }

  const clearGames = async () => {
    setGames([]);
    setSearchGames('');
    setChosenGame(null);
  }

  return (
    <div className={classes.containerPost}>
      <h2>Fazer postagem</h2>
      <form className={classes.formPost} onSubmit={submitPost}>
        <div>
          <label htmlFor="title">Título: </label>
          <input type="text" name='title' placeholder='Digite um título...' onChange={(e) => setTitle(e.target.value)} value={title} />
        </div>
        <div className={classes.divTextarea}>
          <label htmlFor="content">Conetúdo: </label>
          <textarea name="content" placeholder='Digite o conteúdo do post...' onChange={(e) => setContent(e.target.value)} value={content}></textarea>
        </div>
        <div>
          <label htmlFor='file' className={classes.imageLabel}>Caso queira adicionar uma imagem, <span>clique aqui</span></label>
          <input type='file' name='file' id='file' onChange={handleFile} />
          <div className={classes.divImg}>
            {imagePreview && (
              <img src={imagePreview} alt='Preview da imagem' />
            )}
          </div>
        </div>
        <div className={classes.searchGamesDiv}>
          <label htmlFor='searchGame' className={classes.gameLabel}>Caso queira referenciar um jogo, pesquise-o abaixo</label>
          <div className={classes.searchBar}>
            <FaSearch className={classes.icon} />
            <input type='text' name="searchGame" id="searchGame" placeholder='Procurar jogo...' onChange={(e) => setSearchGames(e.target.value)} value={searchGames} />
            <button className={classes.btnSearch} onClick={handleSearchGames}>Pesquisar</button>
          </div>
          {games && games.length > 0 && (
            <div className={classes.searchResult}>
              <span>Escolha o jogo</span>
              <div className={classes.gamesDiv}>
                {games.map((game: SimplifiedGames) => (
                  <button onClick={() => setChosenGame(game)} type="button" className={`${classes.gameOptions} ${chosenGame?.gameId === game.gameId && classes.select}`}><img src={game.imageUrl} className={classes.gameCover}></img> {game.name}</button>
                ))}
              </div>
              <button className={classes.btnClear} onClick={clearGames}>Limpar</button>
            </div>
          )}
        </div>
        <div className={classes.divButton}>
          <button className={classes.button} type='submit' disabled={isPosting}>Postar</button>
        </div>
      </form>
    </div>
  )
}

export default MakePostForm