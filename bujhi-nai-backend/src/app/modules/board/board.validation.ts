import { z } from "zod";
import { DEPARTMENTS } from "../../Interfaces/board.interface";

const listBoardsQuerySchema = z.object({
	department: z.enum(DEPARTMENTS).optional(),
	search: z.string().trim().max(100).optional(),
});

const boardIdParamSchema = z.object({
	id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid board id"),
});

export const boardValidation = {
	listBoardsQuerySchema,
	boardIdParamSchema,
};

export default boardValidation;
