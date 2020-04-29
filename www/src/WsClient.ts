import { Request, Response } from './protocol';

export class WsClient {
	private static $uri = process.env.REACT_APP_WSS_BASE_URI || window.location.href.replace(/http/, 'ws');
	private $ws: WebSocket;
	private $pendingMessages: Request[] = [];

	constructor() {
		this.$ws = this.createWs();
	}

	public send(req: Request) {
		if (this.$ws.readyState !== WebSocket.OPEN) {
			this.$pendingMessages = [...this.$pendingMessages, req];
		} else {
			this.$ws.send(JSON.stringify(req));
		}
	}

	// user callbacks
	$onReset: (() => any) | null = null;
	public set onReset(value: () => any) {
		this.$onReset = value;
	}

	private reset() {
		if (this.$onReset) this.$onReset();
	}

	$onResponse: ((res: Response) => any) | null = null;
	public set onResponse(value: (res: Response) => any) {
		this.$onResponse = value;
	}

	private response(res: Response): void {
		if (this.$onResponse) this.$onResponse(res);
	}

	private createWs(): WebSocket {
		const ws = new WebSocket(WsClient.$uri);
		ws.onopen = () => this.open();
		ws.onclose = () => {
			this.reset();
			console.error(`WebSocket closed, reconnecting...`);
			setTimeout(() => (this.$ws = this.createWs()), 5000);
		};
		ws.onmessage = (e: MessageEvent) => {
			this.response(JSON.parse(e.data) as Response);
		};
		return ws;
	}

	// callback for websocket onopen
	private open() {
		for (let req of this.$pendingMessages) {
			this.send(req);
		}
		this.$pendingMessages = [];
	}
}
