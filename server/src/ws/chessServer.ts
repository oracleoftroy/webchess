import { v4 as uuid } from 'uuid';
import { GameRequest, MoveRequest, ObserveGameRequest, UnobserveGameRequest, MoveResponse } from './protocol';
import { Client } from './client';
import { Chess } from 'chess.js';

interface PlayerData {
	client: Client;
	connected: boolean;
	token: string;
	side: 'w' | 'b';
}

// TODO: make separate file
class ChessGame {
	private gameid: string;
	private players: [PlayerData, PlayerData];
	private game = new Chess();
	private observers = new Map<string, Client>();

	constructor(client1: Client, client2: Client) {
		this.gameid = uuid();
		this.players = [
			{ client: client1, token: uuid(), side: 'w', connected: true },
			{ client: client2, token: uuid(), side: 'b', connected: true },
		];

		const notify = (
			{ client, token, side }: PlayerData,
			{ username: opponent, userid: opponentid }: Client,
		): void => {
			client.send({ type: 'join-game', gameId: this.gameid, token, side, opponent, opponentid });
		};

		notify(this.players[0], this.players[1].client);
		notify(this.players[1], this.players[0].client);
	}

	get id(): string {
		return this.gameid;
	}

	onRequest(client: Client, req: MoveRequest | ObserveGameRequest | UnobserveGameRequest): void {
		switch (req.type) {
			case 'move':
				this.onMove(client, req);
				break;
			case 'observe-game':
				this.addObserver(client);
				break;
			case 'unobserve-game':
				this.removeObserver(client);
				break;
		}
	}

	// returns true if there are no more players connected to this game
	removeClient(client: Client): boolean {
		this.removeObserver(client);

		for (const player of this.players) {
			if (player.client.userid === client.userid) {
				player.connected = false;
			}
		}

		return !this.players.some((p) => p.connected);
	}

	private getPlayer(side: 'w' | 'b'): PlayerData {
		return side === 'w' ? this.players[0] : this.players[1];
	}

	private onMove(client: Client, req: MoveRequest): void {
		const player = this.getPlayer(this.game.turn());

		// Make sure this is the client who should be making moves
		if (
			player.client.username !== client.username ||
			player.client.userid !== client.userid ||
			this.gameid !== req.gameId ||
			player.token !== req.token
		) {
			client.send({
				type: 'error',
				req: 'move',
				msg: 'Invalid Request',
			});
			return;
		}

		// Verify move number is expected. if it isn't the client is probably out of
		// sync with the game and should request the history.
		// TODO: provide a way to reconnect to a game / request history
		const moveNum = this.game.history().length + 1;
		if (req.moveNum !== moveNum) {
			client.send({
				type: 'error',
				req: 'move',
				msg: 'Sequence Error',
			});
			return;
		}

		// Everything looks good, try making the move
		if (!this.game.move(req.move)) {
			client.send({
				type: 'error',
				req: 'move',
				msg: 'Illegal Move',
			});
			return;
		}

		// Success! Send result to all players and observers
		const res: MoveResponse = {
			type: 'move',
			gameId: this.gameid,
			moveNum: moveNum,
			move: req.move,
		};

		for (const { connected, client } of this.players) {
			if (connected) client.send(res);
		}

		for (const client of this.observers.values()) {
			client.send(res);
		}
	}

	private addObserver(client: Client): void {
		client.send({ type: 'observe-game', gameId: this.gameid, history: this.game.history() });
		this.observers.set(client.userid, client);
	}

	private removeObserver(client: Client): void {
		this.observers.delete(client.userid);
	}
}

export class ChessServer {
	private pendingClients: Client[] = [];
	private activeGames = new Map<string, ChessGame>();

	public onRequest(client: Client, req: GameRequest): void {
		switch (req.type) {
			case 'join-game':
				this.pendingClients.push(client);
				setTimeout(this.tryMatchPlayers.bind(this), 1);
				client.send({ type: 'finding-game' });
				break;

			case 'move':
			case 'observe-game':
			case 'unobserve-game':
				const game = this.activeGames.get(req.gameId);
				if (!game) {
					client.send({ type: 'error', req: req.type, msg: "Game doesn't exist" });
					return;
				}

				game.onRequest(client, req);
				break;
		}
	}

	removeClient(client: Client): void {
		const pendingIndex = this.pendingClients.findIndex((c) => c.userid === client.userid);
		if (pendingIndex >= 0) {
			this.pendingClients.splice(pendingIndex, 1);
		}

		const idsToRemove = [];
		for (const [id, game] of this.activeGames.entries()) {
			if (game.removeClient(client)) {
				idsToRemove.push(id);
			}
		}

		for (const id of idsToRemove) {
			this.activeGames.delete(id);
		}
	}

	private tryMatchPlayers(): void {
		if (this.pendingClients.length < 2) return;

		while (this.pendingClients.length >= 2) {
			const [c1] = this.pendingClients.splice(Math.floor(Math.random() * this.pendingClients.length), 1);
			const [c2] = this.pendingClients.splice(Math.floor(Math.random() * this.pendingClients.length), 1);
			const game = new ChessGame(c1, c2);
			this.activeGames.set(game.id, game);
		}
	}
}
