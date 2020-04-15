import './ChessBoard.scss';
import React, { useState, useEffect, MouseEvent, DragEvent, useCallback } from 'react';
import piecesSpriteSrc from './Chess_Pieces_Sprite.svg';
import { Pos, Piece, PiecePos, pieceAtPos, equals } from './ChessUiLogic';

const PIECE_SPRITE_WIDTH = 45;
const PIECE_SPRITE_HEIGHT = 45;

const WIDTH = 640;
const HEIGHT = 640;

const SQUARE_WIDTH = WIDTH / 8;
const SQUARE_HEIGHT = HEIGHT / 8;

interface ChessBoardProps {
	pieceLocations: PiecePos[];
	possibleMoves: Pos[] | null;

	onMoveStarted(pos: Pos): void;
	onMoveCompleted(start: Pos, end: Pos): void;
	onMoveCancelled(pos: Pos): void;
}

export function ChessBoard({
	pieceLocations,
	possibleMoves,
	onMoveStarted,
	onMoveCompleted,
	onMoveCancelled,
}: ChessBoardProps): JSX.Element {
	const chessBoardRef = React.createRef<HTMLCanvasElement>();
	const chessPiecesRef = React.createRef<HTMLCanvasElement>();
	const chessUiRef = React.createRef<HTMLCanvasElement>();
	const offscreenRef = React.createRef<HTMLCanvasElement>();

	const [mouseBoardPos, setMouseBoardPos] = useState<Pos | null>(null);
	const [dragStartBoardPos, setDragStartBoardPos] = useState<Pos | null>(null);
	const [piecesSpriteReady, setPiecesSpriteReady] = useState(false);
	const [pieceDragImages, setPieceDragImages] = useState<HTMLImageElement[][] | null>(null);
	const [piecesSprite] = useState<HTMLImageElement>(() => {
		const img = new Image();
		img.onload = (): void => setPiecesSpriteReady(true);
		img.src = piecesSpriteSrc;
		return img;
	});

	const fromBoardPos = (pos: Pos): Pos => [pos[0] * SQUARE_WIDTH, pos[1] * SQUARE_HEIGHT];
	const toBoardPos = (pos: Pos): Pos => [Math.floor(pos[0] / SQUARE_WIDTH), Math.floor(pos[1] / SQUARE_HEIGHT)];
	const posOnBoard = (pos: Pos): boolean => pos[0] >= 0 && pos[0] < 8 && pos[1] >= 0 && pos[1] < 8;

	const drawPiece = useCallback(
		(context: CanvasRenderingContext2D, piece: Piece, pos: Pos): void => {
			if (!piecesSpriteReady) return;

			context.drawImage(
				piecesSprite,
				piece[1] * PIECE_SPRITE_WIDTH,
				piece[0] * PIECE_SPRITE_HEIGHT,
				PIECE_SPRITE_WIDTH,
				PIECE_SPRITE_HEIGHT,
				pos[0],
				pos[1],
				SQUARE_WIDTH,
				SQUARE_HEIGHT,
			);
		},
		[piecesSprite, piecesSpriteReady],
	);

	const getMousePos = (canvas: HTMLCanvasElement, event: MouseEvent): Pos => {
		const rect = canvas.getBoundingClientRect();
		return [
			((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
			((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
		];
	};

	const onMouseMove = (e: MouseEvent): void => {
		const canvas = chessBoardRef.current;
		if (!canvas) {
			setMouseBoardPos(null);
			return;
		}

		const pos = toBoardPos(getMousePos(canvas, e));

		if (!posOnBoard(pos)) {
			setMouseBoardPos(null);
			return;
		}

		// Only set if the position actually changed
		if (!equals(pos, mouseBoardPos)) {
			setMouseBoardPos(pos);
		}
	};

	const onDragStart = (e: DragEvent): void => {
		const canvas = chessPiecesRef.current;
		if (!canvas || !pieceDragImages) {
			e.preventDefault();
			return;
		}

		const pos = toBoardPos(getMousePos(canvas, e));
		const piece = pieceLocations.find(pieceAtPos(pos));

		if (!piece) {
			e.preventDefault();
			return;
		}

		setDragStartBoardPos(pos);
		e.dataTransfer.setData('application/x-chess-mov-start', JSON.stringify(piece));
		e.dataTransfer.setDragImage(pieceDragImages[piece[0][0]][piece[0][1]], SQUARE_WIDTH / 2, SQUARE_HEIGHT / 2);
		e.dataTransfer.effectAllowed = 'move';

		onMoveStarted(pos);
	};

	const onDragEnd = (): void => {
		// a successful drop clears this, so this drop was cancelled
		if (dragStartBoardPos) {
			onMoveCancelled(dragStartBoardPos);
		}
		setDragStartBoardPos(null);
	};

	const onDrag = (e: DragEvent): void => {
		const canvas = chessPiecesRef.current;
		if (!canvas) {
			return;
		}
		const pos = toBoardPos(getMousePos(canvas, e));

		if (!equals(pos, mouseBoardPos)) {
			setMouseBoardPos(pos);
		}
	};

	const onDragOver = (e: DragEvent): void => {
		e.preventDefault();

		const canvas = chessPiecesRef.current;
		if (!canvas || !pieceDragImages) {
			e.preventDefault();
			return;
		}

		const pos = toBoardPos(getMousePos(canvas, e));

		if (possibleMoves?.find((p) => equals(p, pos))) {
			e.dataTransfer.dropEffect = 'move';
		} else {
			e.dataTransfer.dropEffect = 'none';
		}
	};

	const onDrop = (e: DragEvent): void => {
		e.preventDefault();
		console.log('drop');

		const canvas = chessPiecesRef.current;
		if (!canvas) {
			return;
		}

		const newPos = toBoardPos(getMousePos(canvas, e));
		const piecePos = JSON.parse(e.dataTransfer.getData('application/x-chess-mov-start')) as PiecePos;

		// move wasn't cancelled
		if (!equals(piecePos[1], newPos)) {
			onMoveCompleted(piecePos[1], newPos);
			setDragStartBoardPos(null);
		}
	};

	useEffect(() => {
		const canvas = chessBoardRef.current;
		const context = canvas?.getContext('2d');

		if (!context) {
			console.warn('could not acquire context');
			return;
		}

		context.strokeStyle = 'rgb(0,0,0)';
		context.lineWidth = 0.5;
		const WhiteSquare = 'rgb(157, 235, 196)';
		const BlackSquare = 'rgb(84, 128, 106)';

		for (let y = 0; y < 8; ++y) {
			for (let x = 0; x < 8; ++x) {
				context.fillStyle = (8 - y + x) % 2 ? BlackSquare : WhiteSquare;
				context.fillRect(x * SQUARE_WIDTH, y * SQUARE_HEIGHT, SQUARE_WIDTH, SQUARE_HEIGHT);
				context.strokeRect(x * SQUARE_WIDTH, y * SQUARE_HEIGHT, SQUARE_WIDTH, SQUARE_HEIGHT);
			}
		}
	}, [chessBoardRef]);

	useEffect(() => {
		const canvas = chessPiecesRef.current;
		const context = canvas?.getContext('2d');

		if (!context) {
			console.warn('could not acquire context');
			return;
		}
		context.clearRect(0, 0, WIDTH, HEIGHT);
		for (const pieceLoc of pieceLocations) {
			drawPiece(context, pieceLoc[0], fromBoardPos(pieceLoc[1]));
		}
	}, [chessPiecesRef, pieceLocations, drawPiece]);

	useEffect(() => {
		const canvas = chessUiRef.current;
		const context = canvas?.getContext('2d');

		if (!context) {
			console.warn('could not acquire context');
			return;
		}

		context.clearRect(0, 0, WIDTH, HEIGHT);

		if (mouseBoardPos) {
			const [x, y] = fromBoardPos(mouseBoardPos);
			context.strokeStyle = 'rgb(255, 255, 0)';
			context.lineWidth = 2.5;
			context.strokeRect(x, y, SQUARE_WIDTH, SQUARE_HEIGHT);
		}

		if (dragStartBoardPos) {
			const [x, y] = fromBoardPos(dragStartBoardPos);
			context.strokeStyle = 'rgb(255, 0, 255)';
			context.lineWidth = 2.5;
			context.strokeRect(x, y, SQUARE_WIDTH, SQUARE_HEIGHT);
		}

		if (possibleMoves) {
			for (const pos of possibleMoves) {
				const [x, y] = fromBoardPos(pos);
				context.strokeStyle = 'rgb(0, 255, 0)';
				context.lineWidth = 2.5;
				context.strokeRect(x, y, SQUARE_WIDTH, SQUARE_HEIGHT);
			}
		}
	}, [chessUiRef, mouseBoardPos, dragStartBoardPos, possibleMoves]);

	useEffect(() => {
		// if we've already created the images, no need to do it again
		if (pieceDragImages) return;

		const canvas = offscreenRef.current;
		if (!canvas) return;

		const context = canvas.getContext('2d');
		if (!context) return;

		const images: HTMLImageElement[][] = [[], []];

		for (let side = 0; side < 2; ++side) {
			for (let piece = 0; piece < 6; ++piece) {
				const img = (images[side][piece] = new Image());
				img.className = 'dragging';
				context.clearRect(0, 0, SQUARE_WIDTH, SQUARE_HEIGHT);
				drawPiece(context, [side, piece], [0, 0]);
				img.src = canvas.toDataURL();
			}
		}

		setPieceDragImages(images);
	}, [offscreenRef, piecesSprite, piecesSpriteReady, drawPiece, pieceDragImages]);

	return (
		<div className="chess-game">
			<canvas className="board-layer" ref={chessBoardRef} width={WIDTH} height={HEIGHT}></canvas>
			<canvas className="game-layer" ref={chessPiecesRef} width={WIDTH} height={HEIGHT}></canvas>
			<canvas
				className="ui-layer"
				ref={chessUiRef}
				width={WIDTH}
				height={HEIGHT}
				draggable="true"
				onMouseMove={onMouseMove}
				onDragStart={onDragStart}
				onDragEnd={onDragEnd}
				onDrag={onDrag}
				onDrop={onDrop}
				onDragOver={onDragOver}
			></canvas>
			<canvas className="offscreen-layer" ref={offscreenRef} width={SQUARE_WIDTH} height={SQUARE_HEIGHT}></canvas>
		</div>
	);
}
