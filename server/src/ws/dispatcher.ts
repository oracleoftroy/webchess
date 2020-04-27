import { Request } from './protocol';
import { Client } from './client';

export interface Dispatcher {
	onRequest(client: Client, request: Request): void;
	onDisconnect(client: Client): void;

	// TODO: Consider adding this
	// onError(client: Client, error: Error): void;
}
