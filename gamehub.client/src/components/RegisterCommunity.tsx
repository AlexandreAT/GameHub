import { FormEvent, useState } from 'react'
import { isAxiosError } from 'axios';

import classes from "./RegisterCommunity.module.css"
import { axios } from '../axios-config';

const RegisterCommunity = () => {

    const [name, setName] = useState('');

    const postData = async (url: string, data: { name: string }) => {
        try {

            const communityPascalCase = {
                Name: data.name,
            };

            const response = await axios.post(url, communityPascalCase, {
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
    }

    const submitCommunity = async (e: FormEvent) => {
        e.preventDefault();

        if (name.length > 25) {
            alert("O nome da comunidade deve ter no máximo 25 caracteres");
            return;
        }
        else if (name.length < 3) {
            alert("O nome da comunidade deve ter no minimo 3 caracteres");
            return;
        }
        else {
            try {
                const response = await postData('/Community', {
                    name: name,
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
                    setName('');
                    window.location.reload();
                }
            } catch (error) {
                console.error('Erro ao postar:', error);
            }
        }
    }

    return (
        <>
            <form onSubmit={submitCommunity}>
                <div className={classes.formControl}>
                    <input type="text" placeholder='Digite o nome da comunidade...' onChange={(e) => setName(e.target.value)} value={name} />
                    <button type='submit' className='btnTransparent'>Criar</button>
                </div>
            </form>
        </>
    )
}

export default RegisterCommunity
