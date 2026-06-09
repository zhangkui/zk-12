import React, { useEffect } from 'react';
import AppRouter from './router';
import { useAuthStore } from './store/useAuthStore';

const App: React.FC = () => {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return <AppRouter />;
};

export default App;
