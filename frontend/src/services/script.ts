import api from './api';
import { Script, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface ScriptListParams extends PaginationParams {
  difficulty?: string;
  script_type?: string;
  min_players?: number;
  max_players?: number;
  is_active?: boolean;
}

export const getScripts = (params: ScriptListParams = {}): Promise<PaginatedResponse<Script>> => {
  return api.get('/scripts', { params });
};

export const getScript = (id: number): Promise<APIResponse<Script>> => {
  return api.get(`/scripts/${id}`);
};

export const createScript = (data: Partial<Script>): Promise<APIResponse<Script>> => {
  return api.post('/scripts', data);
};

export const updateScript = (id: number, data: Partial<Script>): Promise<APIResponse<Script>> => {
  return api.put(`/scripts/${id}`, data);
};

export const deleteScript = (id: number): Promise<APIResponse<void>> => {
  return api.delete(`/scripts/${id}`);
};
