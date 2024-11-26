require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/login', (req, res) => {
  // Redirect user to 42's authorization page
  const authorizationUrl = process.env.AUTHORIZATION_URL;
  res.redirect(authorizationUrl);
});

app.get('/callback', async (req, res) => {
  const authorizationCode = req.query.code;
	
  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://api.intra.42.fr/oauth/token', {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: authorizationCode,
      redirect_uri: REDIRECT_URI,
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch user data with access token
    const userResponse = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("id:", userResponse.data.id);
	console.log("login:", userResponse.data.login);
	console.log("email:", userResponse.data.email);
    // Handle user data (display, save to session, etc.)
    res.json(userResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during authentication.');
  }
});


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
