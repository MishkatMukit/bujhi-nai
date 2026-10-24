import type { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { ZodError } from "zod";
import config from "../config/index";
import AppError from "../utils/appError";

const isDev = config.node_env === "development";

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
	let errorName = "Internal Server Error";
	let errorMessage = "Internal Server Error";

	if (err instanceof ZodError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = "Validation Error";
		errorMessage = err.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join(", ");
	} else if (err instanceof mongoose.Error.ValidationError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = err.name;
		errorMessage = Object.values(err.errors)
			.map((fieldError) => fieldError.message)
			.join(", ");
	} else if (err instanceof mongoose.Error.CastError) {
		statusCode = httpStatus.BAD_REQUEST;
		errorName = err.name;
		errorMessage = `Invalid ${err.path}`;
	} else if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
		statusCode = httpStatus.CONFLICT;
		errorName = "Duplicate Key Error";
		errorMessage = "Duplicate key";
	} else if (err instanceof AppError) {
		statusCode = err.statusCode;
		errorName = err.name;
		errorMessage = err.message;
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
		name: isDev ? errorName : err instanceof AppError ? err.name : "Internal Server Error",
		message: isDev ? errorMessage : err instanceof AppError ? err.message : "Internal Server Error",
		error: isDev
			? err instanceof Error
				? { ...err, name: err.name, message: err.message }
				: err
			: undefined,
		stack: isDev && err instanceof Error ? err.stack : undefined,
	});
};

export default globalErrorHandler;
