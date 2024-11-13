// src/api.ts

// src/api.ts

export type MatchHistory = {
	opponentId: number;
	date: string;
	result: string;
  };
  
  export type User = {
	id: number;
	username: string;
	email: string;
	displayName: string;
	avatar?: string;
	onlineStatus: string;
	friends: number[];
	matchHistory: MatchHistory[];
  };
  
  export type Session = {
	userId: number;
	jwtToken: string;
	expiresAt: string;
  };
  
  export type AuthRequest = {
	userId: number;
	provider: string;
	authToken: string;
	createdAt: string;
  };
  
  export type TwoFactorAuth = {
	userId: number;
	method: string;
	isEnabled: boolean;
	secret: string;
	backupCodes: string[];
  };
  
  const API_BASE_URL = 'http://localhost:5000';
  
  /**
   * Fetches a user by their ID.
   */
  export async function fetchUser(userId: number): Promise<User> {
	const response = await fetch(`${API_BASE_URL}/users/${userId}`);
	if (!response.ok) throw new Error('Failed to fetch user');
	return response.json();
  }
  
  /**
   * Fetches all users.
   */
  export async function fetchAllUsers(): Promise<User[]> {
	const response = await fetch(`${API_BASE_URL}/users`);
	if (!response.ok) throw new Error('Failed to fetch users');
	return response.json();
  }
  
  /**
   * Fetches a session by user ID.
   */
  export async function fetchSession(userId: number): Promise<Session> {
	const response = await fetch(`${API_BASE_URL}/sessions?userId=${userId}`);
	if (!response.ok) throw new Error('Failed to fetch session');
	const sessions = await response.json();
	return sessions[0]; // Assuming one session per user
  }
  
  /**
   * Creates an authentication request (OAuth).
   */
  export async function createAuthRequest(userId: number, provider: string): Promise<AuthRequest> {
	const response = await fetch(`${API_BASE_URL}/authRequests`, {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ userId, provider, createdAt: new Date().toISOString() })
	});
	if (!response.ok) throw new Error('Failed to create auth request');
	return response.json();
  }
  
  /**
   * Fetches two-factor authentication details by user ID.
   */
  export async function fetchTwoFactorAuth(userId: number): Promise<TwoFactorAuth> {
	const response = await fetch(`${API_BASE_URL}/twoFactorAuth?userId=${userId}`);
	if (!response.ok) throw new Error('Failed to fetch two-factor authentication');
	const twoFactorAuth = await response.json();
	return twoFactorAuth[0]; // Assuming one 2FA entry per user
  }
  
  /**
   * Enables or disables two-factor authentication.
   */
  export async function updateTwoFactorAuth(userId: number, isEnabled: boolean): Promise<TwoFactorAuth> {
	const response = await fetch(`${API_BASE_URL}/twoFactorAuth/${userId}`, {
	  method: 'PATCH',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ isEnabled })
	});
	if (!response.ok) throw new Error('Failed to update two-factor authentication');
	return response.json();
  }
  