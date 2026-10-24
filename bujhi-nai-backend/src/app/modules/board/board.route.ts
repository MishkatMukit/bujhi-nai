import { Router } from "express";
import { uploadBoardMedia } from "../../lib/multer";
import { validateParams, validateQuery, validateRequest } from "../../middleware/validateRequest";
import boardController from "./board.controller";
import boardValidation from "./board.validation";

const router = Router();

router.get("/", validateQuery(boardValidation.listBoardsQuerySchema), boardController.getAllBoards);

router.post(
	"/explain",
	uploadBoardMedia,
	validateRequest(boardValidation.createBoardSchema),
	boardController.explainBoard,
);

router.get(
	"/:id",
	validateParams(boardValidation.boardIdParamSchema),
	boardController.getBoardById,
);

router.patch(
	"/:id/helpful",
	validateParams(boardValidation.boardIdParamSchema),
	boardController.markBoardHelpful,
);

export const boardRoutes = router;
