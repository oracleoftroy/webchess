import { Client } from './client';
import { SendChatRequest, ChatResponse } from './protocol';

export class Channel {
	constructor(private name: string, private clients: Client[] = []) {}

	addClient(client: Client): void {
		if (client.username && client.id) {
			this.clients.push(client);
			this.sendToAll({ type: 'chat-join', channel: this.name, username: client.username, userid: client.id });
		}
	}

	removeClient(client: Client): void {
		if (client.username && client.id) {
			this.sendToAll({ type: 'chat-leave', channel: this.name, username: client.username, userid: client.id });
		}

		const index = this.clients.indexOf(client);
		if (index >= 0) this.clients.splice(index, 1);
	}

	onChat(sender: Client, request: SendChatRequest): void {
		if (sender.username && sender.id) {
			this.sendToAll({
				type: 'chat',
				channel: this.name,
				username: sender.username,
				userid: sender.id,
				msg: request.msg,
			});
		}
	}

	private sendToAll(response: ChatResponse): void {
		for (const client of this.clients) {
			if (!client.username) continue;
			client.send(response);
		}
	}
}
