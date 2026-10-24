import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import config from "./app/config/index";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import { routeHandler } from "./app/middleware/notFound";

const app = express();

const allowedOrigins = [config.frontend_url, "http://localhost:3000"].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		statusCode: 200,
		message: "Bujhi Nai API is running",
		data: {
			service: "bujhi-nai-backend",
			environment: config.node_env ?? "unknown",
			uptime: Math.floor(process.uptime()),
		},
	});
});

// Feature routes (board module) are mounted here from Phase 4.

app.use(routeHandler);
app.use(globalErrorHandler);

export default app;
