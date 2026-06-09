import api from './api';
import { User, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface UserListParams extends PaginationParams {
  role?: string;
  is_active?: boolean;
}

export const getUsers = (params: UserListParams = {}): Promise<PaginatedResponse<User>> => {
  return api.get('/users', { params });
};

export const getUser = (id: number): Promise<APIResponse<User>> => {
  return api.get(`/users/${id}`);
};

export const createUser = (data: Partial<User> & { password: string }): Promise<APIResponse<User>> => {
  return api.post('/users', data);
};

export const updateUser = (id: number, data: Partial<User>): Promise<APIResponse<User>> => {
  return api.put(`/users/${id}`, data);
};

export const updateUserPassword = (id: number, data: {
  old_password?: string;
  new_password: string;
}): Promise<APIResponse<User>> => {
  return api.patch(`/users/${id}/password`, data);
};

export const deleteUser = (id: number): Promise<APIResponse<void>> => {
  return api.delete(`/users/${id}`);
};
