import './ChessGame.scss';
import ChessPieces from './Chess_Pieces_Sprite.svg';
import React, { useState } from 'react';
import { ChessBoard } from './ChessBoard';
import { PiecePos, Pos, Sides, mapPieceColor, mapPieceType } from './ChessUiLogic';
import { ChessInstance, Square, ShortMove } from 'chess.js';
import { ChessGameOverReason, ChessGameOver } from './ChessGameOver';

// a normal import statement seems to cause webpack to flip out. I have no idea why, but this works
// see: https://stackoverflow.com/questions/58598457/not-a-constructor-error-with-library-and-angular
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chess = require('chess.js');

function getPieceLocations(chess: ChessInstance, player: Sides): PiecePos[] {
	const board = chess.board();

	const pieceLocations: PiecePos[] = [];

	for (let y = 0; y < 8; ++y) {
		for (let x = 0; x < 8; ++x) {
			const piece = board[y][x];
			if (piece) {
				const pos: Pos = player === Sides.Black ? [7 - x, 7 - y] : [x, y];
				const side = mapPieceColor(piece.color);
				const type = mapPieceType(piece.type);
				pieceLocations.push([[side, type], pos]);
			}
		}
	}

	return pieceLocations;
}

interface Status {
	currentPlayer: Sides;
	isGameOver: boolean;
	isCheck: boolean;
}

function getStatus(chess: ChessInstance): Status {
	return {
		currentPlayer: chess.turn() == 'w' ? Sides.White : Sides.Black,
		isGameOver: chess.game_over(),
		isCheck: chess.in_check(),
	};
}

function getGameOverReason(chess: ChessInstance): ChessGameOverReason | null {
	if (!chess.game_over()) {
		return null;
	}

	if (chess.in_checkmate()) {
		return chess.turn() === 'w' ? ChessGameOverReason.BlackWin : ChessGameOverReason.WhiteWin;
	} else {
		return ChessGameOverReason.Draw;
	}
}

interface PendingMove {
	from: Square;
	to: Square;
}

function needPromotion(chess: ChessInstance, from: Square, to: Square): boolean {
	const moves = chess.moves({ square: from, verbose: true });

	const move = moves.find((move) => move.to === to);
	if (!move) return false;

	return move && move.flags.includes('p');
}

export function ChessGame(): JSX.Element {
	const [chess] = useState<ChessInstance>(new Chess());
	// side should be a prop,... probably
	const [playerSide] = useState<Sides>(Sides.White);
	const [pieceLocations, setPieceLocations] = useState<PiecePos[]>(getPieceLocations(chess, playerSide));
	const [possibleMoves, setPossibleMoves] = useState<Pos[] | null>(null);
	const [history, setHistory] = useState<string[]>(chess.history());
	const [status, setStatus] = useState<Status>(getStatus(chess));
	const [gameOverReason, setGameOverReason] = useState<ChessGameOverReason | null>(null);
	const [errorLastMove, setErrorLastMove] = useState(false);
	const [choosePromotion, setChoosePromotion] = useState<PendingMove | null>(null);

	const posToSAN = (pos: Pos): Square =>
		// 97 -> 'a'
		playerSide === Sides.White
			? ((String.fromCharCode(97 + pos[0]) + (8 - pos[1])) as Square)
			: ((String.fromCharCode(97 + 7 - pos[0]) + (pos[1] + 1)) as Square);

	const posFromSAN = (sq: Square): Pos => {
		const x = sq.charCodeAt(0) - 97; // 97 -> 'a'
		const y = sq.charCodeAt(1) - 48; // 48 -> '0'

		return playerSide === Sides.White ? [x, 8 - y] : [7 - x, y - 1];
	};

	const updateGameState = (moveFailed: boolean): void => {
		setErrorLastMove(moveFailed);
		setPieceLocations(getPieceLocations(chess, playerSide));
		setHistory(chess.history());
		setStatus(getStatus(chess));
		setGameOverReason(getGameOverReason(chess));
		setPossibleMoves(null);
	};

	const onMoveStarted = (pos: Pos): void => {
		// reset our move error state now that the player has started a new move, no need to keep nagging
		setErrorLastMove(false);

		// get possible moves and report them
		const from = posToSAN(pos);
		const moves = chess.moves({ square: from, verbose: true });
		const possibilities = moves.map((move) => posFromSAN(move.to));

		setPossibleMoves(possibilities);
	};

	const onMoveCompleted = (from: Pos, to: Pos): void => {
		const fromSAN = posToSAN(from);
		const toSAN = posToSAN(to);

		if (needPromotion(chess, fromSAN, toSAN)) {
			setChoosePromotion({ from: fromSAN, to: toSAN });
		} else {
			const result = chess.move({ from: fromSAN, to: toSAN });
			updateGameState(result === null);
		}
	};

	const onMoveCancelled = (): void => {
		setPossibleMoves(null);
	};

	const promoteTo = (piece: 'n' | 'b' | 'r' | 'q'): void => {
		const result = chess.move({ ...choosePromotion, promotion: piece } as ShortMove);

		setChoosePromotion(null);
		updateGameState(result === null);
	};

	return (
		<div className="chessgame-container">
			{choosePromotion && (
				<div className="overlay">
					<section className="chessboard-promotion">
						<header>Choose Promotion</header>
						<div onClick={(): void => promoteTo('q')}>
							{playerSide === Sides.White ? (
								<img className="chessgame-piece-img white-queen" src={ChessPieces} alt="queen" />
							) : (
								<img className="chessgame-piece-img black-queen" src={ChessPieces} alt="queen" />
							)}
							<p>Queen</p>
						</div>
						<div onClick={(): void => promoteTo('r')}>
							{playerSide === Sides.White ? (
								<img className="chessgame-piece-img white-rook" src={ChessPieces} alt="rook" />
							) : (
								<img className="chessgame-piece-img black-rook" src={ChessPieces} alt="rook" />
							)}
							<p>Rook</p>
						</div>
						<div onClick={(): void => promoteTo('b')}>
							{playerSide === Sides.White ? (
								<img className="chessgame-piece-img white-bishop" src={ChessPieces} alt="bishop" />
							) : (
								<img className="chessgame-piece-img black-bishop" src={ChessPieces} alt="bishop" />
							)}
							<p>Bishop</p>
						</div>
						<div onClick={(): void => promoteTo('n')}>
							{playerSide === Sides.White ? (
								<img className="chessgame-piece-img white-knight" src={ChessPieces} alt="knight" />
							) : (
								<img className="chessgame-piece-img black-knight" src={ChessPieces} alt="knight" />
							)}
							<p>Knight</p>
						</div>
					</section>
				</div>
			)}
			<section className="chessgame-board">
				<ChessBoard
					pieceLocations={pieceLocations}
					possibleMoves={possibleMoves}
					onMoveStarted={onMoveStarted}
					onMoveCompleted={onMoveCompleted}
					onMoveCancelled={onMoveCancelled}
				></ChessBoard>
			</section>
			<section className="chessgame-info">
				<header>Status</header>
				<section className="chessgame-state">
					{status.isGameOver && (
						<ChessGameOver
							reason={gameOverReason! /* eslint-disable-line @typescript-eslint/no-non-null-assertion */}
						></ChessGameOver>
					)}
					{!status.isGameOver && (
						<section>
							{status.currentPlayer === Sides.Black && (
								<p>
									<img
										className="chessgame-piece-img black-king"
										src={ChessPieces}
										alt="black king piece"
									/>
									Black to move
								</p>
							)}
							{status.currentPlayer === Sides.White && (
								<p>
									<img
										className="chessgame-piece-img white-king"
										src={ChessPieces}
										alt="white king piece"
									/>
									White to move
								</p>
							)}
							{status.isCheck && <p className="chessgame-check">Check</p>}
							{errorLastMove && <p className="chessgame-invalid-move">Invalid Move!</p>}
						</section>
					)}
				</section>
				<header>Move History</header>
				<section className="chessgame-history">
					<ol className="content">
						{history.map((move, index) => (
							<li key={index}>{move}</li>
						))}
					</ol>
				</section>
			</section>
		</div>
	);
}
