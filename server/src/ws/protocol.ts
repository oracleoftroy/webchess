export interface UserInfoRequest {
	type: 'user-info';
	username: string;
	id?: string;
}

export interface SendChatRequest {
	type: 'chat';
	channel: string;
	msg: string;
}

export interface JoinGameRequest {
	type: 'join-game';
}

export interface ObserveGameRequest {
	type: 'observe-game';
	gameId: string;
}

export interface UnobserveGameRequest {
	type: 'unobserve-game';
	gameId: string;
}

export interface MoveRequest {
	type: 'move';
	gameId: string;
	token: string;
	moveNum: number;
	move: string;
}

export type GameRequest = JoinGameRequest | MoveRequest | ObserveGameRequest | UnobserveGameRequest;
export type Request = UserInfoRequest | SendChatRequest | GameRequest;

export interface ErrorResponse {
	type: 'error';
	msg: string;

	// the request type that triggered this error, or nothing if a general error
	req?: Request['type'];
}

export interface UserInfoResponse {
	type: 'user-info';
	username: string;
	id: string;
}

export interface FindGameResponse {
	type: 'finding-game';
}

export interface JoinGameResponse {
	type: 'join-game';
	gameId: string;
	token: string;
	side: 'w' | 'b';
	opponent: string;
	opponentid: string;
}

export interface ObserveGameResponse {
	type: 'observe-game';
	gameId: string;
	history: string[];
}

export interface JoinChatResponse {
	type: 'chat-join';
	channel: string;
	username: string;
	userid: string;
}

export interface LeaveChatResponse {
	type: 'chat-leave';
	channel: string;
	username: string;
	userid: string;
}

export interface ReceiveChatResponse {
	type: 'chat';
	channel: string;
	username: string;
	userid: string;
	msg: string;
}

export interface MoveResponse {
	type: 'move';
	gameId: string;
	moveNum: number;
	move: string;
}

export type ChatResponse = JoinChatResponse | LeaveChatResponse | ReceiveChatResponse;
export type GameResponse = FindGameResponse | JoinGameResponse | ObserveGameResponse | MoveResponse;
export type Response = ErrorResponse | UserInfoResponse | ChatResponse | GameResponse;
