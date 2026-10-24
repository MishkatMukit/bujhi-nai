import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DEFAULT_PORT = 5000;
const parsedPort = Number(process.env.PORT ?? DEFAULT_PORT);

const requiredEnvKeys = ["MONGODB_URI", "GEMINI_API_KEY"] as const;

/**
 * Runtime configuration, mirroring the reference project's naming style.
 * `mongodb_uri` and `gemini_api_key` are asserted here because `assertEnv()`
 * refuses to start the server without them; nothing in this file throws at
 * import time so scripts can load it without a full .env.
 */
const config = {
	node_env: process.env.NODE_ENV,
	port: Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT,
	mongodb_uri: process.env.MONGODB_URI as string,
	gemini_api_key: process.env.GEMINI_API_KEY as string,
	gemma_model: process.env.GEMMA_MODEL ?? "gemma-4-26b-a4b-it",
	ollama_url: process.env.OLLAMA_URL ?? "http://localhost:11434",
	ollama_model: process.env.OLLAMA_MODEL ?? "gemma4:e4b",
	frontend_url: process.env.FRONTEND_URL ?? "http://localhost:3000",
} as const;

/** Required variables that are currently unset (empty list when complete). */
export const missingEnvKeys = (): string[] => requiredEnvKeys.filter((key) => !process.env[key]);

/**
 * Fail fast with a readable message instead of surfacing a 500 on the first
 * request. Called from `server.ts` before the app starts listening.
 */
export const assertEnv = (): void => {
	const missing = missingEnvKeys();

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variable(s): ${missing.join(", ")}. Copy .env.example to .env and fill them in.`,
		);
	}
};

export default config;
