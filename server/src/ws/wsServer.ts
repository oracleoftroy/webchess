import { Server } from 'ws';
import { IncomingMessage } from 'http';
import http from 'http';
import https from 'https';
import { log } from '../logger';
import { Channel } from './channel';
import {
	Request,
	SendChatRequest,
	JoinGameRequest,
	MoveRequest,
	ObserveGameRequest,
	UserInfoRequest,
} from './protocol';
import { Client } from './client';
import { Dispatcher } from './dispatcher';

export class WsServer implements Dispatcher {
	private wsServer: Server;
	private channel: Channel = new Channel('global');

	constructor(server: http.Server | https.Server) {
		this.wsServer = new Server({ server: server });
		this.wsServer.on('connection', (ws: WebSocket, req: IncomingMessage) => {
			const ip = req.socket.remoteAddress;
			log.info(`New ws client: ${ip}`);
			this.onWebsockedConnected(ws);
		});

		this.wsServer.on('error', (err: Error) => {
			log.error(`ws error: ${err.message}`, err);
		});
		// this.wsServer.on('close', () => {});
		// this.wsServer.on('listening', () => {});
		// this.wsServer.on('headers', (headers: string[], request: IncomingMessage) => {});
	}

	onRequest(client: Client, request: Request): void {
		switch (request.type) {
			case 'chat':
				this.chatMessage(client, request as SendChatRequest);
				break;
			case 'join-game':
				this.joinGame(client, request as JoinGameRequest);
				break;
			case 'move':
				this.move(client, request as MoveRequest);
				break;
			case 'observe-game':
				this.observeGame(client, request as ObserveGameRequest);
				break;
			case 'user-info':
				this.userCredentials(client, request as UserInfoRequest);
				break;
		}
	}

	onDisconnect(client: Client): void {
		// TODO: close any games, etc the client is in
		this.channel.removeClient(client);
	}

	private onWebsockedConnected(ws: WebSocket): void {
		new Client(ws, this);
	}

	userCredentials(client: Client, request: UserInfoRequest): void {
		// TODO: login / validate, etc
		client.onUserInfo(request);

		// Now that this client has user info, register them in the global chat
		this.channel.addClient(client);
	}

	chatMessage(client: Client, request: SendChatRequest): void {
		if (request.channel === 'global') {
			this.channel.onChat(client, request);
		}
	}

	joinGame(client: Client, request: JoinGameRequest): void {
		throw new Error('Method not implemented.');
	}

	move(client: Client, request: MoveRequest): void {
		throw new Error('Method not implemented.');
	}

	observeGame(client: Client, request: ObserveGameRequest): void {
		throw new Error('Method not implemented.');
	}
}
