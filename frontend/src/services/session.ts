import api from './api';
import { Session, SessionDetail, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface SessionListParams extends PaginationParams {
  script_id?: number;
  room_id?: number;
  host_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export const getSessions = (params: SessionListParams = {}): Promise<PaginatedResponse<Session>> => {
  return api.get('/sessions', { params });
};

export const getSession = (id: number): Promise<APIResponse<SessionDetail>> => {
  return api.get(`/sessions/${id}`);
};

export const createSession = (data: Partial<Session>): Promise<APIResponse<Session>> => {
  return api.post('/sessions', data);
};

export const updateSession = (id: number, data: Partial<Session>): Promise<APIResponse<Session>> => {
  return api.put(`/sessions/${id}`, data);
};

export const updateSessionStatus = (id: number, status: string): Promise<APIResponse<Session>> => {
  return api.patch(`/sessions/${id}/status?status=${status}`);
};

export const deleteSession = (id: number): Promise<APIResponse<void>> => {
  return api.delete(`/sessions/${id}`);
};
