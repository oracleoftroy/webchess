import './App.scss';
import React from 'react';
import { ChessGame } from './ChessGame';

function App(): JSX.Element {
	return (
		<div className="app">
			<header>
				<h1>Chess</h1>
			</header>
			<main>
				<section>
					<ChessGame></ChessGame>
				</section>
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
