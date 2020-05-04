import { Response, Request, UserInfoRequest, UserInfoResponse } from './protocol';
import { Dispatcher } from './dispatcher';
import { log } from '../logger';
import { v4 as uuid } from 'uuid';

export class Client {
	private name?: string;
	private id?: string;

	constructor(private client: WebSocket, private dispatcher: Dispatcher) {
		// setup ping?

		client.onclose = (e: CloseEvent): void => {
			log.info(`Connection closed: ${e.reason}`);
			dispatcher.onDisconnect(this);
		};

		client.onmessage = (e: MessageEvent): void => {
			log.info(`Message received: ${e.data}`);

			try {
				const json = JSON.parse(e.data);
				this.dispatcher.onRequest(this, json as Request);
			} catch (e) {
				log.error(`Error parsing client message: {e}`);
				this.send({ type: 'error', msg: e.message });
			}
		};
	}

	send(response: Response): void {
		this.client.send(JSON.stringify(response));
	}

	onUserInfo(info: UserInfoRequest): void {
		if (this.username !== info.username || this.userid !== info.id) {
			this.name = info.username;
			if (!this.userid) {
				this.id = info.id || uuid();
			}
			this.id = info.id || this.id || uuid();
			this.send({ type: 'user-info', username: this.username, id: this.userid } as UserInfoResponse);
		}
	}

	get valid(): boolean {
		return !!this.name && !!this.id;
	}

	get username(): string {
		return this.name || '';
	}

	get userid(): string {
		return this.id || '';
	}
}
