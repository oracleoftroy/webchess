import winston from 'winston';
import { config } from './config';

export const log = winston.createLogger({
	level: config.logLevel,
	format: winston.format.json(),
	defaultMeta: { service: 'web-chess-server' },
	transports: [
		// new winston.transports.File({ filename: 'error.log', level: 'error' }),
		// new winston.transports.File({ filename: 'server.log' })
	],
});

if (config.isDevelopment) {
	log.add(
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
		}),
	);
} else {
	log.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	);
}
