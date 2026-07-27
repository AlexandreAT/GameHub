import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import { axios, getAuthToken } from '../axios-config';
import { insertMaskInPhone } from '../utils/insertMaskInPhone';

import classes from "./Register.module.css";
import { cleanPhoneNumber } from '../utils/clearPhoneNumber';
import { Link, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import { TbAlertSquareRounded } from "react-icons/tb";

interface RegisterFormData {
  name: string;
  lastName: string;
  clearPhone: string;
  email: string;
  password: string;
  nickname: string;
}

const Cadastro = () => {

  const [formTouched, setFormTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsOfCondition, setTermsOfCondition] = useState(false);
  const [nickname, setNickname] = useState('');
  const [showAlertEmail, setShowAlertEmail] = useState(false);

  const [formError, setFormError] = useState({
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    lastName: "",
    termsOfCondition: "",
    nickname: ""
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const navigate = useNavigate();

  const postData = async (url: string, data: RegisterFormData) => {
    try {
      // Converte as propriedades do objeto User para PascalCase
      const userPascalCase = {
        Name: data.name,
        Surname: data.lastName,
        Phone: data.clearPhone,
        Email: data.email,
        Password: data.password,
        Nickname: data.nickname
      };

      const response = await axios.post(url, userPascalCase, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return { data: response.data, error: null };
    } catch (error: unknown) {
      console.error('Error posting data:', error);
      if (isAxiosError(error) && error.response) {
        return { data: null, error: error.response.data };
      } else if (isAxiosError(error) && error.request) {
        return { data: null, error: { message: 'No response received from the server.' } };
      } else {
        return { data: null, error: { message: 'Error making the request.' } };
      }
    }
  };

  const validateForm = useCallback(() => {
    let inputError = {
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      lastName: "",
      termsOfCondition: "",
      nickname: ""
    };

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      inputError = {
        ...inputError,
        email: "Email inválido!"
      };
    }

    if (name.length < 2) {
      inputError = {
        ...inputError,
        name: "O nome deve ter pelo menos 2 caracteres"
      };
    }

    if (lastName.length < 2) {
      inputError = {
        ...inputError,
        lastName: "O sobrenome deve ter pelo menos 2 caracteres"
      };
    }

    if (nickname.length < 2) {
      inputError = {
        ...inputError,
        nickname: "O apelido deve ter pelo menos 2 caracteres"
      };
    }

    if (password.length < 8 || password.length > 72) {
      inputError = {
        ...inputError,
        password: "A senha deve ter entre 8 e 72 caracteres"
      }
    }

    if (!email || !password || !confirmPassword || !name || !lastName || !nickname) {
      inputError = {
        ...inputError,
        email: !email ? "Campo obrigatório!" : "",
        password: !password ? "Campo obrigatório!" : "",
        confirmPassword: !confirmPassword ? "Campo obrigatório!" : "",
        name: !name ? "Campo obrigatório!" : "",
        lastName: !lastName ? "Campo obrigatório!" : "",
        nickname: !nickname ? "Campo obrigatório!" : "",
      }
    }

    if (password !== "" && confirmPassword !== "" && password !== confirmPassword) {
      inputError = {
        ...inputError,
        confirmPassword: confirmPassword !== password ? "As senhas não conferem!" : ""
      }
    }

    if (!termsOfCondition) {
      inputError = {
        ...inputError,
        termsOfCondition: !termsOfCondition ? "Para avançar é necessário aceitar os termos!" : ""
      }
    }

    setFormError(inputError);
    setFormTouched(true);
  }, [confirmPassword, email, lastName, name, nickname, password, termsOfCondition])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    validateForm();

    if (formSubmitted && Object.values(formError).some(error => error !== '')) {
      setFormSubmitted(false);
    }

    if (formTouched) {
      setFormSubmitted(true);

      const hasErrors = Object.values(formError).some(error => error !== '')

      if (!hasErrors) {
        const clearPhone = cleanPhoneNumber(phone);
        try {
          setIsSubmitting(true);
          const response = await postData('/Users', {
            name,
            lastName,
            nickname,
            clearPhone,
            email,
            password,
          });

          if (response.error) {
            alert(response.error);
            console.log('Error from the backend:', response.error);
            setIsSubmitting(false);
          } else {
            setIsSubmitting(false);
            console.log('Usuário cadastrado com sucesso!', response.data);
            navigate("/");
          }
        } catch (error) {
          console.error('Erro ao cadastrar usuário:', error);
        }
      } else {
        console.log('Há erros no formulário. Por favor, corrija-os antes de enviar.');
      }
    } else {
      console.log('Por favor, preencha os campos antes de enviar o formulário.');
    }
  }

  const clearForm = (e: FormEvent) => {
    e.preventDefault();
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setLastName("");
    setNickname("");
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    validateForm();
  }
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
    validateForm();
  }
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    validateForm();
  }
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.toString());
    validateForm();
  }
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    validateForm();
  }
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    validateForm();
  }
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    validateForm();
  }
  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setTermsOfCondition(checked);  
  }

  useEffect(() => {
    validateForm();
  }, [validateForm])

  if (getAuthToken()) {
    return <Navigate to="/logado" replace />
  }

  return (
    <div className="form">
      <div className={classes.background}></div>
      <div className={classes.registerContainer}>
        <h2>Crie uma conta</h2>
        <form className={classes.formControl} onSubmit={onSubmit}>
          <div className={classes.fieldsSideBySide}>
            <div>
              <label htmlFor="name">Nome <span className={classes.required}>*</span></label>
              <input type="text" name='name' placeholder='Digite o seu nome...' onChange={handleNameChange} value={name} onBlur={validateForm} />
              {formSubmitted && (<p className='errorMessage'>{formError.name}</p>)}
            </div>
            <div>
              <label htmlFor="surname">Sobrenome <span className={classes.required}>*</span></label>
              <input type="text" name='surname' placeholder='Digite o seu sobrenome...' onChange={handleLastNameChange} value={lastName} onBlur={validateForm} />
              {formSubmitted && (<p className='errorMessage'>{formError.lastName}</p>)}
            </div>
          </div>
          <div className={classes.inputNickname}>
            <label htmlFor="nickname">Apelido (nickname) <span className={classes.required}>*</span></label>
            <input type="text" name='nickname' placeholder='Digite seu nickname...' onChange={handleNicknameChange} value={nickname} onBlur={validateForm} />
            {formSubmitted && (<p className='errorMessage'>{formError.nickname}</p>)}
          </div>
          <div className={classes.fieldsSideBySide}>
            <div>
              <label htmlFor="phone">Número de telefone</label>
              <input type="tel" name='phone' placeholder='Digite o seu telefone...' onChange={handlePhoneChange} value={insertMaskInPhone(phone)} onBlur={validateForm} />
              {formSubmitted && (<p className='errorMessage'>{formError.phone}</p>)}
            </div>
          </div>
          <div className={classes.inputEmail}>
            <label htmlFor="email">Email <span className={classes.required}>*</span> <span className={classes.iconBtn} onClick={() => setShowAlertEmail(!showAlertEmail)}><TbAlertSquareRounded className={classes.icon}/></span></label>
            {showAlertEmail && (
              <div className={classes.divAlert}>
                <span>Como este é um site feito apenas para praticar/estudar programação, esse campo não precisa ser preenchido com uma informação real.</span>
              </div>
            )}
            <input type="text" name='email' placeholder='Digite o seu email...' onChange={handleEmailChange} value={email} onBlur={validateForm} />
            {formSubmitted && (<p className='errorMessage'>{formError.email}</p>)}
          </div>
          <div className={classes.fieldsSideBySide}>
            <div>
              <label htmlFor="password">Senha <span className={classes.required}>*</span></label>
              <input type="password" name='password' placeholder='Digite a sua senha...' onChange={handlePasswordChange} value={password} onBlur={validateForm} />
              {formSubmitted && (<p className='errorMessage'>{formError.password}</p>)}
            </div>
            <div>
              <label htmlFor="passwordConfirm">Confirme a senha <span className={classes.required}>*</span></label>
              <input type="password" name='passwordConfirm' placeholder='Digite novamente a senha...' onChange={handleConfirmPasswordChange} value={confirmPassword} onBlur={validateForm} />
              {formSubmitted && (<p className='errorMessage'>{formError.confirmPassword}</p>)}
            </div>
          </div>
          <div className={classes.inputCheckbox}>
            <input type="checkbox" name='termsOfCondition' onChange={handleTermsChange} />
            <Link to="/termsOfCondition"><label htmlFor="termsOfCondition">Estou ciente e aceito os termos de condição.</label></Link>
            <div className={classes.errorMessage}>
              {formSubmitted && (<p className='errorMessage'>{formError.termsOfCondition}</p>)}
            </div>
          </div>
          <div className={classes.divButtons}>
            <button className='btn' type='submit' disabled={isSubmitting}>Enviar</button>
            <input type="button" value="Limpar" onClick={clearForm} className={classes.clearInput} />
          </div>
          <div className={classes.link}>
            <Link to="/" className='link'>Já tem uma conta?</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Cadastro
