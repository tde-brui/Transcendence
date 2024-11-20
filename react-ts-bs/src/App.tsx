import Register from './components/Register';
import './App.css';
import UserProfile from './components/UserProfile';

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
      <Register />
	  {/* <UserProfile userId={2} /> */}
	  
      </div>
      
  );
}

export default App;

