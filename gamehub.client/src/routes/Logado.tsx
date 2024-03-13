import React, { useEffect, useState } from 'react';
import axios from '../axios-config';

const Logado = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/Users');
        setUsers(response.data);
        console.log(response.data);
        
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h1>Usuários Logados</h1>
      {users.length === 0 ? <p>Carregando...</p>
      : <ul>
        {users.map((user: any) => (
          <li key={user.Id}>teste: {user.name}, {user.surname} ({user.email})</li>
        ))}
      </ul>}
    </div>
  );
};

export default Logado;