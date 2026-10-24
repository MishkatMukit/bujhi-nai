import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { IListBoardsQuery, TDepartment } from "../../Interfaces/board.interface";
import AppError from "../../utils/appError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import boardService from "./board.service";

type TBoardFiles = {
	image?: Express.Multer.File[];
	audio?: Express.Multer.File[];
};

type TCreateBoardBody = {
	department: TDepartment;
	textQuestion?: string;
};

const getAllBoards = catchAsync(async (req: Request, res: Response) => {
	const boards = await boardService.getAllBoards(req.query as unknown as IListBoardsQuery);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Boards retrieved successfully",
		data: boards,
	});
});

const getBoardById = catchAsync(async (req: Request, res: Response) => {
	const board = await boardService.getBoardById(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Board retrieved successfully",
		data: board,
	});
});

const explainBoard = catchAsync(async (req: Request, res: Response) => {
	const files = req.files as TBoardFiles | undefined;
	const image = files?.image?.[0];

	if (!image) {
		throw new AppError("Image is required", httpStatus.BAD_REQUEST);
	}

	const audio = files?.audio?.[0];
	const body = req.body as TCreateBoardBody;

	const board = await boardService.explainBoard({
		department: body.department,
		textQuestion: body.textQuestion,
		image: { buffer: image.buffer, mimeType: image.mimetype },
		audio: audio ? { buffer: audio.buffer, mimeType: audio.mimetype } : undefined,
	});

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Board explained successfully",
		data: board,
	});
});

const markBoardHelpful = catchAsync(async (req: Request, res: Response) => {
	const result = await boardService.markBoardHelpful(req.params.id as string);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Helpful count updated successfully",
		data: result,
	});
});

export const boardController = {
	getAllBoards,
	getBoardById,
	explainBoard,
	markBoardHelpful,
};

export default boardController;
