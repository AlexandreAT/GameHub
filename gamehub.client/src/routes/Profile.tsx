import Navbar from '../components/Navbar'
import { useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';
import * as qs from 'qs';

import classes from "./Profile.module.css";
import UserPostsComponent from '../components/UserPostsComponent';
import UpdateUserComponnent from '../components/UpdateUserComponnent';

interface SimplifiedCommunity {
  id: string;
  name: string;
  creatorId: string;
}

interface SimplifiedUser {
  userId: string;
  nickName: string;
  userImageSrc: string;
}

interface User {
  id: string;
  name: string;
  surname: string;
  nickname: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  imageSrc: string;
  following: SimplifiedUser[];
  followers: SimplifiedUser[];
  UserCommunities: SimplifiedCommunity[];
  UserCreatedCommunities: SimplifiedCommunity[];
  biography: string;
  city: string;
  state: string;
}

function Profile() {

  const [user, setUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBiographyForm, setShowBiographyForm] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [biography, setBiography] = useState<string | undefined>(undefined);

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
    return <h1 className='loading'>Carregando...</h1>
  }

  const handleImageChange = (event: any) => {
    setImage(event.target.files[0]);
    setImagePreview(URL.createObjectURL(event.target.files[0]));
  };

  const handleUploadImage = async () => {
    if (!image) return;

    const url = `https://api.imgbb.com/1/upload?key=b7374e73063a610d12c9922f0c360a20&name=${image.name}`;
    const formData = new FormData();
    formData.append('image', image);

    try {
      const responseJsonApi = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const responseApi = await responseJsonApi.json();

      formData.delete('image');
      formData.append('image', responseApi.data.url);
      formData.append('id', user.id);
      const response = await axios.post('/Users/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Atualizar o estado do usuário com a nova imagem
      setUser({ ...user, imageSrc: response.data.imageSrc });
    } catch (error) {
      console.error(error);
    }
  };

  const showForm = () => {
    setShowEditForm(!showEditForm);
  }

  const handleBiography = () => {
    setBiography(user.biography);
    setShowBiographyForm(!showBiographyForm);
  }

  const putData = async (url: string, data: any) => {
    try {
      const response = await axios.put(url, qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Atualizar o estado do usuário com a biografia
      setUser({ ...user, biography: data.biography });
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

  const editBiography = async () => {

    try {

      await putData(`/Users/${user.id}`, {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone,
        city: user.city,
        state: user.state,
        password: user.password,
        biography: biography,
      });

      setShowBiographyForm(!showBiographyForm);

    } catch (error) {
      console.clear;
      console.error(error);
    }

  }

  return (
    <div className={classes.divProfileMain}>
      <div className='navbar'>{<Navbar />}</div>
      {!showEditForm ? (
        <div className={classes.divUser}>
          <div className={classes.divUserInfo}>
            <div className={classes.userInfoContent}>
              <div className={classes.userImg}>
                {imagePreview ? (
                  <img src={imagePreview} alt='Preview da imagem' />
                ) : (
                  user.imageSrc ? (
                    <img src={user.imageSrc} alt={user.nickname} />
                  ) : (
                    <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' />
                  )
                )}
                <label htmlFor='file'><span>Clique aqui</span> e escolha uma imagem nova</label>
                <input type='file' name='file' id='file' onChange={handleImageChange} />
                <button onClick={handleUploadImage}>Trocar imagem</button>
              </div>
              <div className={classes.userData}>
                <header className={classes.userDataHeader}>
                  <h2>{user.nickname}</h2>
                  <button className={classes.btnProfile} onClick={showForm}>Editar perfil</button>
                </header>
                <div className={classes.userDataContent}>
                  <div>
                    <p><span className={classes.spanPublic}>(info publica)</span>Nome: <span className={classes.spanData}>{user.name}</span></p>
                    <p><span className={classes.spanPublic}>(info publica)</span>Sobrenome: <span className={classes.spanData}>{user.surname}</span></p>
                  </div>
                  <div>
                    <p><span className={classes.spanPublic}>(info privada)</span>CPF: <span className={classes.spanData}>{user.cpf}</span></p>
                    <p><span className={classes.spanPublic}>(info privada)</span>Telefone: {user.phone ? (
                      <span className={classes.spanData}>{user.phone}</span>
                    ) : (
                      <span className={classes.noRegistry}>Sem telefone</span>
                    )}</p>
                  </div>
                  <div>
                    <p><span className={classes.spanPublic}>(info publica)</span>Cidade: {!user.city ? (
                      <span className={classes.noRegistry}>Sem uma cidade registrada</span>
                    ) :
                      <span className={classes.spanData}>{user.city}</span>
                    }</p>
                    <p><span className={classes.spanPublic}>(info publica)</span>Estado: {!user.state ? (
                      <span className={classes.noRegistry}>Sem um estado registrado</span>
                    ) :
                      <span className={classes.spanData}>{user.state}</span>
                    }</p>
                  </div>
                  <div>
                    <p className={classes.emailParagraph}><span className={classes.spanPublic}>(info privada)</span>Email: <span className={classes.spanData}>{user.email}</span></p>
                  </div>
                  <div>
                    <p><span className={classes.spanPublic}>(info privada)</span>Senha: <input type="password" value={user.password} disabled /></p>
                  </div>
                </div>
              </div>
            </div>
            <div className={classes.userInfoFooter}>
              <div className={classes.footerDiv}>
                <p><span className={classes.spanPublic}>(info publica)</span>Seguindo: {!user.following ? (
                  <span className={classes.noRegistry}>Não segue ninguém</span>
                ) :
                  <div className={classes.divShowSimplified}>
                    <span className={classes.spanData}>{user.following.length}</span>
                    <div className={classes.divSimplifiedData}>
                      {user.following.map((user: SimplifiedUser) => (
                        <Link to={`/anotherProfile/${user.userId}`}><p key={user.userId} className={classes.spanData}><img src={user.userImageSrc} /> {user.nickName}</p></Link>
                      ))}
                    </div>
                  </div>
                }</p>
                <p><span className={classes.spanPublic}>(info privada)</span>Seguidores: {!user.followers ? (
                  <span className={classes.noRegistry}>Sem seguidores</span>
                ) :
                  <div className={classes.divShowSimplified}>
                    <span className={classes.spanData}>{user.followers.length}</span>
                    <div className={classes.divSimplifiedData}>
                      {user.followers.map((user: SimplifiedUser) => (
                        <Link to={`/anotherProfile/${user.userId}`}><p key={user.userId} className={classes.spanData}><img src={user.userImageSrc} /> {user.nickName}</p></Link>
                      ))}
                    </div>
                  </div>
                }</p>
                <p><span className={classes.spanPublic}>(info publica)</span>Comunidades em que faz parte: {!user.UserCommunities ? (
                  <span className={classes.noRegistry}>Não faz parte de comunidades</span>
                ) :
                  user.UserCommunities.map((community: SimplifiedCommunity) => (
                    <p key={community.id} className={classes.spanData}>{community.name}</p>
                  ))
                }</p>
                <p><span className={classes.spanPublic}>(info publica)</span>Comunidades criadas: {!user.UserCreatedCommunities ? (
                  <span className={classes.noRegistry}>Sem comunidades criadas</span>
                ) :
                  user.UserCreatedCommunities.map((community: SimplifiedCommunity) => (
                    <p key={community.id} className={classes.spanData}>{community.name}</p>
                  ))
                }</p>
              </div>
              <div className={classes.divBiography}>
                <p><span className={classes.spanPublic}>(info publica)</span>Biografia: {!user.biography ? (
                  <span className={classes.noRegistry}>Sem biografia</span>
                ) :
                  <span className={classes.spanData} dangerouslySetInnerHTML={{ __html: user.biography.replace(/\n/g,'<br/>')}}></span>
                }</p>
                <button onClick={handleBiography}>Editar biografia</button>
                {showBiographyForm && (
                  <div className={classes.formBiography}>
                    <textarea className={classes.biographyText} onChange={(e) => setBiography(e.target.value)} placeholder='Digite sua biografia...' value={biography}></textarea>
                    <div className={classes.footerFormBiography}>
                      <button onClick={editBiography}>Enviar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {<UserPostsComponent user={user} />}
        </div>
      ) : (
        <div className={classes.divEditUser}>
          <button onClick={showForm} className={classes.btnCancelar}>Cancelar</button>
          {<UpdateUserComponnent user={user} />}
        </div>
      )}
    </div>
  )
}

export default Profile