import React, { useState, useEffect } from 'react';
import './App.scss';

class ApiError extends Error {
	public status: string;

	constructor(public response: Response) {
		super(`HTTP Error ${response.statusText}`);
		this.status = response.statusText;
	}
}

async function fetchMsg(): Promise<any> {
	const response = await fetch('test', {
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!(response.status >= 200 && response.status < 300)) {
		const error = new ApiError(response);
		error.status = response.statusText;
		error.response = response;
		console.log(error);
		throw error;
	}

	return await response.json();
}

function App(): JSX.Element {
	const [error, setError] = useState<any>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [msg, setMsg] = useState('');

	useEffect(() => {
		fetchMsg().then(
			(result) => {
				setIsLoaded(true);
				setMsg(result.msg);
			},
			// Note: it's important to handle errors here
			// instead of a catch() block so that we don't swallow
			// exceptions from actual bugs in components.
			(error) => {
				setIsLoaded(true);
				setError(error);
			},
		);
	}, []);

	let ajaxMsg = null;
	if (error != null) {
		ajaxMsg = <div>Error: {error?.message}</div>;
	} else if (!isLoaded) {
		ajaxMsg = <div>Loading...</div>;
	} else {
		ajaxMsg = <p>Msg: {msg}</p>;
	}

	return (
		<div className="App">
			<header className="App-header">
				<h1>This is my header</h1>
			</header>
			<section>
				<h2>Ajax!</h2>
				<p>Getting message from the server</p>
				{ajaxMsg}
			</section>
			<section>
				<h2>This is a section of the page</h2>
				<article>
					<hgroup>
						<h3>Here is a lovely article I wrote</h3>
						<h4>in which I play with &lsquo;new&rsquo; html elements</h4>
					</hgroup>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
						labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
						laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
						voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
						non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
					</p>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
						labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
						laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
						voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
						non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
					</p>
					<aside>
						<p>I especially like this part</p>
					</aside>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
						labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
						laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
						voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
						non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
					</p>
				</article>
			</section>
			<footer>
				<p>This is my footer</p>
			</footer>
		</div>
	);
}

export default App;
