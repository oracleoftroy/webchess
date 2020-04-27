import './App.scss';
import React, { useState, useEffect, FormEvent } from 'react';
import { ChessGame } from './ChessGame';
import { Request, Response, ChatResponse } from './protocol';
import { Chat } from './Chat';

function createWebSocket(): WebSocket {
	const uri = process.env.REACT_APP_WSS_BASE_URI || window.location.href.replace(/http/, 'ws');
	const ws = new WebSocket(uri);

	ws.onclose = () => {
		console.error(`WebSocket closed, reconnecting...`);
		setTimeout(createWebSocket, 5000);
	};
	ws.onerror = (e) => {
		console.error(`WebSocket error: ${e}`);
		setTimeout(createWebSocket, 5000);
	};

	return ws;
}

function msg(handler: (res: Response) => any): typeof ws.onmessage {
	return (e: MessageEvent) => {
		handler(JSON.parse(e.data) as Response);
	};
}

let ws = createWebSocket();

function sendRequest(req: Request): void {
	ws.send(JSON.stringify(req));
}

interface User {
	id: string | null;
	name: string;
}

// TODO: Have some sort of visual overlay when websocket is not open (connecting, closed, error)
function App(): JSX.Element {
	//	const [state, setState] = useState('disconnected' as ClientState);
	const [user, setUser] = useState((): User | null => {
		const name = localStorage.getItem('username');
		const id = localStorage.getItem('userid');
		return name ? { name: name, id: id } : null;
	});

	useEffect(() => {
		if (user) {
			console.log('running user effect');
			sendRequest({ type: 'user-info', username: user.name, id: user.id });
			localStorage.setItem('username', user.name);
			if (user.id) localStorage.setItem('userid', user.id);
			else localStorage.removeItem('userid');
		}
	}, [user]);

	const [chat, setChat] = useState([] as ChatResponse[]);

	useEffect(() => {
		ws.onmessage = msg((res: Response) => {
			switch (res.type) {
				case 'error':
					console.error(`Recieved error of type '${res.type}': ${res.msg}`);

					if (res.req === 'user-info') {
						setUser(null);
					}
					break;
				case 'user-info':
					setUser((user) => {
						if (user && user.name === res.username && user.id === res.id) return user;
						else return { name: res.username, id: res.id };
					});
					break;
				case 'chat':
				case 'chat-join':
				case 'chat-leave':
					setChat((c) => [...c, res]);
					break;
			}
		});
	}, []);

	const onSignIn = (event: FormEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLFormElement;
		const data = new FormData(target);
		target.reset();

		const username = data.get('username') as string | null;
		console.log(`username: ${username}`);

		if (username) {
			setUser({ name: username });
			localStorage.setItem('username', username);
		}
	};

	return (
		<div className="app">
			<header>
				<h1>Chess</h1>
			</header>
			<main>
				{(user === null && (
					<div>
						<section>
							<header>Please sign in</header>
							<form onSubmit={onSignIn}>
								<label htmlFor="username">Display name: </label>
								<input name="username" type="text" required placeholder="Your name"></input>
								<input type="submit" value="Sign in"></input>
							</form>
						</section>
					</div>
				)) || (
					<section>
						<Chat channel="global" messages={chat} onSendChatRequest={sendRequest}></Chat>
						<ChessGame></ChessGame>
					</section>
				)}
			</main>
			<footer>
				<p>&copy;Marc Gallagher 2020 - All Rights Reserved</p>
				<p>
					Chess pieces by Cburnett used under the terms of{' '}
					<a href="https://creativecommons.org/licenses/by-sa/3.0/legalcode">CC BY-SA 3.0</a>
				</p>
			</footer>
		</div>
	);
}

export default App;
