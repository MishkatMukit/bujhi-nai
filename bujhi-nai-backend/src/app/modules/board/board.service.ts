import httpStatus from "http-status";
import type { QueryFilter } from "mongoose";
import type { IBoardExplanation, IListBoardsQuery } from "../../Interfaces/board.interface";
import BoardExplanation from "../../models/BoardExplanation.model";
import AppError from "../../utils/appError";

/** The feed never returns more than this many boards. */
const FEED_LIMIT = 15;

const getAllBoards = async (query: IListBoardsQuery) => {
	const filter: QueryFilter<IBoardExplanation> = {};

	if (query.department) {
		filter.department = query.department;
	}

	if (query.search) {
		filter.$text = { $search: query.search };
	}

	return BoardExplanation.find(filter)
		.sort({ isSample: -1, helpfulCount: -1, createdAt: -1 })
		.limit(FEED_LIMIT)
		.lean();
};

const getBoardById = async (id: string) => {
	const board = await BoardExplanation.findById(id).lean();

	if (!board) {
		throw new AppError("Board not found", httpStatus.NOT_FOUND);
	}

	return board;
};

export const boardService = {
	getAllBoards,
	getBoardById,
};

export default boardService;
