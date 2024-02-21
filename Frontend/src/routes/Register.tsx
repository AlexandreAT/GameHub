import React, { useState, FormEvent } from 'react';
import MaskInput from '../components/MaskInput';
import { validateCpf } from '../utils/validateCpf';
import { insertMaskInPhone } from '../utils/insertMaskInPhone';

import classes from "./Register.module.css";
import { cleanPhoneNumber } from '../utils/clearPhoneNumber';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'

const Cadastro = () => {

  const [formTouched, setFormTouched] = useState(false);

  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsOfCondition, setTermsOfCondition] = useState(false);

  const [formError, setFormError] = useState({
    cpf: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    lastName: "",
    termsOfCondition: ""
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const navigate = useNavigate();

  const onSubmit = (e: FormEvent) => {
    
    e.preventDefault();
    validateForm();
    setFormTouched(true);

    const hasChanged = [name, lastName, cpf, phone, email, password, confirmPassword, termsOfCondition].some(value => value !== '');
    if (formTouched && hasChanged) {
      setFormSubmitted(true);

      const hasErrors = Object.values(formError).some(error => error !== '');
      if (!hasErrors) {
        console.log("Formulário submetido!.");
        console.log(name);
        console.log(lastName);
        console.log(cpf);
        const isValidCpf = validateCpf(cpf);
        console.log(isValidCpf);
        const clearPhone = cleanPhoneNumber(phone);
        console.log(clearPhone);
        console.log(email);
        console.log(password);
        console.log(confirmPassword);
        console.log(termsOfCondition);
        navigate("/");
      } else {
        console.log('Há erros no formulário. Por favor, corrija-os antes de enviar.');
      }
    } else {
      console.log('Por favor, preencha os campos antes de enviar o formulário.');
    }
  } 

  const validateForm = () => {
    let inputError = {
      cpf: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      lastName: "",
      termsOfCondition: ""
    };

    if (!cpf || !email || !password || !confirmPassword || !name || !lastName) {
      inputError = {
        ...inputError,
        cpf: !cpf ? "Campo obrigatório!" : "",
        email: !email ? "Campo obrigatório!" : "",
        password: !password ? "Campo obrigatório!" : "",
        confirmPassword: !confirmPassword ? "Campo obrigatório!" : "",
        name: !name ? "Campo obrigatório!" : "",
        lastName: !lastName ? "Campo obrigatório!" : ""
      }
    }

    if(password !== "" && confirmPassword !== "" && password !== confirmPassword){
      inputError = {
        ...inputError,
           confirmPassword:confirmPassword !== password ? "As senhas não conferem!" : ""
        }
    }

    const isValidCpf = validateCpf(cpf);
    if(cpf !== "" && !isValidCpf){
      inputError = {
     ...inputError,
        cpf: !isValidCpf ? "CPF inválido!" : ""
      }
    }

    if(!termsOfCondition){
      inputError = {
        ...inputError,
        termsOfCondition:!termsOfCondition? "Para avançar é necessário aceitar os termos!" : ""
      }
    }

    setFormError(inputError);
  }

  const clearForm = (e: FormEvent) => {
    e.preventDefault();
    setCpf("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setLastName("");
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    validateForm();
  }
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
    validateForm();
  }
  const handleCPFChange = (e: any) => {
    setCpf(e.target.value);
    validateForm();
    // (e: any) => setCpf(e.target.value)
  }
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
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

  return (
    <div className="form">
      <div className={classes.background}></div>
      <div className={classes.registerContainer}>
        <h2>Crie uma conta</h2>
        <form className={classes.formControl} onSubmit={onSubmit}>
          <div className={classes.fieldsSideBySide}>
            <div>
              <label htmlFor="name">Nome <span className={classes.required}>*</span></label>
              <input type="text" name='name' placeholder='Digite o seu nome...' onChange={handleNameChange} value={name} onBlur={validateForm}/>
              {formSubmitted && (<p className='errorMessage'>{formError.name}</p>)}
            </div>
            <div>
              <label htmlFor="surname">Sobrenome <span className={classes.required}>*</span></label>
              <input type="text" name='surname' placeholder='Digite o seu sobrenome...' onChange={handleLastNameChange} value={lastName} onBlur={validateForm}/>
              {formSubmitted && (<p className='errorMessage'>{formError.lastName}</p>)}
            </div>
          </div>
          <div className={classes.fieldsSideBySide}>
            <div>
              <label htmlFor="cpf">CPF <span className={classes.required}>*</span></label>
              <MaskInput value={cpf} onChange={handleCPFChange} onBlur={validateForm}/>
              {formSubmitted && (<p className='errorMessage'>{formError.cpf}</p>)}
            </div>
            <div>
              <label htmlFor="phone">Número de telefone</label>
              <input type="tel" name='phone' placeholder='Digite o seu telefone...' onChange={handlePhoneChange} value={insertMaskInPhone(phone)} onBlur={validateForm}/>
              {formSubmitted && (<p className='errorMessage'>{formError.phone}</p>)}
            </div>
          </div>
          <div className={classes.inputEmail}>
            <label htmlFor="email">Email <span className={classes.required}>*</span></label>
            <input type="text" name='email' placeholder='Digite o seu email...' onChange={handleEmailChange} value={email} onBlur={validateForm}/>
            {formSubmitted && (<p className='errorMessage'>{formError.email}</p>)}
          </div>
          <div className={classes.fieldsSideBySide}>
            <div>
              <label htmlFor="password">Senha <span className={classes.required}>*</span></label>
              <input type="password" name='password' placeholder='Digite a sua senha...' onChange={handlePasswordChange} value={password} onBlur={validateForm}/>
              {formSubmitted && (<p className='errorMessage'>{formError.password}</p>)}
            </div>
            <div>
              <label htmlFor="passwordConfirm">Confirme a senha <span className={classes.required}>*</span></label>
              <input type="password" name='passwordConfirm' placeholder='Digite novamente a senha...' onChange={handleConfirmPasswordChange} value={confirmPassword} onBlur={validateForm}/>
              {formSubmitted && (<p className='errorMessage'>{formError.confirmPassword}</p>)}
            </div>
          </div>
          <div className={classes.inputCheckbox}>
            <input type="checkbox" name='termsOfCondition' onChange={handleTermsChange}/>
            <label htmlFor="termsOfCondition">Estou ciente e aceito os {<Link to="/termsOfCondition" className="link">termos de condição</Link>}.</label>
            <div className={classes.errorMessage}>
              {formSubmitted && (<p className='errorMessage'>{formError.termsOfCondition}</p>)}
            </div>
          </div>
          <div className={classes.divButtons}>
            <button type='submit'>Enviar</button>
            <input type="button" value="Limpar" onClick={clearForm} className={classes.clearInput}/>
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