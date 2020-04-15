import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import express, { Application, NextFunction, Request, Response } from 'express';

import { config } from './config';
import { log } from './logger';
import path from 'path';

class Stream {
	public write(text: string) {
		log.info(text);
	}
}

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
	log.error(err);
	res.status(500).json({ error: err }).end();
}

export class Server {
	private app: Application;

	constructor() {
		const app = express();
		app.use(morgan('combined', { stream: new Stream() }));
		app.use(compression());
		app.use(helmet());
		app.use(cors());
		app.use(cookieParser());
		app.use(bodyParser.json());

		app.use('/', express.static(path.join(__dirname, '../../www/build')));

		app.get('/test', (req, res) => {
			res.json({
				msg: 'Heyo, That seemed to work!',
			});
		});

		app.use(errorHandler);

		this.app = app;
	}

	public listen() {
		this.app.listen(config.port, () => {
			log.info(`server started at http://localhost:${config.port}`);
		});
	}
}
