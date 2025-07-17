import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { token } = useAuthStore.getState();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        // Token expired, try to refresh
        try {
          await useAuthStore.getState().refreshTokens();
          // Retry the request with new token
          const newToken = useAuthStore.getState().token;
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${newToken}`,
          };
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          throw new ApiError('Session expired', 401);
        }
      }
      
      throw new ApiError(
        errorData.message || 'Request failed',
        response.status,
        errorData
      );
    }

    return response.json();
  },

  // User endpoints
  async getCurrentUser() {
    return this.request('/auth/me');
  },

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async searchUsers(query: string) {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  },

  async getUserProfile(userId: string) {
    return this.request(`/users/${userId}/profile`);
  },

  async getUserAnalytics(userId: string) {
    return this.request(`/users/${userId}/analytics`);
  },

  // Recognition endpoints
  async createRecognition(data: any) {
    return this.request('/recognitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRecognitionFeed(limit = 20, offset = 0) {
    return this.request(`/recognitions/feed?limit=${limit}&offset=${offset}`);
  },

  async getUserRecognitions(userId: string, type = 'all', limit = 20, offset = 0) {
    return this.request(`/recognitions/user/${userId}?type=${type}&limit=${limit}&offset=${offset}`);
  },

  async getMyRecognitions(type = 'all', limit = 20, offset = 0) {
    return this.request(`/recognitions/my?type=${type}&limit=${limit}&offset=${offset}`);
  },

  async updateRecognitionPrivacy(recognitionId: string, isPrivate: boolean) {
    return this.request(`/recognitions/${recognitionId}/privacy`, {
      method: 'PUT',
      body: JSON.stringify({ isPrivate }),
    });
  },

  // Points endpoints
  async getPointsBalance() {
    return this.request('/points/balance');
  },

  async getPointsHistory(limit = 50) {
    return this.request(`/points/history?limit=${limit}`);
  },

  // Rewards endpoints
  async getRewards() {
    return this.request('/rewards');
  },

  async redeemReward(rewardId: string) {
    return this.request(`/rewards/${rewardId}/redeem`, {
      method: 'POST',
    });
  },

  async getRedemptions() {
    return this.request('/rewards/redemptions');
  },
};