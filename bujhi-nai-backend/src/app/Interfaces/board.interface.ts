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

/** Fields the client supplies for `POST /explain`; the rest come from Gemma. */
export interface ICreateBoardPayload {
	department: TDepartment;
	textQuestion?: string;
	hadAudioQuestion: boolean;
	imageBase64: string;
	audioBase64?: string;
	audioMimeType?: string;
}

/** Query string accepted by `GET /api/boards`. */
export interface IListBoardsQuery {
	department?: TDepartment;
	search?: string;
}
