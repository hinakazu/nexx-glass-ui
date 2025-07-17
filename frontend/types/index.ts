export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  avatarUrl?: string;
  pointsBalance: number;
  monthlyPointsAllocation: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Recognition {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  pointsAmount: number;
  isPrivate: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    avatarUrl?: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    department: string;
    avatarUrl?: string;
  };
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsSpent: number;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'CANCELLED';
  redemptionCode: string;
  createdAt: string;
  user: User;
  reward: Reward;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'EARNED' | 'SPENT' | 'ALLOCATED';
  amount: number;
  description: string;
  relatedId?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department: string;
}

export interface CreateRecognitionData {
  recipientId: string;
  message: string;
  pointsAmount: number;
  isPrivate?: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}