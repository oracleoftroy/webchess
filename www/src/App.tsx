import './App.scss';
import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { ChessUi, ChessUiRef } from './ChessUi';
import { Response, ChatResponse, MoveRequest, MoveResponse } from './protocol';
import { Chat } from './Chat';
import { WsClient } from './WsClient';
import { SignIn } from './SignIn';
import { BusyIndicator } from './BusyIndicator';
import { Sides } from './ChessUiLogic';

interface User {
	id: string | null;
	name: string;
}

interface LobbyState {
	mode: 'lobby';
}
const lobbyState: LobbyState = { mode: 'lobby' };

interface LookingForGameState {
	mode: 'looking-for-game';
}
const lookingForGameState: LookingForGameState = { mode: 'looking-for-game' };

interface InGameState {
	mode: 'in-game';
	gameid: string;
	playerToken: string;
	playerSide: 'w' | 'b';
	opponent: string;
	opponentid: string;
}

interface ObservingGameState {
	mode: 'observing-game';
	gameid: string;
}

type GameState = LobbyState | LookingForGameState | InGameState | ObservingGameState;

interface ChessGameProps {
	playerName: string;
	gameState: GameState;
	onLookForGame: () => void;
	onMoveRequested: (move: MoveRequest) => void;
}

const ChessGame = forwardRef<ChessUiRef, ChessGameProps>(
	({ playerName, gameState, onLookForGame, onMoveRequested }: ChessGameProps, ref): JSX.Element => {
		const lookForGame = (event: React.MouseEvent<HTMLButtonElement>): void => {
			event.preventDefault();
			onLookForGame();
		};

		if (gameState === lobbyState) {
			return (
				<section>
					<button className="button" onClick={lookForGame}>
						Look for game
					</button>
				</section>
			);
		} else if (gameState === lookingForGameState) {
			return (
				<div>
					<p>Looking for game</p>
					<BusyIndicator />
				</div>
			);
		} else if (gameState.mode === 'in-game') {
			const playerSide = gameState.playerSide === 'w' ? Sides.White : Sides.Black;
			const blackPlayerName = playerSide === Sides.Black ? playerName : gameState.opponent;
			const whitePlayerName = playerSide === Sides.White ? playerName : gameState.opponent;

			const chessRef = useRef<ChessUiRef>(null);

			useImperativeHandle(ref, () => ({
				move(move: MoveResponse): boolean {
					console.log(`move: ${move}`);
					if (chessRef.current === null || move.gameId !== gameState.gameid) {
						return false;
					}
					return chessRef.current.move(move);
				},
			}));

			const moveRequested = (num: number, san: string): void => {
				onMoveRequested({
					type: 'move',
					gameId: gameState.gameid,
					token: gameState.playerToken,
					moveNum: num,
					move: san,
				});
			};

			return (
				<ChessUi
					ref={chessRef}
					playerSide={playerSide}
					blackPlayerName={blackPlayerName}
					whitePlayerName={whitePlayerName}
					onMoveRequested={moveRequested}
				/>
			);
		} else {
			return <div />;
		}
	},
);

// TODO: Have some sort of visual overlay when websocket is not open (connecting, closed, error)
function App(): JSX.Element {
	//	const [state, setState] = useState('disconnected' as ClientState);
	const [user, setUser] = useState<User | null>(null);
	const [chat, setChat] = useState([] as ChatResponse[]);
	const [gameState, setGameState] = useState<GameState>(lobbyState);
	//const [gameState, setGameState] = useState<GameState>(lookingForGameState);
	const chessGameRef = useRef<ChessUiRef>(null);

	const [client] = useState(() => {
		console.debug('Creating Client');
		const client = new WsClient();

		client.onReset = () => setUser(null);
		client.onResponse = (res: Response) => {
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

				case 'finding-game':
					setGameState(lookingForGameState);
					break;
				case 'join-game':
					setGameState({
						mode: 'in-game',
						gameid: res.gameId,
						playerSide: res.side,
						playerToken: res.token,
						opponent: res.opponent,
						opponentid: res.opponentid,
					});
					break;

				case 'move':
					console.log('Got move');
					if (chessGameRef.current) {
						console.log('chessGameRef is good');
						const result = chessGameRef.current.move(res);
						console.log(`Move succeeded?: ${result}`);
					}
					break;
			}
		};

		return client;
	});

	useEffect(() => {
		// We don't yet have a user, check if we have one stored in local storage, and
		// if so, sent that to the server
		if (!user) {
			const name = localStorage.getItem('username');
			const id = localStorage.getItem('userid');

			if (name) {
				client.send({ type: 'user-info', username: name, id: id || undefined });
			}
		} else if (user) {
			// user set by response from server, cache in local storage
			localStorage.setItem('username', user.name);
			if (user.id) localStorage.setItem('userid', user.id);
			else localStorage.removeItem('userid');
		}
	}, [user, client]);

	const onSignIn = (username: string) => {
		client.send({ type: 'user-info', username: username });
	};

	const lookForGame = (): void => {
		client.send({ type: 'join-game' });
	};

	const moveRequested = (move: MoveRequest): void => {
		client.send(move);
	};

	return (
		<div className="app">
			<header>
				<h1>Chess</h1>
			</header>
			<main>
				{(user === null && <SignIn onSignIn={onSignIn} />) || (
					<section className="content">
						<Chat channel="global" messages={chat} onSendChatRequest={client.send.bind(client)} />
						<ChessGame
							ref={chessGameRef}
							playerName={user?.name!}
							gameState={gameState}
							onLookForGame={lookForGame}
							onMoveRequested={moveRequested}
						/>
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
