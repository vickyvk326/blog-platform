'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import Navbar from './Navbar';
import { CurrentUser } from '@/lib/serverFunctions';

interface AuthContextType {
  user: CurrentUser;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function ClientProvider({ ssrUser, children }: { ssrUser: CurrentUser; children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(ssrUser);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Navbar />
      <main className='container py-6 mx-auto min-h-screen mt-2.5'>{children}</main>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside ClientProvider');
  return context;
};
