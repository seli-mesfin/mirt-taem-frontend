const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const request = async <T>(endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

export interface ApiUser {
  id: number;
  name?: string;
  email: string;
  phone?: string;
  location?: string;
  userType: 'customer' | 'provider' | 'admin';
  category?: string;
  startingPricePerPerson?: number;
  menuItems?: string[];
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  isActive?: boolean;
  accountLocked?: boolean;
  loginAttempts?: number;
}

export interface ApiTransaction {
  id: number;
  providerId: number;
  providerName: string;
  customerId?: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerLocation?: string;
  eventType: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: number;
  amount: number;
  commission: number;
  netAmount: number;
  status: 'completed' | 'pending' | 'cancelled';
  date: string;
}

export interface ApiReview {
  id: number;
  providerId: number;
  customerId?: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export const getUsers = async (userType?: string): Promise<ApiUser[]> => {
  const query = userType ? `?type=${encodeURIComponent(userType)}` : '';
  return request<ApiUser[]>(`/users${query}`);
};

export const getUserByEmail = async (email: string): Promise<ApiUser | null> => {
  const users = await request<ApiUser[]>(`/users?email=${encodeURIComponent(email)}`);
  return users.length > 0 ? users[0] : null;
};

export const createUser = async (userData: Partial<ApiUser> & { userType: string }) => {
  return request<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (id: number, updates: Partial<ApiUser>) => {
  return request<ApiUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const getProviders = async (): Promise<ApiUser[]> => {
  return request<ApiUser[]>('/providers');
};

export const getTransactions = async (): Promise<ApiTransaction[]> => {
  return request<ApiTransaction[]>('/transactions');
};

export const createTransaction = async (transactionData: Omit<ApiTransaction, 'id' | 'date'>) => {
  return request<ApiTransaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  });
};

export const updateTransactionStatus = async (id: number, status: 'completed' | 'pending' | 'cancelled') => {
  return request<ApiTransaction>(`/transactions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const getReviewsByProvider = async (providerId: number): Promise<ApiReview[]> => {
  return request<ApiReview[]>(`/reviews/provider/${providerId}`);
};

export const createReview = async (reviewData: Omit<ApiReview, 'id' | 'date'>) => {
  return request<ApiReview>('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
};

export const getAdminStats = async () => {
  return request<{
    totalUsers: number;
    customers: number;
    providers: number;
    completedOrders: number;
    revenue: number;
  }>('/admin/stats');
};
