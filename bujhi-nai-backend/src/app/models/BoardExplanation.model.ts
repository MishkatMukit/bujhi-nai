import { model, Schema } from "mongoose";
import {
	DEPARTMENTS,
	type IBoardExplanation,
	type IPracticeProblem,
	type IStepByStepBangla,
} from "../Interfaces/board.interface";

const stepByStepBanglaSchema = new Schema<IStepByStepBangla>(
	{
		stepNumber: { type: Number, required: true, min: 1 },
		equationOrConcept: { type: String, required: true, trim: true },
		banglaExplanation: { type: String, required: true, trim: true },
	},
	{ _id: false },
);

const practiceProblemSchema = new Schema<IPracticeProblem>(
	{
		question: { type: String, required: true, trim: true },
		hint: { type: String, required: true, trim: true },
		solution: { type: String, required: true, trim: true },
	},
	{ _id: false },
);

const boardExplanationSchema = new Schema<IBoardExplanation>(
	{
		department: {
			type: String,
			enum: [...DEPARTMENTS],
			required: true,
		},
		semester: { type: String, required: true, trim: true },
		courseDetected: { type: String, required: true, trim: true },
		topicTitle: { type: String, required: true, trim: true },
		imageBase64: { type: String, required: true },
		studentQuestion: { type: String, required: true, trim: true },
		hadAudioQuestion: { type: Boolean, required: true, default: false },
		cleanTranscription: { type: String, required: true },
		specificAnswer: { type: String, required: true },
		stepByStepBangla: {
			type: [stepByStepBanglaSchema],
			required: true,
			validate: {
				validator: (steps: IStepByStepBangla[]) => steps.length > 0,
				message: "stepByStepBangla must contain at least one step",
			},
		},
		examShortcutTip: { type: String, required: true, trim: true },
		practiceProblem: { type: practiceProblemSchema, required: true },
		helpfulCount: { type: Number, default: 0, min: 0 },
		isSample: { type: Boolean, default: false },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

boardExplanationSchema.index({
	department: 1,
	isSample: -1,
	helpfulCount: -1,
	createdAt: -1,
});
boardExplanationSchema.index({
	courseDetected: "text",
	topicTitle: "text",
	cleanTranscription: "text",
});

const BoardExplanation = model<IBoardExplanation>("BoardExplanation", boardExplanationSchema);

export default BoardExplanation;
