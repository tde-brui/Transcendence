import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context
interface AuthContextType {
  userId: number; // -1 when not logged in, or the actual user ID
  setUserId: (id: number) => void; // Function to update userId
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider
interface AuthProviderProps {
  children: ReactNode; // Allow any valid React children
}

// Create the provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userId, setUserId] = useState<number>(-1); // Default to -1 when not logged in

  return (
    <AuthContext.Provider value={{ userId, setUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
