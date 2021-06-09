import './ChessUi.scss';
import ChessPieces from './Chess_Pieces_Sprite.svg';
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { ChessBoard } from './ChessBoard';
import { PiecePos, Pos, Sides, mapPieceColor, mapPieceType, Pieces } from './ChessUiLogic';
import { ChessInstance, Square, PieceType } from 'chess.js';
import { ChessGameOverReason, ChessGameOver } from './ChessGameOver';
import { ChessPieceImg } from './ChessPieceImg';
import { MoveResponse } from './protocol';

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
		currentPlayer: chess.turn() === 'w' ? Sides.White : Sides.Black,
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

enum ValidationResult {
	Invalid,
	Valid,
	NeedsPromotion,
}

function moveToSAN(
	chess: ChessInstance,
	from: Square,
	to: Square,
	promotion?: Exclude<PieceType, 'p'>,
): [ValidationResult.Valid, string] | [ValidationResult] {
	const moves = chess.moves({ square: from, verbose: true });

	console.log('moves:', moves);

	const move = moves.filter((move) => move.to === to && (promotion === undefined || move.promotion === promotion));
	if (move.length === 1) {
		// We found 1 result because there was no possible promotion or we selected a promotion already
		return [ValidationResult.Valid, move[0].san];
	} else if (move.length > 1) {
		// We found many results because we need to promote but we haven't selected a piece
		return [ValidationResult.NeedsPromotion];
	} else {
		return [ValidationResult.Invalid];
	}
}

interface ChessUiProps {
	whitePlayerName: string;
	blackPlayerName: string;
	playerSide: Sides;

	onMoveRequested: (num: number, san: string) => void;
}

export interface ChessUiRef {
	move(move: MoveResponse): boolean;
}

export const ChessUi = forwardRef<ChessUiRef, ChessUiProps>(
	({ whitePlayerName, blackPlayerName, playerSide, onMoveRequested }: ChessUiProps, ref): JSX.Element => {
		const [chess] = useState<ChessInstance>(() => new Chess());
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

		// TODO: make moveFailed an enum... updateGameState(false) is nonsense
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

		useImperativeHandle(ref, () => ({
			move(move: MoveResponse): boolean {
				if (move.moveNum !== chess.history().length + 1) {
					return false;
				}
				const result = chess.move(move.move) !== null;
				updateGameState(result === null);
				return result !== null;
			},
		}));

		const onMoveCompleted = (from: Pos, to: Pos): void => {
			const fromSAN = posToSAN(from);
			const toSAN = posToSAN(to);

			const [result, san] = moveToSAN(chess, fromSAN, toSAN);
			if (result === ValidationResult.NeedsPromotion) {
				setChoosePromotion({ from: fromSAN, to: toSAN });
			} else if (result === ValidationResult.Valid) {
				onMoveRequested(chess.history().length + 1, san!);
				updateGameState(false);
			} else {
				updateGameState(true);
			}
		};

		const onMoveCancelled = (): void => {
			setPossibleMoves(null);
		};

		type PromotablePiece = Pieces.Queen | Pieces.Rook | Pieces.Bishop | Pieces.Knight;
		const promotablePieces: PromotablePiece[] = [Pieces.Queen, Pieces.Rook, Pieces.Bishop, Pieces.Knight];

		const promoteTo = (piece: PromotablePiece): void => {
			if (!choosePromotion) {
				return;
			}

			let p: null | 'n' | 'b' | 'r' | 'q' = null;

			p = piece === Pieces.Queen ? 'q' : piece === Pieces.Rook ? 'r' : piece === Pieces.Bishop ? 'b' : 'n';

			// Edge doesn't currently understand { ...choosePromotion, promotion: piece }, which breaks dev
			// const result = chess.move({
			// 	from: choosePromotion?.from,
			// 	to: choosePromotion?.to,
			// 	promotion: p,
			// } as ShortMove);

			const [result, san] = moveToSAN(chess, choosePromotion.from, choosePromotion.to, p);
			if (result === ValidationResult.Valid) {
				onMoveRequested(chess.history().length + 1, san!);
				updateGameState(false);
			} else updateGameState(true);

			setChoosePromotion(null);
		};

		return (
			<div className="chessgame-container">
				{choosePromotion && (
					<div className="overlay">
						<section className="chessboard-promotion">
							<header>
								<p>Choose Promotion</p>
							</header>
							{promotablePieces.map((piece) => (
								<div key={piece} onClick={(): void => promoteTo(piece)} role="button">
									<div className="chessboard-promotion-piece">
										<ChessPieceImg color={playerSide} piece={piece} />
									</div>
									<p>{Pieces[piece]}</p>
								</div>
							))}
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
						{/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
						{status.isGameOver && <ChessGameOver reason={gameOverReason!}></ChessGameOver>}
						{!status.isGameOver && (
							<section>
								{status.currentPlayer === Sides.Black && (
									<p>
										<img
											className="chessgame-piece-img black-king"
											src={ChessPieces}
											alt="black king piece"
										/>
										{blackPlayerName} to move
									</p>
								)}
								{status.currentPlayer === Sides.White && (
									<p>
										<img
											className="chessgame-piece-img white-king"
											src={ChessPieces}
											alt="white king piece"
										/>
										{whitePlayerName} to move
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
	},
);
