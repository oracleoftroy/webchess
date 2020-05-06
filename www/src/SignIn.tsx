import React, { FormEvent } from 'react';

interface SignInProps {
	onSignIn: (name: string) => void;
}

export function SignIn({ onSignIn }: SignInProps): JSX.Element {
	const onSubmit = (event: FormEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLFormElement;
		const data = new FormData(target);
		target.reset();

		const username = data.get('username') as string | null;
		if (username) {
			onSignIn(username);
		}
	};

	return (
		<section className="sign-in">
			<header>Please sign in</header>
			<form onSubmit={onSubmit}>
				<label htmlFor="username">Display name: </label>
				<input name="username" type="text" required placeholder="Your name"></input>
				<input type="submit" value="Sign in"></input>
			</form>
		</section>
	);
}
