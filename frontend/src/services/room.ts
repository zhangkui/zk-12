import api from './api';
import { Room, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface RoomListParams extends PaginationParams {
  min_capacity?: number;
  is_active?: boolean;
}

export const getRooms = (params: RoomListParams = {}): Promise<PaginatedResponse<Room>> => {
  return api.get('/rooms', { params });
};

export const getRoom = (id: number): Promise<APIResponse<Room>> => {
  return api.get(`/rooms/${id}`);
};

export const createRoom = (data: Partial<Room>): Promise<APIResponse<Room>> => {
  return api.post('/rooms', data);
};

export const updateRoom = (id: number, data: Partial<Room>): Promise<APIResponse<Room>> => {
  return api.put(`/rooms/${id}`, data);
};

export const deleteRoom = (id: number): Promise<APIResponse<void>> => {
  return api.delete(`/rooms/${id}`);
};
