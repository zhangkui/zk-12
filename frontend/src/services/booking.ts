import api from './api';
import { Booking, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface BookingListParams extends PaginationParams {
  session_id?: number;
  player_id?: number;
  status?: string;
}

export const getBookings = (params: BookingListParams = {}): Promise<PaginatedResponse<Booking>> => {
  return api.get('/bookings', { params });
};

export const getBooking = (id: number): Promise<APIResponse<Booking>> => {
  return api.get(`/bookings/${id}`);
};

export const createBooking = (data: {
  session_id: number;
  player_count: number;
  character_name?: string;
  notes?: string;
}): Promise<APIResponse<Booking>> => {
  return api.post('/bookings', data);
};

export const confirmBooking = (id: number): Promise<APIResponse<Booking>> => {
  return api.post(`/bookings/${id}/confirm`);
};

export const cancelBooking = (id: number): Promise<APIResponse<Booking>> => {
  return api.post(`/bookings/${id}/cancel`);
};
