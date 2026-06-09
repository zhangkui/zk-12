import api from './api';
import { Host, HostSchedule, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface HostListParams extends PaginationParams {
  is_active?: boolean;
}

export const getHosts = (params: HostListParams = {}): Promise<PaginatedResponse<Host>> => {
  return api.get('/hosts', { params });
};

export const getAvailableHosts = (date: string, startTime: string, endTime: string): Promise<APIResponse<Host[]>> => {
  return api.get('/hosts/available', {
    params: { date, start_time: startTime, end_time: endTime },
  });
};

export const getHost = (id: number): Promise<APIResponse<Host>> => {
  return api.get(`/hosts/${id}`);
};

export const createHost = (data: Partial<Host> & { user_id: number }): Promise<APIResponse<Host>> => {
  return api.post('/hosts', data);
};

export const updateHost = (id: number, data: Partial<Host>): Promise<APIResponse<Host>> => {
  return api.put(`/hosts/${id}`, data);
};

export const deleteHost = (id: number): Promise<APIResponse<void>> => {
  return api.delete(`/hosts/${id}`);
};

export interface HostScheduleListParams extends PaginationParams {
  host_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
}

export const getHostSchedules = (params: HostScheduleListParams = {}): Promise<PaginatedResponse<HostSchedule>> => {
  return api.get('/host-schedules', { params });
};

export const getHostSchedule = (id: number): Promise<APIResponse<HostSchedule>> => {
  return api.get(`/host-schedules/${id}`);
};

export const createHostSchedule = (data: Partial<HostSchedule>): Promise<APIResponse<HostSchedule>> => {
  return api.post('/host-schedules', data);
};

export const updateHostSchedule = (id: number, data: Partial<HostSchedule>): Promise<APIResponse<HostSchedule>> => {
  return api.put(`/host-schedules/${id}`, data);
};

export const deleteHostSchedule = (id: number): Promise<APIResponse<void>> => {
  return api.delete(`/host-schedules/${id}`);
};
