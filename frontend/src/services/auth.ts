import api from './api';
import { User, TokenResponse, APIResponse } from '../types';

export const login = async (username: string, password: string): Promise<TokenResponse> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  phone?: string;
  full_name?: string;
}): Promise<TokenResponse> => {
  return api.post('/auth/register', {
    ...userData,
    role: 'player',
  });
};

export const getCurrentUser = async (): Promise<APIResponse<User>> => {
  return api.get('/auth/me');
};
