// websocket.js
import { v4 as uuidv4 } from 'uuid';

const WS_URL = 'ws://localhost:8000/ws/pong/';

// Immediately generate or retrieve the uniqueKey
const uniqueKey = (() => {
  let key = sessionStorage.getItem('uniqueKey');
  if (!key) {
    key = uuidv4();
    sessionStorage.setItem('uniqueKey', key);
  }
  return key;
})();

const websocket = new WebSocket(`${WS_URL}?key=${uniqueKey}`);

export default websocket;
