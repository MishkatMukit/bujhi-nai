import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import multer from "multer";
import AppError from "../utils/appError";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AUDIO_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_FILE_SIZE, files: 2 },
	fileFilter: (_req, file, cb) => {
		if (file.fieldname === "image") {
			if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
				cb(
					new AppError(
						`Unsupported image type "${file.mimetype}". Use jpeg, png, or webp.`,
						httpStatus.BAD_REQUEST,
					),
				);
				return;
			}
		} else if (file.fieldname === "audio") {
			if (!AUDIO_MIME_TYPES.includes(file.mimetype)) {
				cb(
					new AppError(
						`Unsupported audio type "${file.mimetype}". Use webm, mp4, mpeg, wav, or ogg.`,
						httpStatus.BAD_REQUEST,
					),
				);
				return;
			}
		} else {
			cb(
				new AppError(
					`Unexpected file field "${file.fieldname}"; only "image" and "audio" are accepted.`,
					httpStatus.BAD_REQUEST,
				),
			);
			return;
		}

		cb(null, true);
	},
});

const boardMediaUpload = upload.fields([
	{ name: "image", maxCount: 1 },
	{ name: "audio", maxCount: 1 },
]);

/**
 * Multer middleware for `POST /explain`. Converts its own `MulterError`s
 * (size, field count) into 400 `AppError`s so the global handler stays
 * Mongoose/Zod aware instead of knowing about uploads.
 */
export const uploadBoardMedia = (req: Request, res: Response, next: NextFunction): void => {
	boardMediaUpload(req, res, (error: unknown) => {
		if (!error) {
			next();
			return;
		}

		if (error instanceof multer.MulterError) {
			next(new AppError(`Upload failed: ${error.message}`, httpStatus.BAD_REQUEST));
			return;
		}

		next(error);
	});
};

export default upload;
