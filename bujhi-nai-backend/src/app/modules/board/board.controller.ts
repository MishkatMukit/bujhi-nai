import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { IListBoardsQuery } from "../../Interfaces/board.interface";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import boardService from "./board.service";

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

export const boardController = {
	getAllBoards,
	getBoardById,
};

export default boardController;
