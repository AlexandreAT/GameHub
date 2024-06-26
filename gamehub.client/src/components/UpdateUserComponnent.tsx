import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { axios } from '../axios-config';
import { insertMaskInPhone } from '../utils/insertMaskInPhone';
import * as qs from 'qs';

import classes from './UpdateUserComponnent.module.css'
import { cleanPhoneNumber } from '../utils/clearPhoneNumber';

interface User {
    id: string;
    nickname: string;
    phone?: string;
    password: string;
    city?: string;
    state?: string;
}

interface Props {
    user: User | null;
}

const UpdateUserComponnent = ({ user }: Props) => {

    if (!user) {
        return null;
    }

    const [nickname, setNickname] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmBtn, setShowConfirmBtn] = useState(false);

    const [formSubmitted, setFormSubmitted] = useState(false);

    const navigate = useNavigate();

    const [formError, setFormError] = useState({
        phone: "",
        password: "",
        confirmPassword: "",
        nickname: "",
        city: "",
        state: ""
    });

    useEffect(() => {
        setNickname(user.nickname);
        if(user.phone){
            setPhone(user.phone);
        }
        if(user.city){
            setCity(user.city);
        }
        if(user.state){
            setState(user.state);
        }
        setPassword(user.password);
        setConfirmPassword(user.password);
    }, [])

    const putData = async (url: string, data: any) => {
        try {
            const response = await axios.put(url, qs.stringify(data), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
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
    };

    useEffect(() => {

    }, [formError])

    const validateForm = (clearPhone: string) => {

        let inputError = {
            phone: "",
            password: "",
            confirmPassword: "",
            nickname: "",
            city: "",
            state: ""
        };

        setPhone(cleanPhoneNumber(phone));
        
        if (clearPhone) {
            
            if (clearPhone.length < 10 || clearPhone.length > 11) {
                inputError = {
                    ...inputError,
                    phone: "O telefone deve ter entre 10 e 11 caracteres, ou deve ser deixado em branco"
                };
            }
        }
        
        if (city) {
            if(city.length < 3){
                inputError = {
                    ...inputError,
                    city: "A cidade deve ter 3 ou mais caracteres, ou deve ser deixada em branco"
                };
            }
        }
        
        if (state) {
            if (state.length < 3){
                inputError = {
                    ...inputError,
                    state: "O estado deve ter 3 ou mais caracteres, ou deve ser deixado em branco"
                };
            }
        }

        if (nickname.length < 2 || nickname.length > 20) {
            inputError = {
                ...inputError,
                nickname: "O apelido deve ter entre 2 e 20 caracteres"
            };
        }

        if (password.length < 6 || password.length > 20) {
            inputError = {
                ...inputError,
                password: "A senha deve ter entre 6 e 20 caracteres"
            }
        }

        if (!password || !confirmPassword || !nickname) {
            inputError = {
                ...inputError,
                password: !password ? "Campo obrigatório!" : "",
                confirmPassword: !confirmPassword ? "Campo obrigatório!" : "",
                nickname: !nickname ? "Campo obrigatório!" : "",
            }
        }

        if (password !== "" && confirmPassword !== "" && password !== confirmPassword) {
            inputError = {
                ...inputError,
                confirmPassword: confirmPassword !== password ? "As senhas não conferem!" : ""
            }
        }
        return inputError;

    }

    const updateUser = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return

        let clearPhone = cleanPhoneNumber(phone);
        let newFormError = validateForm(clearPhone);
        setFormError(newFormError);
        setFormSubmitted(true);

        const hasErrors = Object.values(newFormError).some(error => error !== '');
        if (!hasErrors) {
            try {

                const response = await putData(`/Users/${user.id}`, {
                    id: user.id,
                    nickname,
                    phone: clearPhone,
                    city,
                    state,
                    password,
                });
                if (response.error) {
                    console.log('Error from the backend:', response.error);
                } else {
                    console.log('Usuário atualizado com sucesso!');
                    window.location.reload();
                }
            } catch (error) {
                console.clear();
                console.error('Erro ao atualizar usuário:', error);
            }
        }
        else {
            console.error('Há erros no formulário!');
        }
    }

    const deleteUser = async () => {
        try{
            await axios.delete(`/Users/${user.id}`, { params: {
                id: user.id
            }})
            Cookies.remove('.AspNetCore.Application.Authorization');
            navigate('/');
        } catch(error){
            console.log(error);
        }
    }

    return (
        <>
                <form className={classes.formEditUser} onSubmit={updateUser}>
                <div>
                    <label htmlFor="nickname">Apelido:</label>
                    <input type="text" name="nickname" id="nickname" placeholder='Digite o seu apelido...' onChange={(e) => setNickname(e.target.value)} value={nickname} />
                    {formSubmitted && (<p className='errorMessage'>{formError.nickname}</p>)}
                </div>
                <div>
                    <label htmlFor="phone">Telefone:</label>
                    <input type="text" name='phone' id='phone' placeholder='Digite o seu telefone...' onChange={(e) => setPhone(e.target.value)} value={insertMaskInPhone(phone)} />
                    {formSubmitted && (<p className='errorMessage'>{formError.phone}</p>)}
                </div>
                <div>
                    <label htmlFor="city">Cidade:</label>
                    <input type="text" name='city' id='city' placeholder='Digite a sua cidade...' onChange={(e) => setCity(e.target.value)} value={city} />
                    {formSubmitted && (<p className='errorMessage'>{formError.city}</p>)}
                </div>
                <div>
                    <label htmlFor="state">Estado:</label>
                    <input type="text" name='state' id='state' placeholder='Digite o seu estado...' onChange={(e) => setState(e.target.value)} value={state} />
                    {formSubmitted && (<p className='errorMessage'>{formError.state}</p>)}
                </div>
                <div>
                    <label htmlFor="password">Senha:</label>
                    <input type="password" name='password' placeholder='Digite a nova senha...' onChange={(e) => setPassword(e.target.value)} value={password} />
                    {formSubmitted && (<p className='errorMessage'>{formError.password}</p>)}
                </div>
                <div>
                    <label htmlFor="password">Confirme a senha:</label>
                    <input type="password" name='password' placeholder='Digite a nova senha...' onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} />
                    {formSubmitted && (<p className='errorMessage'>{formError.confirmPassword}</p>)}
                </div>
                <button type='submit' className='btnTransparent'>Atualizar os dados</button>
            </form>
            <button onClick={() => setShowConfirmBtn(!showConfirmBtn)} className={classes.btnDelete}>Deletar conta</button>
            {showConfirmBtn && (
                <div className={classes.confirmDiv}>
                    <button onClick={deleteUser} className={classes.btnDelete}>Confirmar</button>
                    <button onClick={() => setShowConfirmBtn(!showConfirmBtn)} className='btnTransparent'>Cancelar</button>
                </div>
            )}
        </>
    )
}

export default UpdateUserComponnent