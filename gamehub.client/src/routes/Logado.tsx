import React, { useEffect, useState } from 'react';
import { axios } from '../axios-config';

const Logado = () => {
  const [user, setUser] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/Users/current');
        setUser(response.data);
        
        console.log(response.data);
        
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Usuários Registrados</h1>
        <p>Nome: {user.name}</p>
    </div>
  );
};

export default Logado;