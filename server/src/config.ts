class Config {
	get logLevel(): string {
		return process.env.LOG_LEVEL || 'info';
	}

	get isProduction(): boolean {
		return process.env.NODE_ENV === 'production';
	}

	get isDevelopment(): boolean {
		return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
	}

	get numWorkers(): number {
		return process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : 1;
	}

	get port(): number {
		return process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
	}
}

export const config = new Config();
