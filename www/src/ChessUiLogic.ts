import { PieceType } from 'chess.js';

export enum Sides {
	White = 0,
	Black = 1,
}

export enum Pieces {
	King = 0,
	Queen,
	Bishop,
	Knight,
	Rook,
	Pawn,
}

export function mapPieceType(type: PieceType): Pieces {
	switch (type) {
		case 'p':
			return Pieces.Pawn;
		case 'n':
			return Pieces.Knight;
		case 'b':
			return Pieces.Bishop;
		case 'r':
			return Pieces.Rook;
		case 'q':
			return Pieces.Queen;
		case 'k':
			return Pieces.King;
	}
}

export function mapPieceColor(color: 'w' | 'b'): Sides {
	return color === 'w' ? Sides.White : Sides.Black;
}

// [x,y] coordinate in screen or board coordinates
export type Pos = [number, number];
export type Piece = [Sides, Pieces];
export type PiecePos = [Piece, Pos];

function isPiecePos(p: PiecePos | Piece | Pos): p is PiecePos {
	const pp = p as PiecePos;
	return pp[0] instanceof Array && pp[1] instanceof Array;
}

export function equals(p1: Pos | null, p2: Pos | null): boolean;
export function equals(p1: Piece | null, p2: Piece | null): boolean;
export function equals(p1: PiecePos | null, p2: PiecePos | null): boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function equals(p1: any, p2: any): boolean {
	if (p1 === p2) return true;
	else if (!p1 || !p2) return false;
	else if (isPiecePos(p1)) return equals(p1[0], p2[0]) && equals(p1[1], p2[1]);
	else return p1[0] === p2[0] && p1[1] === p2[1];
}

export const pieceAtPos = (pos: Pos) => (p: PiecePos): boolean => p[1][0] === pos[0] && p[1][1] === pos[1];
