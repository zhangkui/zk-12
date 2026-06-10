import api from './api';
import { UserBalance, RechargeOrder, TransactionRecord, APIResponse, PaginatedResponse, PaginationParams } from '../types';

export interface RechargeListParams extends PaginationParams {
  user_id?: number;
  status?: string;
}

export interface TransactionListParams extends PaginationParams {
  user_id?: number;
  type?: string;
}

export const getBalance = (): Promise<APIResponse<UserBalance>> => {
  return api.get('/wallet/balance');
};

export const getUserBalance = (userId: number): Promise<APIResponse<UserBalance>> => {
  return api.get(`/wallet/balance/${userId}`);
};

export const hasPaymentPassword = (): Promise<APIResponse<boolean>> => {
  return api.get('/wallet/has-payment-password');
};

export const setPaymentPassword = (data: {
  payment_password: string;
}): Promise<APIResponse<void>> => {
  return api.post('/wallet/payment-password', data);
};

export const updatePaymentPassword = (data: {
  old_payment_password: string;
  new_payment_password: string;
}): Promise<APIResponse<void>> => {
  return api.put('/wallet/payment-password', data);
};

export const recharge = (data: {
  user_id: number;
  amount: number;
  remark?: string;
}): Promise<APIResponse<RechargeOrder>> => {
  return api.post('/wallet/recharge', data);
};

export const getRecharges = (params: RechargeListParams = {}): Promise<PaginatedResponse<RechargeOrder>> => {
  return api.get('/wallet/recharges', { params });
};

export const getRecharge = (id: number): Promise<APIResponse<RechargeOrder>> => {
  return api.get(`/wallet/recharges/${id}`);
};

export const getTransactions = (params: TransactionListParams = {}): Promise<PaginatedResponse<TransactionRecord>> => {
  return api.get('/wallet/transactions', { params });
};

export const payWithBalance = (orderId: number, data: {
  payment_password: string;
  amount: number;
}): Promise<APIResponse<any>> => {
  return api.post(`/wallet/pay/${orderId}`, data);
};
