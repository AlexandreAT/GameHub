import Navbar from '../components/Navbar'
import React, { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import Cookies from 'js-cookie';
import { Navigate, useNavigate } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import * as qs from 'qs';

import classes from "./Profile.module.css";
import UserPostsComponent from '../components/UserPostsComponent';
import UpdateUserComponnent from '../components/UpdateUserComponnent';

interface SimplifiedCommunity{
  id: string;
  name: string;
  creatorId: string;
}

interface SimplifiedUser{
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
    Followers: SimplifiedUser[];
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
    
    if(!user){
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
        setUser({...user, imageSrc: response.data.imageSrc });
      } catch (error) {
        console.error(error);
      }
    };
  
    const showForm = () => {
      setShowEditForm(!showEditForm);
    }

    const handleBiography = () => {
      setShowBiographyForm(!showBiographyForm);
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
                  ): (
                    user.imageSrc ? (
                      <img src={user.imageSrc} alt={user.nickname} />
                    ): (
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
                      <p>Nome: <span className={classes.spanData}>{user.name}</span></p>
                      <p>Sobrenome: <span className={classes.spanData}>{user.surname}</span></p>
                    </div>
                    <div>
                      <p>CPF: <span className={classes.spanData}>{user.cpf}</span></p>
                      <p>Telefone: {user.phone ? (
                        <span className={classes.spanData}>{user.phone}</span>
                      ): (
                        <span className={classes.noRegistry}>Sem telefone</span>
                      )}</p>
                    </div>
                    <div>
                      <p>Cidade: {!user.city ? (
                        <span className={classes.noRegistry}>Sem uma cidade registrada</span>
                      ):
                        <span className={classes.spanData}>{user.city}</span>
                      }</p>
                      <p>Estado: {!user.state ? (
                        <span className={classes.noRegistry}>Sem um estado registrado</span>
                      ):
                        <span className={classes.spanData}>{user.state}</span>
                      }</p>
                    </div>
                    <div>
                      <p className={classes.emailParagraph}>Email: <span className={classes.spanData}>{user.email}</span></p>
                    </div>
                    <div>
                      <p>Senha: <input type="password" value={user.password} disabled/></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={classes.userInfoFooter}>
                  <div className={classes.footerDiv}>
                    <p>Seguindo: {!user.following ? (
                      <span className={classes.noRegistry}>Não segue ninguém</span> 
                    ):
                    user.following.map((following: SimplifiedUser) => (
                      <span key={following.userId} className={classes.spanData}>{following.nickName}</span>
                    ))
                    }</p>
                    <p>Seguidores: {!user.Followers ? (
                      <span className={classes.noRegistry}>Sem seguidores</span> 
                    ):
                    user.Followers.map((followers: SimplifiedUser) => (
                      <span key={followers.userId} className={classes.spanData}>{followers.nickName}</span>
                    ))
                    }</p>
                    <p>Comunidades em que faz parte: {!user.UserCommunities ? (
                      <span className={classes.noRegistry}>Não faz parte de comunidades</span>
                    ): 
                      user.UserCommunities.map((community: SimplifiedCommunity) => (
                      <p key={community.id}>{community.name} className={classes.spanData}</p>
                    ))
                    }</p>
                    <p>Comunidades criadas: {!user.UserCreatedCommunities ? (
                      <span className={classes.noRegistry}>Sem comunidades criadas</span>
                    ):
                      user.UserCreatedCommunities.map((community: SimplifiedCommunity) => (
                        <p key={community.id}>{community.name} className={classes.spanData}</p>
                      ))
                    }</p>
                  </div>
                  <div className={classes.divBiography}>
                    <p>Biografia: {!user.biography ? (
                      <span className={classes.noRegistry}>Sem biografia</span>
                    ):
                      <span className={classes.spanData}>{user.biography}</span>
                    }</p>
                    <button onClick={handleBiography}>Editar biografia</button>
                    {showBiographyForm && (
                      <div className={classes.formBiography}>
                        <textarea className={classes.biographyText} placeholder='Digite sua biografia...'></textarea>
                        <div className={classes.footerFormBiography}>
                            <button>Enviar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            </div>

            {<UserPostsComponent user={user}/>}
          </div>
        ): (
          <div className={classes.divEditUser}>
            <button onClick={showForm} className={classes.btnCancelar}>Cancelar</button>
            {<UpdateUserComponnent user={user} />}
          </div>
        )}
    </div>
  )
}

export default Profile