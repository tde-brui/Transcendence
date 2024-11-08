require('dotenv').config();
const axios = require('axios');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

console.log('Client ID:', clientId);
console.log('Client Secret:', clientSecret);

async function getAccessToken() {
    try {
        const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', null, {
            params: {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            },
        });
        const accessToken = tokenResponse.data.access_token;
        return accessToken;
    } catch (error) {
        console.error('Error fetching access token:', error);
    }
}

async function getUsersInCursus() {
    const token = await getAccessToken();
    const response = await axios.get('https://api.intra.42.fr/v2/campus', {
        headers: { Authorization: `Bearer ${token}` },
    });
    const usersInCursus = response.data;
	const userID = usersInCursus.id;
	const login = usersInCursus.login;
	const email = usersInCursus.email;
	// console.log('User ID:', userID);
	// console.log('Login:', login);
	// console.log('Email:', email);
    console.log(usersInCursus);
	// console.log(response);
}

getUsersInCursus();

