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
	firstName: string;
	avatar?: string;
	onlineStatus: string;
	friends: number[];
	matchHistory: MatchHistory[];
	twoFactorEnabled: boolean;
  };
  
  export type FriendRequest = {
	id: number;
	sender: number;
	receiver: number;
  };