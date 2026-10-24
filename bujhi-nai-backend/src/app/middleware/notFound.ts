import type { Request, Response } from "express";
import httpStatus from "http-status";

/**
 * Catch-all 404. This is the only response that does not use the
 * `sendResponse` envelope.
 */
export const routeHandler = (req: Request, res: Response): void => {
	res.status(httpStatus.NOT_FOUND).json({
		message: "Route not found",
		path: req.originalUrl,
		date: new Date(),
	});
};
