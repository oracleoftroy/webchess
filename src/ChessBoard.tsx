import React, { useState, useEffect, MouseEvent } from 'react';
import pieceSprite from './Chess_Pieces_Sprite.svg';

const PIECE_SPRITE_WIDTH = 45;
const PIECE_SPRITE_HEIGHT = 45;

const WIDTH = 640;
const HEIGHT = 640;

const SQUARE_WIDTH = WIDTH / 8;
const SQUARE_HEIGHT = HEIGHT / 8;

enum Sides {
	White = 0,
	Black = 1,
}

enum Pieces {
	King = 0,
	Queen,
	Bishop,
	Knight,
	Rook,
	Pawn,
}

type Pos = [number, number];

export function ChessBoard(): JSX.Element {
	const [imageReady, setImageReady] = useState(false);
	const [mouseBoardPos, setMouseBoardPos] = useState<Pos | null>(null);

	const pieces = new Image();
	pieces.onload = (): void => setImageReady(true);
	pieces.src = pieceSprite;

	const fromBoardPos = (pos: Pos): Pos => [pos[0] * SQUARE_WIDTH, pos[1] * SQUARE_HEIGHT];
	const toBoardPos = (pos: Pos): Pos => [Math.floor(pos[0] / SQUARE_WIDTH), Math.floor(pos[1] / SQUARE_HEIGHT)];

	const drawPiece = (context: CanvasRenderingContext2D, side: Sides, piece: Pieces, pos: Pos): void => {
		context.drawImage(
			pieces,
			piece * PIECE_SPRITE_WIDTH,
			side * PIECE_SPRITE_HEIGHT,
			PIECE_SPRITE_WIDTH,
			PIECE_SPRITE_HEIGHT,
			pos[0],
			pos[1],
			SQUARE_WIDTH,
			SQUARE_HEIGHT,
		);
	};

	const getMousePos = (canvas: HTMLCanvasElement, event: MouseEvent): Pos => {
		const rect = canvas.getBoundingClientRect();
		return [
			((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
			((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
		];
	};

	const chessboardRef = React.createRef<HTMLCanvasElement>();
	const posOnBoard = (pos: Pos): boolean => pos[0] >= 0 && pos[0] < 8 && pos[1] >= 0 && pos[1] < 8;

	const onMouseMove = (e: MouseEvent): void => {
		const canvas = chessboardRef.current;
		if (!canvas) {
			setMouseBoardPos(null);
			return;
		}

		const pos = toBoardPos(getMousePos(canvas, e));

		if (!posOnBoard(pos)) {
			setMouseBoardPos(null);
			return;
		}

		if (!mouseBoardPos || pos[0] != mouseBoardPos[0] || pos[1] != mouseBoardPos[1]) {
			console.log('settings pos:', pos);
			setMouseBoardPos(pos);
		}
	};

	useEffect(() => {
		const canvas = chessboardRef.current;
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

		drawPiece(context, Sides.Black, Pieces.Rook, fromBoardPos([0, 0]));
		drawPiece(context, Sides.Black, Pieces.Rook, fromBoardPos([7, 0]));
		drawPiece(context, Sides.Black, Pieces.Knight, fromBoardPos([1, 0]));
		drawPiece(context, Sides.Black, Pieces.Knight, fromBoardPos([6, 0]));
		drawPiece(context, Sides.Black, Pieces.Bishop, fromBoardPos([2, 0]));
		drawPiece(context, Sides.Black, Pieces.Bishop, fromBoardPos([5, 0]));
		drawPiece(context, Sides.Black, Pieces.Queen, fromBoardPos([3, 0]));
		drawPiece(context, Sides.Black, Pieces.King, fromBoardPos([4, 0]));

		drawPiece(context, Sides.White, Pieces.Rook, fromBoardPos([0, 7]));
		drawPiece(context, Sides.White, Pieces.Rook, fromBoardPos([7, 7]));
		drawPiece(context, Sides.White, Pieces.Knight, fromBoardPos([1, 7]));
		drawPiece(context, Sides.White, Pieces.Knight, fromBoardPos([6, 7]));
		drawPiece(context, Sides.White, Pieces.Bishop, fromBoardPos([2, 7]));
		drawPiece(context, Sides.White, Pieces.Bishop, fromBoardPos([5, 7]));
		drawPiece(context, Sides.White, Pieces.Queen, fromBoardPos([3, 7]));
		drawPiece(context, Sides.White, Pieces.King, fromBoardPos([4, 7]));

		for (let x = 0; x < 8; ++x) {
			drawPiece(context, Sides.Black, Pieces.Pawn, fromBoardPos([x, 1]));
			drawPiece(context, Sides.White, Pieces.Pawn, fromBoardPos([x, 6]));
		}

		if (mouseBoardPos) {
			const [x, y] = fromBoardPos(mouseBoardPos);
			console.info('drawing box at:', x, y);
			context.strokeStyle = 'rgb(255, 255, 0)';
			context.lineWidth = 2.5;
			context.strokeRect(x, y, SQUARE_WIDTH, SQUARE_HEIGHT);
		}
	}, [imageReady, mouseBoardPos]);

	return <canvas ref={chessboardRef} width={WIDTH} height={HEIGHT} onMouseMove={onMouseMove}></canvas>;
}
