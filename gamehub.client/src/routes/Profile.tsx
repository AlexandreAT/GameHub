import Navbar from '../components/Navbar'
import { useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { useNavigate, Link } from 'react-router-dom';
import * as qs from 'qs';

import classes from "./Profile.module.css";
import UserPostsComponent from '../components/UserPostsComponent';
import UpdateUserComponnent from '../components/UpdateUserComponnent';
import Sidebar from '../components/Sidebar';
import { insertMaskInPhone } from '../utils/insertMaskInPhone';
import LoadingAnimation from '../components/LoadingAnimation';
import { IoLibrarySharp } from 'react-icons/io5';

interface SimplifiedCommunity {
  id: string;
  name: string;
  creatorId: string;
  iconeImageSrc: string;
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
  following: string[];
  followers: string[];
  userCommunities: string[];
  userCreatedCommunities: string[];
  biography: string;
  city: string;
  state: string;
  backgroundImage: string;
}

function Profile() {

  const [user, setUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBiographyForm, setShowBiographyForm] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [background, setBackground] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  const [biography, setBiography] = useState<string | undefined>(undefined);
  const [simplifiedFollowing, setSimplifiedFollowing] = useState<SimplifiedUser[] | undefined>(undefined);
  const [simplifiedFollowers, setSimplifiedFollowers] = useState<SimplifiedUser[] | undefined>(undefined);
  const [simplifiedCommunity, setSimplifiedCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);
  const [simplifiedFollowingCommunity, setSimplifiedFollowingCommunity] = useState<SimplifiedCommunity[] | undefined>(undefined);


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

  const handleBackgroundChange = (event: any) => {
    setBackground(event.target.files[0]);
    setBackgroundImagePreview(URL.createObjectURL(event.target.files[0]));
  };

  const handleUploadBackground = async () => {
    if (!background) return;

    const url = `https://api.imgbb.com/1/upload?key=b7374e73063a610d12c9922f0c360a20&name=${background.name}`;
    const formData = new FormData();
    formData.append('image', background);

    try {
      const responseJsonApi = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const responseApi = await responseJsonApi.json();

      formData.delete('image');
      formData.append('background', responseApi.data.url);
      formData.append('id', user.id);
      const response = await axios.post('/Users/upload-background', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Atualizar o estado do usuário com a nova imagem
      setUser({ ...user, backgroundImage: response.data.imageSrc });
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

  const getFollowersOrFollowing = async (url: string, data: any, opt: string) => {
    try {
      const response = await axios.post(url, qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (opt === "following") {
        setSimplifiedFollowing(response.data.slice(0, 5));
      } else if (opt === "followers") {
        setSimplifiedFollowers(response.data.slice(0, 5));
      }
    } catch (error) {
      console.clear();
      console.error(error);
    }
  }

  const getUsers = async (opt: string) => {
    if (opt === "following") {
      setSimplifiedFollowing(undefined);
    }
    else if (opt === "followers") {
      setSimplifiedFollowers(undefined);
    }
    try {
      await getFollowersOrFollowing("/Users/getFollowersOrFollowing", {
        opt: opt,
        userId: user.id
      }, opt);
    } catch (error) {
      console.error(error);
    }
  }

  const getCreatedOrFollowingCommunities = async (url: string, data: any, opt: string) => {
    try {
      const response = await axios.post(url, qs.stringify(data), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (opt === "following") {
        setSimplifiedFollowingCommunity(response.data.slice(0, 5));
      } else if (opt === "created") {
        setSimplifiedCommunity(response.data.slice(0, 5));
      }
    } catch (error) {
      console.clear();
      console.error(error);
    }
  }

  const getCommunity = async (opt: string) => {
    if (opt === "following") {
      setSimplifiedFollowingCommunity(undefined);
    }
    else if (opt === "created") {
      setSimplifiedCommunity(undefined);
    }
    if (user) {
      try {
        await getCreatedOrFollowingCommunities("/Users/getFollowingCommunityOrCreatedCommunity", {
          opt: opt,
          userId: user.id
        }, opt);
      } catch (error) {
        console.clear();
        console.error(error);
      }
    }
  }

  function formatCPF(cpf: string): string {
    return cpf.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return (
    <div className={classes.divProfileMain}>
      <div className='navbar'>{<Navbar user={user} />}</div>
      {!showEditForm ? (
        <div className={classes.divUser}>

          <Sidebar user={user} />

          <div className={classes.divUserInfo}>
            <div className={classes.background}>
              {backgroundImagePreview ? (
                <img src={backgroundImagePreview} alt='Preview do background' className={classes.imgBackground} />
              ) : (
                user.backgroundImage ? (
                  <img src={user.backgroundImage} alt={user.nickname} className={classes.imgBackground} />
                ) : (
                  <img src='..\src\image\background3.jpg' alt='Sem imagem' className={classes.imgBackground} />
                )
              )}
              <div className={classes.divEditBackground}>
                <label htmlFor='fileBackground'><span>Clique aqui</span> e escolha um background novo</label>
                <input type='file' name='fileBackground' id='fileBackground' onChange={handleBackgroundChange} />
                <button className={classes.btnBackground} onClick={handleUploadBackground}>Salvar background</button>
              </div>
            </div>
            <div className={classes.userInfoContent}>
              <div className={classes.userImg}>
                <div className={classes.imgController}>
                  {imagePreview ? (
                    <img src={imagePreview} alt='Preview da imagem' className={classes.img} />
                  ) : (
                    user.imageSrc ? (
                      <img src={user.imageSrc} alt={user.nickname} className={classes.img} />
                    ) : (
                      <img src="https://voxnews.com.br/wp-content/uploads/2017/04/unnamed.png" alt='Sem imagem' className={classes.img} />
                    )
                  )}
                  <label htmlFor='file'><span className={classes.spanImg}>Clique aqui</span> e escolha uma imagem nova</label>
                  <input type='file' name='file' id='file' onChange={handleImageChange} />
                  <button onClick={handleUploadImage}>Salvar imagem</button>

                  <div className={classes.footerDiv}>
                    <div className={classes.paragraph}><span className={classes.spanPublic}>(info publica)</span><Link to={`/listFollowersOrFollowings/${user.id}/${"following"}`} className={classes.link}>Seguindo: </Link>{!user.following || user.following.length <= 0 ? (
                      <span className={classes.noRegistry}>Não segue ninguém</span>
                    ) :
                      <div className={classes.divShowSimplified}>
                        <span className={classes.spanData} onMouseOver={() => getUsers("following")}>{user.following.length}</span>
                        {simplifiedFollowing !== undefined && (
                          <div className={classes.divSimplifiedData}>
                            {simplifiedFollowing && simplifiedFollowing.map((user: SimplifiedUser) => (
                              <Link to={`/anotherProfile/${user.userId}`} key={user.userId}><p className={classes.spanData}>
                                <img src={user.userImageSrc} />
                                {user.nickName}
                              </p></Link>
                            ))}
                            {simplifiedFollowing && user.following.length > 5 && (
                              <p className={classes.ellipsis}>...</p>
                            )}
                          </div>
                        )}
                      </div>
                    }</div>

                    <div className={classes.paragraph}><span className={classes.spanPublic}>(info privada)</span><Link to={`/listFollowersOrFollowings/${user.id}/${"followers"}`} className={classes.link}>Seguidores: </Link>{!user.followers || user.followers.length <= 0 ? (
                      <span className={classes.noRegistry}>Sem seguidores</span>
                    ) :
                      <div className={classes.divShowSimplified}>
                        <span className={classes.spanData} onMouseOver={() => getUsers("followers")}>{user.followers.length}</span>
                        {simplifiedFollowers !== undefined && (
                          <div className={classes.divSimplifiedData}>
                            {simplifiedFollowers && simplifiedFollowers.map((user: SimplifiedUser) => (
                              <Link to={`/anotherProfile/${user.userId}`} key={user.userId}><p className={classes.spanData}>
                                <img src={user.userImageSrc} />
                                {user.nickName}
                              </p></Link>
                            ))}
                            {simplifiedFollowers && user.followers.length > 5 && (
                              <p className={classes.ellipsis}>...</p>
                            )}
                          </div>
                        )}
                      </div>
                    }</div>

                    <div className={classes.paragraph}><span className={classes.spanPublic}>(info publica)</span><Link to={`/listCommunities/${user.id}/${"following"}`} className={classes.link}>Comunidades em que faz parte: </Link>{!user.userCommunities || user.userCommunities.length <= 0 ? (
                      <span className={classes.noRegistry}>Nenhuma</span>
                    ) :
                      <div className={classes.divShowSimplified}>
                        <span className={classes.spanData} onMouseOver={() => getCommunity("following")}>{user.userCommunities.length}</span>
                        {simplifiedFollowingCommunity !== undefined && (
                          <div className={classes.divSimplifiedData}>
                            {simplifiedFollowingCommunity && simplifiedFollowingCommunity.map((community: SimplifiedCommunity) => (
                              <Link to={`/communityPage/${community.id}`} key={community.id}><p className={classes.spanData}>
                                <img src={community.iconeImageSrc} />
                                {community.name}
                              </p></Link>
                            ))}
                            {simplifiedFollowingCommunity && user.userCommunities.length > 5 && (
                              <p className={classes.ellipsis}>...</p>
                            )}
                          </div>
                        )}
                      </div>
                    }</div>

                    <div className={classes.paragraph}><span className={classes.spanPublic}>(info publica)</span><Link to={`/listCommunities/${user.id}/${"created"}`} className={classes.link}>Comunidades criadas: </Link>{!user.userCreatedCommunities || user.userCreatedCommunities.length <= 0 ? (
                      <span className={classes.noRegistry}>Nenhuma</span>
                    ) :
                      <div className={classes.divShowSimplified}>
                        <span className={classes.spanData} onMouseOver={() => getCommunity("created")}>{user.userCreatedCommunities.length}</span>
                        {simplifiedCommunity !== undefined && (
                          <div className={classes.divSimplifiedData}>
                            {simplifiedCommunity && simplifiedCommunity.map((community: SimplifiedCommunity) => (
                              <Link to={`/communityPage/${community.id}`} key={community.id}><p className={classes.spanData}>
                                <img src={community.iconeImageSrc} />
                                {community.name}
                              </p></Link>
                            ))}
                            {simplifiedCommunity && user.userCreatedCommunities.length > 5 && (
                              <p className={classes.ellipsis}>...</p>
                            )}
                          </div>
                        )}
                      </div>
                    }</div>
                  </div>
                </div>
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
                    <p><span className={classes.spanPublic}>(info privada)</span>CPF: <span className={classes.spanData}>{formatCPF(user.cpf)}</span></p>
                    <p><span className={classes.spanPublic}>(info privada)</span>Telefone: {user.phone ? (
                      <span className={classes.spanData}>{insertMaskInPhone(user.phone)}</span>
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
              <div className={classes.divBiography}>
                <p><span className={classes.spanPublic}>(info publica)</span>Biografia: {!user.biography ? (
                  <span className={classes.noRegistry}>Sem biografia</span>
                ) :
                  <span className={classes.spanData} dangerouslySetInnerHTML={{ __html: user.biography.replace(/\n/g, '<br/>') }}></span>
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
          <Link to={`/library/${user.id}`} className={classes.libraryLink}>
            <IoLibrarySharp className={classes.libraryIcon} />
            Acessar sua biblioteca
          </Link>
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