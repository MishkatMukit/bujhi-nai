import type { Types } from "mongoose";

export const DEPARTMENTS = ["CSE", "EEE", "BBA", "Pharmacy", "URC", "General"] as const;

export type TDepartment = (typeof DEPARTMENTS)[number];

export interface IStepByStepBangla {
	stepNumber: number;
	equationOrConcept: string;
	banglaExplanation: string;
}

export interface IPracticeProblem {
	question: string;
	hint: string;
	solution: string;
}

export interface IBoardExplanation {
	_id?: Types.ObjectId;
	department: TDepartment;
	semester: string;
	courseDetected: string;
	topicTitle: string;
	imageBase64: string;
	studentQuestion: string;
	hadAudioQuestion: boolean;
	cleanTranscription: string;
	specificAnswer: string;
	stepByStepBangla: IStepByStepBangla[];
	examShortcutTip: string;
	practiceProblem: IPracticeProblem;
	helpfulCount: number;
	isSample: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** An uploaded file held in memory by Multer. */
export interface IUploadedMedia {
	buffer: Buffer;
	mimeType: string;
}

/** Everything the controller hands to the service for `POST /explain`. */
export interface IExplainBoardPayload {
	department: TDepartment;
	textQuestion?: string;
	image: IUploadedMedia;
	audio?: IUploadedMedia;
}

/** Query string accepted by `GET /api/boards`. */
export interface IListBoardsQuery {
	department?: TDepartment;
	search?: string;
}
