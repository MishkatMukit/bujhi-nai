import app from "./app";
import config, { assertEnv } from "./app/config/index";
import connectDB from "./app/lib/mongoose";

const startServer = async (): Promise<void> => {
	assertEnv();
	await connectDB();

	const server = app.listen(config.port, () => {
		console.log(
			`Bujhi Nai API listening on http://localhost:${config.port} (${config.node_env ?? "unknown"} environment)`,
		);
	});

	server.on("error", (error) => {
		console.error("Failed to start the Bujhi Nai API:", error.message);
		process.exit(1);
	});
};

startServer().catch((error) => {
	console.error(
		"Failed to start the Bujhi Nai API:",
		error instanceof Error ? error.message : error,
	);
	process.exit(1);
});
