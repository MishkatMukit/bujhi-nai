import httpStatus from "http-status";
import type { QueryFilter } from "mongoose";
import type {
	IBoardExplanation,
	IExplainBoardPayload,
	IListBoardsQuery,
	IUploadedMedia,
} from "../../Interfaces/board.interface";
import { generateBoardExplanation } from "../../lib/gemma";
import BoardExplanation from "../../models/BoardExplanation.model";
import AppError from "../../utils/appError";

/** The feed never returns more than this many boards. */
const FEED_LIMIT = 15;

/** Safety budget for stored media, well under Mongo's 16 MB document cap. */
const MAX_STORED_MEDIA_CHARS = 15 * 1024 * 1024;

const VOICE_QUESTION_PLACEHOLDER = "🎙️ Voice Question Asked";
const DEFAULT_QUESTION = "Whiteboard explanation requested";

const toDataUrl = (media: IUploadedMedia): string =>
	`data:${media.mimeType};base64,${media.buffer.toString("base64")}`;

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

const explainBoard = async (payload: IExplainBoardPayload) => {
	const imageBase64 = toDataUrl(payload.image);
	const audioBase64 = payload.audio ? toDataUrl(payload.audio) : undefined;

	// Mongo caps a document at 16 MB. Two 5 MB uploads become ~14 MB once base64
	// encoded, so this budget leaves room for the AI text while failing oversized
	// payloads before a paid AI call instead of at insert time.
	if (imageBase64.length + (audioBase64?.length ?? 0) > MAX_STORED_MEDIA_CHARS) {
		throw new AppError(
			"Uploaded media is too large to store. Use a smaller image or audio clip.",
			httpStatus.BAD_REQUEST,
		);
	}

	const hadAudioQuestion = Boolean(payload.audio);
	const textQuestion = payload.textQuestion?.trim() || undefined;

	const studentQuestion =
		textQuestion ?? (hadAudioQuestion ? VOICE_QUESTION_PLACEHOLDER : DEFAULT_QUESTION);

	const { content } = await generateBoardExplanation({
		imageBase64,
		audioBase64,
		textQuestion,
		department: payload.department,
	});

	return BoardExplanation.create({
		...content,
		department: payload.department,
		imageBase64,
		studentQuestion,
		hadAudioQuestion,
		helpfulCount: 0,
		isSample: false,
	});
};

const markBoardHelpful = async (id: string) => {
	const board = await BoardExplanation.findByIdAndUpdate(
		id,
		{ $inc: { helpfulCount: 1 } },
		{ returnDocument: "after", projection: { helpfulCount: 1, _id: 0 } },
	).lean();

	if (!board) {
		throw new AppError("Board not found", httpStatus.NOT_FOUND);
	}

	return { helpfulCount: board.helpfulCount };
};

export const boardService = {
	getAllBoards,
	getBoardById,
	explainBoard,
	markBoardHelpful,
};

export default boardService;
