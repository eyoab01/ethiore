/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbSignUp,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { userRepository } from './firestore';
import { UserProfile, UserRole } from '../types';

export const authService = {
  // Sign in
  async signIn(email: string, password: string): Promise<UserProfile> {
    const userCredential = await fbSignIn(auth, email, password);
    const fbUser = userCredential.user;
    
    // Get profile from Firestore
    let profile = await userRepository.getProfile(fbUser.uid);
    
    if (!profile) {
      // Fallback if profile doesn't exist for some reason
      profile = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        displayName: fbUser.displayName || 'M. Yohannes',
        role: 'Employee' as UserRole,
        department: 'Claims Department',
        createdAt: new Date().toISOString()
      };
      await userRepository.saveProfile(profile);
    }
    
    return profile;
  },

  // Register / Sign Up
  async signUp(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    department: string
  ): Promise<UserProfile> {
    const userCredential = await fbSignUp(auth, email, password);
    const fbUser = userCredential.user;

    // Update Firebase display name
    await fbUpdateProfile(fbUser, { displayName });

    const profile: UserProfile = {
      uid: fbUser.uid,
      email,
      displayName,
      role,
      department,
      createdAt: new Date().toISOString()
    };

    // Save profile to Firestore
    await userRepository.saveProfile(profile);

    return profile;
  },

  // Sign out
  async signOut(): Promise<void> {
    await fbSignOut(auth);
  },

  // Watch auth state change and fetch Firestore profile
  onAuthStateChanged(
    callback: (profile: UserProfile | null, fbUser: FirebaseUser | null) => void
  ): () => void {
    return fbOnAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await userRepository.getProfile(fbUser.uid);
          callback(profile, fbUser);
        } catch (error) {
          console.error('Error fetching profile on auth change:', error);
          callback(null, fbUser);
        }
      } else {
        callback(null, null);
      }
    });
  }
};
