import axios from 'axios';
import Cookies from 'js-cookie';

axios.defaults.baseURL = 'https://localhost:7045/api';

axios.defaults.headers.post['Content-Type'] = "application/json";

axios.defaults.timeout = 10000;

// Interceptor de solicitação que verifica se um token JWT está presente nos cookies
// e o define no cabeçalho da autorização para cada solicitação HTTP
axios.interceptors.request.use((config) => {
  const token = Cookies.get('.AspNetCore.Application.Authorization');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const setAuthToken = (token: string) => {
    if (token) {
      // Define o token no cookie
      Cookies.set('.AspNetCore.Application.Authorization', token, { expires: 7 });
      
    } else {
      // Limpa o cookie
      console.log("token removido: "+ token);
      
      Cookies.remove('.AspNetCore.Application.Authorization');
    }
  };

export { axios, setAuthToken };