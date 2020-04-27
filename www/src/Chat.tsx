import './Chat.scss';
import React, { FormEvent } from 'react';
import { ChatResponse, JoinChatResponse, LeaveChatResponse, ReceiveChatResponse, SendChatRequest } from './protocol';

interface Props {
	channel: string;
	messages: ChatResponse[];
	onSendChatRequest: (message: SendChatRequest) => void;
}

interface ChatMsgProps {
	res: ReceiveChatResponse;
}

interface JoinChatProps {
	res: JoinChatResponse;
}

interface LeaveChatProps {
	res: LeaveChatResponse;
}

function ChatMsg({ res }: ChatMsgProps): JSX.Element {
	return (
		<article className="chat-message">
			<address>{res.username}</address>: {res.msg}
		</article>
	);
}

function JoinChat({ res }: JoinChatProps): JSX.Element {
	return <article className="chat-join-message">{res.username} has joined the chat</article>;
}

function LeaveChat({ res }: LeaveChatProps): JSX.Element {
	return <article className="chat-leave-message">{res.username} has left the chat</article>;
}

export function Chat({ channel, messages, onSendChatRequest }: Props): JSX.Element {
	const onSendMessage = (event: FormEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLFormElement;
		const data = new FormData(target);
		target.reset();
		const message = data.get('message') as string | null;
		if (message) {
			onSendChatRequest({ type: 'chat', channel: channel, msg: message });
		}
	};
	return (
		<section className="chat-section">
			<title>{channel}</title>
			{messages.map((message, index) =>
				message.type === 'chat' ? (
					<ChatMsg key={index} res={message} />
				) : message.type === 'chat-join' ? (
					<JoinChat key={index} res={message} />
				) : message.type === 'chat-leave' ? (
					<LeaveChat key={index} res={message} />
				) : (
					''
				),
			)}
			<form onSubmit={onSendMessage}>
				<input type="text" name="message" required placeholder="Enter your message" />
				<input type="submit" value="Send" />
			</form>
		</section>
	);
}
