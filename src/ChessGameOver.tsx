import ChessPieces from './Chess_Pieces_Sprite.svg';
import React from 'react';

interface ChessGameOverProps {
	reason: ChessGameOverReason;
}

export enum ChessGameOverReason {
	Draw,
	WhiteWin,
	BlackWin,
}

export function ChessGameOver({ reason }: ChessGameOverProps): JSX.Element {
	console.log('Game Over:', reason);
	return (
		<section>
			<h3>Game Over</h3>

			{reason === ChessGameOverReason.Draw && <p>Draw</p>}
			{reason === ChessGameOverReason.WhiteWin && (
				<p>
					<img className="chessgame-piece-img white-king" src={ChessPieces} alt="king" />
					White wins!
				</p>
			)}
			{reason === ChessGameOverReason.BlackWin && (
				<p>
					<img className="chessgame-piece-img black-king" src={ChessPieces} alt="king" />
					Black wins!
				</p>
			)}
		</section>
	);
}
