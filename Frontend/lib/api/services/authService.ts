/**
 * Authentication API Service
 */

import { apiClient } from '../client';

export interface SignupData {
  email: string;
  password: string;
  name: string;
  pharmacyName: string;
  phone?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    pharmacy_name: string;
    phone?: string;
  };
  token: string;
  session: any;
}

export const authService = {
  /**
   * Sign up a new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data, false);
    if (response.status === 'success' && response.data) {
      // Store user data and token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({
          ...response.data,
          pharmacyId: response.data.user.id,
        }));
      }
      return response.data;
    }
    throw new Error(response.message || 'Signup failed');
  },

  /**
   * Sign in an existing user
   */
  async signin(data: SigninData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signin', data, false);
    if (response.status === 'success' && response.data) {
      // Store user data and token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({
          ...response.data,
          pharmacyId: response.data.user.id,
        }));
      }
      return response.data;
    }
    throw new Error(response.message || 'Signin failed');
  },

  /**
   * Sign out current user
   */
  signout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): AuthResponse['user'] | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.user || null;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },
};

