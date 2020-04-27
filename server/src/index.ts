import cluster from 'cluster';
import dotenv from 'dotenv';
dotenv.config();

import { config } from './config';
import { log } from './logger';
import { Server } from './server';

function createCluster(): void {
	log.info('Initializing app');

	try {
		cluster.on('online', (worker) => {
			log.info(`worker ${worker.id} online`);
		});

		const numWorkers = config.numWorkers;
		for (let i = 0; i < numWorkers; ++i) {
			cluster.fork();
		}
	} catch (err) {
		log.error(err);
	}
}

async function runServer(): Promise<void> {
	try {
		const server = new Server();
		server.listen();
	} catch (e) {
		log.error('Uncaught exception: ', e);
	}
}

if (cluster.isMaster) {
	createCluster();
} else {
	runServer()
		.then(() => log.info('server running'))
		.catch((e) => log.error('Uncaught exception: ', e));
}
