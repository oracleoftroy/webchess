import { Client } from './client';
import { SendChatRequest, ChatResponse } from './protocol';

export class Channel {
	constructor(private name: string, private clients = new Map<string, Client>()) {}

	addClient(client: Client): void {
		if (client.username && client.id) {
			this.clients.set(client.id, client);
			this.sendToAll({ type: 'chat-join', channel: this.name, username: client.username, userid: client.id });
		}
	}

	removeClient(client: Client): void {
		if (client.username && client.id) {
			this.sendToAll({ type: 'chat-leave', channel: this.name, username: client.username, userid: client.id });
			this.clients.delete(client.id);
		}
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
		for (const client of this.clients.values()) {
			if (!client.username) continue;
			client.send(response);
		}
	}
}
