import api from './api';
import { Order, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface OrderListParams extends PaginationParams {
  user_id?: number;
  session_id?: number;
  status?: string;
}

export const getOrders = (params: OrderListParams = {}): Promise<PaginatedResponse<Order>> => {
  return api.get('/orders', { params });
};

export const getOrder = (id: number): Promise<APIResponse<Order>> => {
  return api.get(`/orders/${id}`);
};

export const createOrder = (data: Partial<Order>): Promise<APIResponse<Order>> => {
  return api.post('/orders', data);
};

export const payOrder = (id: number, data: {
  payment_method: string;
  amount: number;
}): Promise<APIResponse<Order>> => {
  return api.post(`/orders/${id}/pay`, data);
};

export const cancelOrder = (id: number): Promise<APIResponse<Order>> => {
  return api.post(`/orders/${id}/cancel`);
};

export const getDailyStats = (date?: string): Promise<APIResponse<any>> => {
  const params = date ? { date } : {};
  return api.get('/orders/stats/daily', { params });
};
