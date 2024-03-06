import { Link } from 'react-router-dom'
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { useNavigate } from 'react-router-dom'

import React, { FormEvent } from 'react'

import classes from "./Login.module.css";

const Login = () => {

    const navigate = useNavigate();

    const submitLogin = (e: FormEvent) => {
        e.preventDefault();

        navigate("/Logado");
    }

  return (
    <div className="form">
        <div className={classes.background}></div>
        <div className={classes.loginContainer}>
            <div className={classes.bannerContent}>
                <h2>GameHub</h2>
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
                            <input type="text" name='email' placeholder='Digite o seu email...' required/>
                        </div>
                    </div>
                    <div className={classes.formControl}>
                        <label htmlFor="password">Senha</label>
                        <div className={classes.formInput}>
                            <RiLockPasswordFill className={classes.icons}/>
                            <input type="password" name='password' placeholder='Digite a sua senha...' required/>
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
                    <button type='submit' className={classes.btn}>Entrar</button>
                    <Link to="/register" className={classes.register}>Registrar-se</Link>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Login