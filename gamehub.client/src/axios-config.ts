import axios from 'axios';

axios.defaults.baseURL = 'https://localhost:7045/api';

axios.defaults.headers.post['Content-Type'] = "application/json";

axios.defaults.timeout = 10000;

export default axios;