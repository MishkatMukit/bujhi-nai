import type { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { ZodError } from "zod";
import config from "../config/index";
import AppError from "../utils/appError";

const isDev = config.node_env === "development";

/** body-parser tags its own failures with a `type` such as `entity.too.large`. */
const bodyParserErrorType = (error: unknown): string | undefined => {
	if (typeof error !== "object" || error === null || !("type" in error)) {
		return undefined;
	}

	const type = (error as { type?: unknown }).type;
	return typeof type === "string" ? type : undefined;
};

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorName = "Internal Server Error";
	let errorMessage = "Internal Server Error";

	const parserErrorType = bodyParserErrorType(err);

	// Validation and request-shape errors are written for clients, so their
	// messages stay readable outside development. Unknown errors are masked.
	let exposeDetails = isDev;

	if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = "Validation Error";
		errorMessage = err.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join(", ");
		exposeDetails = true;
	} else if (err instanceof mongoose.Error.ValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = err.name;
		errorMessage = Object.values(err.errors)
			.map((fieldError) => fieldError.message)
			.join(", ");
		exposeDetails = true;
	} else if (err instanceof mongoose.Error.CastError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = err.name;
		errorMessage = `Invalid ${err.path}`;
		exposeDetails = true;
	} else if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
		statusCode = httpStatus.CONFLICT;
		errorName = "Duplicate Key Error";
		errorMessage = "Duplicate key";
		exposeDetails = true;
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		errorName = err.name;
		errorMessage = err.message;
		exposeDetails = true;
	} else if (parserErrorType === "entity.too.large") {
		statusCode = httpStatus.REQUEST_ENTITY_TOO_LARGE;
		errorName = "Payload Too Large";
		errorMessage = "Request body is too large";
		exposeDetails = true;
	} else if (parserErrorType === "entity.parse.failed") {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = "Invalid JSON";
		errorMessage = "Request body is not valid JSON";
		exposeDetails = true;
	} else if (err instanceof Error) {
		statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		errorName = err.name;
		errorMessage = err.message;
	}

	// Errors with no safe public message still need to show up in server logs.
	if (statusCode >= httpStatus.INTERNAL_SERVER_ERROR) {
		console.error("Unhandled error:", err);
	}

	res.status(statusCode).json({
		success: false,
		statusCode,
		name: exposeDetails ? errorName : "Internal Server Error",
		message: exposeDetails ? errorMessage : "Internal Server Error",
		error: isDev
			? err instanceof Error
				? { ...err, name: err.name, message: err.message }
				: err
			: undefined,
		stack: isDev && err instanceof Error ? err.stack : undefined,
	});
};

export default globalErrorHandler;
