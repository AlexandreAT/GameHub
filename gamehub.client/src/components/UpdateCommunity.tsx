import { useState, useEffect } from 'react';
import { axios } from '../axios-config';
import { useNavigate } from 'react-router-dom';
import * as qs from 'qs';

import classes from './UpdateCommunity.module.css'
import LoadingAnimation from './LoadingAnimation';

interface Props {
    user: User | null;
    community: Community | null;
}

interface Community {
    id: string;
    creator: string;
    name: string;
    game: string;
    backgroundImageSrc: string;
    iconeImageSrc: string;
    description: string;
    post: string[];
    followers: string[];
}

interface User {
    id: string;
    nickname: string;
    imageSrc: string;
    userCommunities: string[];
    userCreatedCommunities: string[];
    following: string[];
}

function UpdateCommunity({ user, community }: Props) {

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [background, setBackground] = useState<File | null>(null);
    const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [showDescription, setShowDescription] = useState(false);

    const navigate = useNavigate();

    if (!user) {
        return <LoadingAnimation opt='user' />
    }

    if (!community) {
        return <LoadingAnimation opt='generic' />
    }

    useEffect(() => {
        setName(community.name);
        setDescription(community.description);
        setImagePreview(community.iconeImageSrc);
        setBackgroundImagePreview(community.backgroundImageSrc);
    }, [])

    const handleImageChange = (event: any) => {
        setImage(event.target.files[0]);
        setImagePreview(URL.createObjectURL(event.target.files[0]));
    };

    const handleUploadImage = async () => {
        if (!image) return;

        const url = `https://api.imgbb.com/1/upload?key=b7374e73063a610d12c9922f0c360a20&name=${image.name}`;
        const formData = new FormData();
        formData.append('image', image);
        const opt = "icone";

        try {
            const responseJsonApi = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            const responseApi = await responseJsonApi.json();

            formData.delete('image');
            formData.append('image', responseApi.data.url);
            formData.append('id', community.id);
            formData.append('opt', opt);

            await axios.post('/Community/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

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
        const opt = "background";

        try {
            const responseJsonApi = await fetch(url, {
                method: 'POST',
                body: formData,
            });
            const responseApi = await responseJsonApi.json();

            formData.delete('image');
            formData.append('image', responseApi.data.url);
            formData.append('id', community.id);
            formData.append('opt', opt);

            await axios.post('/Community/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

        } catch (error) {
            console.error(error);
        }
    };

    const handleBiography = () => {
        setDescription(community.description);
        setShowDescription(!showDescription);
    }

    const deleteCommunity = async () => {
        try{
            await axios.delete(`/Community/${community.id}`, {
                params: {
                    id: community.id,
                    userId: community.creator
                }
            })

            navigate(`/listCommunities/${user.id}/${"created"}`);
        } catch(error){
            console.clear();
            console.error(error);
        }
    }

    const putData =  async (url: string, data: any) => {
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
    }

    const updateCommunity = async () => {
        if (name.length > 25) {
            alert("O nome da comunidade deve ter no máximo 25 caracteres");
            return;
        }
        else if (name.length < 3) {
            alert("O nome da comunidade deve ter no minimo 3 caracteres");
            return;
        }
        else if (description && description.length > 0 && description.length > 1000) {
            alert("A descrição deve ter no máximo 1000 caracteres");
            return;
        }
        else{
            try{
                const response = await putData(`/Community/${community.id}`, {
                    id: community.id,
                    name: name,
                    description: description
                })
                if (response.error) {
                    console.log('Error from the backend:', response.error);
                } else {
                    console.log('Comunidade atualizada com sucesso!');
                    window.location.reload();
                }
            } catch (error) {
                console.clear();
                console.error('Erro ao atualizar comunidade:', error);
            }
        }
    }

    return (
        <div className={classes.divCenter}>
            <div className={classes.divContent}>
                <div className={classes.communityInfo}>
                    <div className={classes.infoHeader}>
                        <div className={`${classes.background} ${!community.backgroundImageSrc && classes.defaultBakground}`}>
                            {backgroundImagePreview ? (
                                <img src={backgroundImagePreview} alt='Background' className={classes.imgBackground} />
                            ) : (
                                community.backgroundImageSrc && (
                                    <img src={community.backgroundImageSrc} alt={community.name} className={classes.imgBackground} />
                                )
                            )}
                        </div>
                        <div className={classes.headerInfo}>
                            {imagePreview ? (
                                <img src={imagePreview} alt={community.name} />
                            ) : (
                                <img src={community.iconeImageSrc} alt={community.name} />
                            )}
                            <div className={classes.btnIcone}>
                                <label htmlFor='file'><span>Clique aqui</span> e escolha um icone novo</label>
                                <input type='file' name='file' id='file' onChange={handleImageChange} />
                                <button className='btnTransparent' onClick={handleUploadImage}>Salvar icone</button>
                            </div>
                            <div className={classes.divInfoController}>
                                <input type='text' className={`${classes.infoDiv} ${classes.divName}`} onChange={(e) => setName(e.target.value)} value={name} />
                                <p>Clique no nome para editar</p>
                                <div className={`${classes.infoDiv} ${classes.infoDivFooter}`}>
                                    <div className={`${classes.paragraph} ${classes.infoCreator}`}>
                                    </div>
                                    <div className={classes.paragraph}>
                                    </div>
                                    <div className={`${classes.paragraph} ${classes.game}`}>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={classes.divEditBackground}>
                            <label htmlFor='fileBackground'><span>Clique aqui</span> e escolha um background novo</label>
                            <input type='file' name='fileBackground' id='fileBackground' onChange={handleBackgroundChange} />
                            <button className={classes.btnBackground} onClick={handleUploadBackground}>Salvar background</button>
                        </div>
                    </div>
                    <div className={classes.infoFooter}>
                        <div className={classes.description}>
                            <p><span className={classes.title}>Descrição: </span>{!community.description ? (
                                <span className={classes.noRegistry}>Sem descrição</span>
                            ) :
                                <span className={classes.spanData} dangerouslySetInnerHTML={{ __html: community.description.replace(/\n/g, '<br/>') }}></span>
                            }</p>
                            <button onClick={handleBiography} className='btnTransparent'>Editar descrição</button>
                            {showDescription && (
                                <div className={classes.formBiography}>
                                    <textarea className={classes.biographyText} onChange={(e) => setDescription(e.target.value)} placeholder='Digite a descrição...' value={description}></textarea>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={classes.divBtn}>
                        <button onClick={updateCommunity} className='btnTransparent'>Atualizar os dados (descrição ou nome)</button>
                    </div>
                    <div className={classes.divBtn}>
                        <button onClick={deleteCommunity} className='btnTransparent'>Deletar comunidade</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UpdateCommunity