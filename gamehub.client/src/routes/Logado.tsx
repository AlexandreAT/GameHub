import React, { useEffect, useState } from 'react';
import { axios } from '../axios-config';

interface User {
  name: string;
  email: string;
  password: string;
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

  if(!user){
    return <h1>Loading...</h1>
  }

  return (
    <div>
      {user.name}
      <br></br>
      {user.email}
      <br></br>
      {user.password}
      <br></br>
    </div>
  );
};

export default Logado;