import React from 'react';
import UserProfile from './UserProfile';

function App() {
  return (
    <div
      className="App"
      style={{
        backgroundImage: `url('/BG.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        height: '100vh',
      }}
    >
      <UserProfile userId={1} />
    </div>
  );
}

export default App;
