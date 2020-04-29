import { Response, Request, UserInfoRequest, UserInfoResponse } from './protocol';
import { Dispatcher } from './dispatcher';
import { log } from '../logger';
import { v4 as uuid } from 'uuid';

export class Client {
	private $username?: string;
	private $id?: string;

	constructor(private client: WebSocket, private dispatcher: Dispatcher) {
		// setup ping?

		client.onmessage = (e: MessageEvent): void => {
			log.warn(`Message recieved: ${e.data}`);

			try {
				const json = JSON.parse(e.data);
				this.dispatcher.onRequest(this, json as Request);
			} catch (e) {
				log.error(`Error parsing client message: ${e}`);
				this.send({ type: 'error', msg: e.message });
			}
		};
	}

	send(response: Response): void {
		this.client.send(JSON.stringify(response));
	}

	onUserInfo(info: UserInfoRequest): void {
		if (this.username !== info.username || this.id !== info.id) {
			this.$username = info.username;
			if (!this.id) {
				this.$id = info.id || uuid();
			}
			this.$id = info.id || this.$id || uuid();
			this.send({ type: 'user-info', username: this.username, id: this.id } as UserInfoResponse);
		}
	}

	get username(): string | undefined {
		return this.$username;
	}

	get id(): string | undefined {
		return this.$id;
	}
}
