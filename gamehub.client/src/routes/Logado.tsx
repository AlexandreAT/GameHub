import { useNavigate} from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { axios } from '../axios-config';
import { TbPencilPlus, TbPencilX } from "react-icons/tb";

import Cookies from 'js-cookie';
import classes from "./Logado.module.css";

import Navbar from '../components/Navbar'
import MakePostForm from '../components/MakePostForm';
import Sidebar from '../components/Sidebar';
import AllPostsComponent from '../components/AllPostsComponent';
import LoadingAnimation from '../components/LoadingAnimation';

interface User {
  id: string;
  nickname: string;
  imageSrc: string;
  userCommunities: string[];
  userCreatedCommunities: string[];
  following: string[];
}

const Logado = () => {

  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

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
    return <div className='loading'>{<LoadingAnimation opt='user' />}</div>
  }

  const handleShowForm = (e: FormEvent) => {
    e.preventDefault();
    setShowForm(!showForm);
  }

  return (
    <div className={classes.divMain}>

      <div className='navbar'>{<Navbar user={user}/>}</div>

      <div className={classes.divCenter}>

        <Sidebar user={user}/>

        <button className={classes.buttonMakePost} onClick={handleShowForm}>
          {showForm ? (
            <div className={classes.divMakePost}>
              <TbPencilX className={classes.makePostIcon} />
              <p>Cancelar</p>
            </div>
          ) : (
            <div className={classes.divMakePost}>
              <TbPencilPlus className={classes.makePostIcon} />
              <p>Criar post</p>
            </div>
          )}
        </button>

        <div className={classes.formMakePost}>
          {showForm && <MakePostForm user={user} />}
        </div>

        {<AllPostsComponent user={user} />}
      </div>
    </div>
  );
};

export default Logado;