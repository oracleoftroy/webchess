import { Server } from 'ws';
import { IncomingMessage } from 'http';
import http from 'http';
import https from 'https';
import { log } from '../logger';
import { Channel } from './channel';
import { Request, SendChatRequest, UserInfoRequest, GameRequest } from './protocol';
import { Client } from './client';
import { Dispatcher } from './dispatcher';
import { ChessServer } from './chessServer';

export class WsServer implements Dispatcher {
	private wsServer: Server;
	private channel: Channel = new Channel('global');
	private chessServer: ChessServer = new ChessServer();

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
		if (!this.validate(client, request)) return;

		switch (request.type) {
			case 'chat':
				this.chatMessage(client, request as SendChatRequest);
				break;
			case 'join-game':
			case 'move':
			case 'observe-game':
			case 'unobserve-game':
				this.chessServer.onRequest(client, request as GameRequest);
				break;
			case 'user-info':
				this.userCredentials(client, request as UserInfoRequest);
				break;
		}
	}

	onDisconnect(client: Client): void {
		// TODO: close any games, etc the client is in
		this.channel.removeClient(client);
		this.chessServer.removeClient(client);
	}

	private onWebsockedConnected(ws: WebSocket): void {
		new Client(ws, this);
	}

	// Client must set user-info before any other requests are accepted
	validate(client: Client, req: Request): boolean {
		if (!client.valid && req.type !== 'user-info') {
			client.send({ type: 'error', req: req.type, msg: 'Unauthorized' });
			return false;
		}

		return true;
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
}
