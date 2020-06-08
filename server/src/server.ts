import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { log } from './logger';
import { WsServer } from './ws/wsServer';

class Stream {
	public write(text: string): void {
		log.info(text);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
	log.error(err);
	res.status(500).json({ error: err }).end();
}

export class Server {
	private app: Application;
	private ws: WsServer | null = null;

	constructor() {
		const app = express();
		app.use(morgan('combined', { stream: new Stream() }));
		app.use(compression());
		app.use(helmet());
		app.use(cors());
		app.use(cookieParser());
		app.use(bodyParser.json());

		app.get('/', (req, res) => {
			res.json({
				msg: 'Welcome to the WebChess api.',
			});
		});

		app.get('/test', (req, res) => {
			res.json({
				msg: 'Heyo, That seemed to work!',
			});
		});

		app.use(errorHandler);

		this.app = app;
	}

	public listen(): void {
		const server = this.app.listen(config.port, () => {
			log.info(`server started at http://localhost:${config.port}`);
		});

		this.ws = new WsServer(server);
	}
}
