export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  full_name?: string;
  avatar?: string;
  role: 'player' | 'host' | 'admin' | 'owner';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Script {
  id: number;
  name: string;
  author?: string;
  publisher?: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  script_type: 'suspense' | 'emotion' | 'horror' | 'happy' | 'mechanism' | 'other';
  min_players: number;
  max_players: number;
  duration_minutes: number;
  price: number;
  cover_image?: string;
  images?: string;
  tags?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  description?: string;
  equipment?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Host {
  id: number;
  user_id: number;
  nickname: string;
  bio?: string;
  avatar?: string;
  experience_years: number;
  specialties?: string;
  rating: number;
  session_count: number;
  hourly_rate: number;
  accept_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostSchedule {
  id: number;
  host_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  session_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  script_id: number;
  room_id: number;
  host_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  current_players: number;
  min_players: number;
  max_players: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'full';
  notes?: string;
  created_at: string;
  updated_at: string;
  script_name?: string;
  room_name?: string;
  host_name?: string;
}

export interface SessionDetail extends Session {
  script?: Script;
  room?: Room;
  host?: Host;
  bookings?: Booking[];
}

export interface Booking {
  id: number;
  session_id: number;
  player_id: number;
  player_count: number;
  character_name?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlist';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  session_id: number;
  booking_id?: number;
  total_amount: number;
  discount_amount: number;
  actual_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payment_method?: 'wechat' | 'alipay' | 'cash' | 'card' | 'other';
  paid_at?: string;
  player_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  keyword?: string;
}
