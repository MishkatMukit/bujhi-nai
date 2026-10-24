import { Router } from "express";
import { validateParams, validateQuery } from "../../middleware/validateRequest";
import boardController from "./board.controller";
import boardValidation from "./board.validation";

const router = Router();

router.get("/", validateQuery(boardValidation.listBoardsQuerySchema), boardController.getAllBoards);

router.get(
	"/:id",
	validateParams(boardValidation.boardIdParamSchema),
	boardController.getBoardById,
);

export const boardRoutes = router;
