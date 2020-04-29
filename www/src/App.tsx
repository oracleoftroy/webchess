import './App.scss';
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { ChessGame } from './ChessGame';
import { Request, Response, ChatResponse } from './protocol';
import { Chat } from './Chat';

function msg(handler: (res: Response) => any): typeof ws.onmessage {
	return (e: MessageEvent) => {
		handler(JSON.parse(e.data) as Response);
	};
}

const createWebSocket = (setup: (ws: WebSocket) => void): WebSocket => {
	const uri = process.env.REACT_APP_WSS_BASE_URI || window.location.href.replace(/http/, 'ws');
	const ws = new WebSocket(uri);

	setup(ws);

	// ws.onerror = (e) => {
	// 	console.error(`WebSocket error: ${e}`);
	// 	setTimeout(createWebSocket, 10000);
	// };

	return ws;
};

interface User {
	id: string | null;
	name: string;
}

// TODO: Have some sort of visual overlay when websocket is not open (connecting, closed, error)
function App(): JSX.Element {
	//	const [state, setState] = useState('disconnected' as ClientState);
	const [user, setUser] = useState<User | null>(null);
	const [chat, setChat] = useState([] as ChatResponse[]);

	const [ws, setWs] = useState(() => {
		const setup = (ws: WebSocket): void => {
			ws.onclose = () => {
				// TODO: should clear chat log or at least display that you have an error...?
				console.error(`WebSocket closed, reconnecting...`);
				setTimeout(() => setWs(createWebSocket(setup)), 5000);
			};

			ws.onmessage = msg((res: Response) => {
				switch (res.type) {
					case 'error':
						console.error(`Received error of type '${res.type}': ${res.msg}`);

						// for errors setting user-info, clear our cached information and
						// set the user to null to force the user to sign in again
						if (res.req === 'user-info') {
							localStorage.removeItem('username');
							localStorage.removeItem('userid');
							setUser(null);
						}
						break;
					case 'user-info':
						setUser((user) => {
							if (user && user.name === res.username && user.id === res.id) {
								return user;
							} else {
								return { name: res.username, id: res.id };
							}
						});
						break;
					case 'chat':
					case 'chat-join':
					case 'chat-leave':
						setChat((c) => [...c, res]);
						break;
				}
			});
		};

		return createWebSocket(setup);
	});

	const sendRequest = useCallback(
		(req: Request): void => {
			ws.send(JSON.stringify(req));
		},
		[ws],
	);

	useEffect(() => {
		// We don't yet have a user, check if we have one stored in local storage, and
		// if so, sent that to the server
		if (!user) {
			const name = localStorage.getItem('username');
			const id = localStorage.getItem('userid');

			if (name) {
				sendRequest({ type: 'user-info', username: name, id: id || undefined });
			}
		} else if (user) {
			// user set by response from server, cache in local storage
			console.log('running user effect');
			localStorage.setItem('username', user.name);
			if (user.id) localStorage.setItem('userid', user.id);
			else localStorage.removeItem('userid');
		}
	}, [user, sendRequest]);

	const onSignIn = (event: FormEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLFormElement;
		const data = new FormData(target);
		target.reset();

		const username = data.get('username') as string | null;
		if (username) {
			sendRequest({ type: 'user-info', username: username });
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
