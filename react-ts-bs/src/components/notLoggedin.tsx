import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const NotLoggedIn = (userId: number) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (userId === -1) {
      navigate('/hello');
    }
  }, [userId, navigate]);
};
