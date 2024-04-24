import { Link, Navigate } from 'react-router-dom'
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom'
import { axios, setAuthToken } from '../axios-config';
import Cookies from 'js-cookie';

import React, { FormEvent, useState } from 'react'

import classes from "./Login.module.css";

const Login = () => {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const token = Cookies.get('.AspNetCore.Application.Authorization')

    if (token) {
        return <Navigate to="/logado" replace />
    }

    const submitLogin = (e: FormEvent) => {
        e.preventDefault();

        // Faz a chamada a API com os valores do formulário
        axios.post('/Users/login', { email, password })
        .then((response) => {
            
            // Verifica se o usuário foi encontrado
            if (response.data) {

                // Define o token no cabeçalho
                setAuthToken(response.data.token);

                // Redireciona o usuário para a página depois do login
                navigate("/Logado");
            }
        })
        .catch((error) => {
            
            // Exibe uma mensagem de erro no front-end
            console.error(error);
            alert("Email ou senha incorretos.");
        });
    }

  return (
    <div className="form">
        <div className={classes.background}></div>
        <div className={classes.loginContainer}>
            <div className={classes.bannerContent}>
                <h1>Game<span className='logoDetail'>Hub</span></h1>
                <h3>A GameHub permite criar e organizar sua coleção de jogos de forma personalizada. Adicione, categorize e faça anotações sobre seus títulos favoritos com facilidade.</h3>
                <div className={classes.img}>
                    <img src="../image/background.jpg" alt="" />
                </div>
            </div>
            <div className={classes.loginContent}>
                <h2>Login</h2>
                <form onSubmit={submitLogin}>
                    <div className={classes.formControl}>
                        <label htmlFor="email">Email</label>
                        <div className={classes.formInput}>
                            <MdEmail className={classes.icons}/>
                            <input type="text" name='email' placeholder='Digite o seu email...' onChange={(e) => setEmail(e.target.value)} value={email} required/>
                        </div>
                    </div>
                    <div className={classes.formControl}>
                        <label htmlFor="password">Senha</label>
                        <div className={classes.formInput}>
                            <RiLockPasswordFill className={classes.icons}/>
                            <input type="password" name='password' placeholder='Digite a sua senha...' onChange={(e) => setPassword(e.target.value)} value={password} required/>
                        </div>
                    </div>
                    <div className={classes.bottomDiv}>
                        <div className={classes.formRemember}>
                            <input type="checkbox" name='login-check' />
                            <label htmlFor="login-chek">Lembre-se de mim</label>
                        </div>
                        <div>
                            <Link to="/forgotPassword" className='link'>Esqueceu a senha?</Link>
                        </div>
                    </div>
                    <button type='submit' className='btn' >Entrar</button>
                    <Link to="/register" className={classes.register}>Registrar-se</Link>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Login