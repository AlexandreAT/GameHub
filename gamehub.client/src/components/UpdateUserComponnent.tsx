import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { axios } from '../axios-config';
import { insertMaskInPhone } from '../utils/insertMaskInPhone';
import { cleanPhoneNumber } from '../utils/clearPhoneNumber';
import * as qs from 'qs';
import classes from './UpdateUserComponnent.module.css';

interface User {
    nickname: string;
    phone?: string;
    city?: string;
    state?: string;
    biography?: string;
}

interface Props {
    user: User | null;
}

const UpdateUserComponnent = ({ user }: Props) => {
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmBtn, setShowConfirmBtn] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        setNickname(user.nickname);
        setPhone(user.phone ?? '');
        setCity(user.city ?? '');
        setState(user.state ?? '');
    }, [user]);

    if (!user) return null;

    const updateUser = async (event: FormEvent) => {
        event.preventDefault();
        const clearPhone = cleanPhoneNumber(phone);

        if (nickname.length < 2 || nickname.length > 20) {
            setError('O apelido deve ter entre 2 e 20 caracteres.');
            return;
        }
        if (clearPhone && (clearPhone.length < 10 || clearPhone.length > 11)) {
            setError('O telefone deve ter entre 10 e 11 dígitos.');
            return;
        }

        try {
            await axios.put('/Users/current', qs.stringify({
                nickname,
                phone: clearPhone,
                city,
                state,
                biography: user.biography ?? ''
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            window.location.reload();
        } catch (requestError: any) {
            setError(requestError.response?.data ?? 'Não foi possível atualizar o perfil.');
        }
    };

    const changePassword = async (event: FormEvent) => {
        event.preventDefault();

        if (newPassword.length < 8 || newPassword.length > 72) {
            setError('A nova senha deve ter entre 8 e 72 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As novas senhas não conferem.');
            return;
        }

        try {
            await axios.put('/Users/current/password', { currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('Senha alterada com sucesso.');
        } catch (requestError: any) {
            setError(requestError.response?.data ?? 'Não foi possível alterar a senha.');
        }
    };

    const deleteUser = async () => {
        try {
            await axios.delete('/Users/current');
            Cookies.remove('.AspNetCore.Application.Authorization');
            navigate('/');
        } catch {
            setError('Não foi possível excluir a conta.');
        }
    };

    return (
        <>
            <form className={classes.formEditUser} onSubmit={updateUser}>
                <div>
                    <label htmlFor="nickname">Apelido:</label>
                    <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="phone">Telefone:</label>
                    <input id="phone" value={insertMaskInPhone(phone)} onChange={(event) => setPhone(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="city">Cidade:</label>
                    <input id="city" value={city} onChange={(event) => setCity(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="state">Estado:</label>
                    <input id="state" value={state} onChange={(event) => setState(event.target.value)} />
                </div>
                <button type="submit" className="btnTransparent">Atualizar os dados</button>
            </form>

            <form className={classes.formEditUser} onSubmit={changePassword}>
                <div>
                    <label htmlFor="currentPassword">Senha atual:</label>
                    <input id="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="newPassword">Nova senha:</label>
                    <input id="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirme a nova senha:</label>
                    <input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
                <button type="submit" className="btnTransparent">Alterar senha</button>
            </form>

            {error && <p className="errorMessage">{error}</p>}
            <button onClick={() => setShowConfirmBtn(!showConfirmBtn)} className={classes.btnDelete}>Deletar conta</button>
            {showConfirmBtn && (
                <div className={classes.confirmDiv}>
                    <button onClick={deleteUser} className={classes.btnDelete}>Confirmar</button>
                    <button onClick={() => setShowConfirmBtn(false)} className="btnTransparent">Cancelar</button>
                </div>
            )}
        </>
    );
};

export default UpdateUserComponnent;
