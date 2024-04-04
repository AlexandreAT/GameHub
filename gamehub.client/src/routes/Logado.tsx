import React, { useEffect, useState } from 'react';
import { axios } from '../axios-config';

interface User {
  name: string;
  email: string;
}


const Logado = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get<User>('/Users/current');
        setUser(response.data);
        
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Usuário Logado</h1>
        <p>Nome: {user.name}</p>
        <p>Email: {user.email}</p>
    </div>
  );
};

export default Logado;