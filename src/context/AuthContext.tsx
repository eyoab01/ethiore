/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/auth';
import { systemSeeder } from '../services/firestore';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  fbUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role: UserRole, department: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Run seed checking if database has been initialized
    systemSeeder.seedIfNeeded();

    const unsubscribe = authService.onAuthStateChanged((profile, firebaseUser) => {
      setUser(profile);
      setFbUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await authService.signIn(email, password);
      setUser(profile);
    } catch (err: any) {
      console.error('Sign in error:', err);
      let errMsg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Access temporarily disabled due to many failed attempts. Try again later.';
      }
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    department: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await authService.signUp(email, password, displayName, role, department);
      setUser(profile);
    } catch (err: any) {
      console.error('Sign up error:', err);
      let errMsg = 'Failed to register. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email address is already in use.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'The password must be at least 6 characters.';
      }
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setFbUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        fbUser,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
