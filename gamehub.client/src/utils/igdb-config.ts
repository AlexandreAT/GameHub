import axios from 'axios';

const clientId = 'd3ykuhzdgly8hq7c5iy1dxckg6tbvd';
const clientSecret = '63lpytvy9kow17vypjt55i1y439x5q';

const authenticate = async () => {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;

  try {
    const response = await axios.post(url);
    const data = response.data;
    const accessToken = data.access_token;

    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    return accessToken;
  } catch (error) {
    console.error(error);
  }
};

const setIgdbToken = (token: string) => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export { authenticate, setIgdbToken, clientId };