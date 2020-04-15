import React from 'react';
import ChessPieces from './Chess_Pieces_Sprite.svg';
import { Pieces, Sides } from './ChessUiLogic';

interface ChessPieceImgProps {
	color: Sides;
	piece: Pieces;
}

export function ChessPieceImg({ color, piece }: ChessPieceImgProps): JSX.Element {
	const className = `chessgame-piece-img ${Sides[color].toLowerCase()}-${Pieces[piece].toLowerCase()}`;

	return <img className={className} src={ChessPieces} alt="queen" />;
}
