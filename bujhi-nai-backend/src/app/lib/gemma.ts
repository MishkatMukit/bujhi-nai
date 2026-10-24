import { GoogleGenAI, type Part, type Schema, Type } from "@google/genai";
import httpStatus from "http-status";
import { z } from "zod";
import config from "../config/index";
import type { TDepartment } from "../Interfaces/board.interface";
import AppError from "../utils/appError";

export const boardExplanationContentSchema = z.object({
	semester: z.string().trim().min(1),
	courseDetected: z.string().trim().min(1),
	topicTitle: z.string().trim().min(1),
	cleanTranscription: z.string().trim().min(1),
	specificAnswer: z.string().trim().min(1),
	stepByStepBangla: z
		.array(
			z.object({
				stepNumber: z.number().int().positive(),
				equationOrConcept: z.string().trim().min(1),
				banglaExplanation: z.string().trim().min(1),
			}),
		)
		.min(1),
	examShortcutTip: z.string().trim().min(1),
	practiceProblem: z.object({
		question: z.string().trim().min(1),
		hint: z.string().trim().min(1),
		solution: z.string().trim().min(1),
	}),
});

export type TBoardExplanationContent = z.infer<typeof boardExplanationContentSchema>;

export interface IGemmaRequest {
	/** Data URL: `data:image/png;base64,...` */
	imageBase64: string;
	/** Optional data URL for the spoken question. */
	audioBase64?: string;
	textQuestion?: string;
	department: TDepartment;
}

export interface IGemmaExplanationResult {
	content: TBoardExplanationContent;
	provider: "gemini" | "ollama";
	model: string;
}

/**
 * Strict response schema for the hosted Gemma call. Server-owned fields
 * (`_id`, `department`, `imageBase64`, `studentQuestion`, `hadAudioQuestion`,
 * `helpfulCount`, `isSample`, timestamps) are deliberately absent.
 */
const gemmaResponseSchema: Schema = {
	type: Type.OBJECT,
	properties: {
		semester: {
			type: Type.STRING,
			description: 'Semester read from the board, e.g. "3rd".',
		},
		courseDetected: {
			type: Type.STRING,
			description: 'Course name, e.g. "Theory of Computation".',
		},
		topicTitle: {
			type: Type.STRING,
			description: "Short topic title for the board.",
		},
		cleanTranscription: {
			type: Type.STRING,
			description: "Markdown transcription of the board; formulas as LaTeX.",
		},
		specificAnswer: {
			type: Type.STRING,
			description: "Bangla answer to the student's actual confusion.",
		},
		stepByStepBangla: {
			type: Type.ARRAY,
			minItems: "2",
			items: {
				type: Type.OBJECT,
				properties: {
					stepNumber: { type: Type.INTEGER },
					equationOrConcept: { type: Type.STRING },
					banglaExplanation: { type: Type.STRING },
				},
				required: ["stepNumber", "equationOrConcept", "banglaExplanation"],
				propertyOrdering: ["stepNumber", "equationOrConcept", "banglaExplanation"],
			},
		},
		examShortcutTip: {
			type: Type.STRING,
			description: "One practical shortcut for exams.",
		},
		practiceProblem: {
			type: Type.OBJECT,
			properties: {
				question: { type: Type.STRING },
				hint: { type: Type.STRING },
				solution: { type: Type.STRING },
			},
			required: ["question", "hint", "solution"],
			propertyOrdering: ["question", "hint", "solution"],
		},
	},
	required: [
		"semester",
		"courseDetected",
		"topicTitle",
		"cleanTranscription",
		"specificAnswer",
		"stepByStepBangla",
		"examShortcutTip",
		"practiceProblem",
	],
	propertyOrdering: [
		"semester",
		"courseDetected",
		"topicTitle",
		"cleanTranscription",
		"specificAnswer",
		"stepByStepBangla",
		"examShortcutTip",
		"practiceProblem",
	],
};

const buildPrompt = (input: IGemmaRequest): string => {
	const question = input.textQuestion?.trim();
	const audioNote = input.audioBase64
		? "An audio recording of the student's spoken question is attached. Listen to it and answer what was actually asked."
		: "";

	return `You are a friendly senior tutor at IIUC (International Islamic University Chittagong). A junior student photographed a whiteboard and wants to understand it.

Student department: ${input.department}
Student's typed question: ${question || "(no typed question)"}
${audioNote}

Rules:
- Explain in natural, friendly Bangladeshi Bangla. Keep technical terms in English (Time Complexity, Epsilon Closure, Supernode, Debit/Credit).
- Use only Bangla (Bengali script) and English (Latin script) in prose. Never output Devanagari, Han, Japanese, or any other script.
- Detect the course and semester from the board; give your best guess if it is not written.
- cleanTranscription: transcribe the board in Markdown. Every formula, equation, and state set MUST be LaTeX inside $...$ or $$...$$.
- specificAnswer: answer the student's exact confusion, not a generic lecture. If no question was typed, target the step students usually get stuck on.
- stepByStepBangla: 3 to 6 steps. Point out the steps professors usually skip.
- examShortcutTip: exactly one practical shortcut for exams.
- practiceProblem: exactly ONE exam-style problem with a hint and a full solution.
- Return only JSON that matches the schema. No markdown fences, no extra commentary.`;
};

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
	const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);

	if (!match?.[1] || !match[2]) {
		throw new AppError("Invalid media payload", httpStatus.BAD_REQUEST);
	}

	return { mimeType: match[1], data: match[2] };
};

const parseBoardExplanation = (raw: string): TBoardExplanationContent => {
	const cleaned = raw
		.trim()
		.replace(/^```(?:json)?\s*/i, "")
		.replace(/```$/, "")
		.trim();

	let parsed: unknown;

	try {
		parsed = JSON.parse(cleaned);
	} catch {
		console.error("Gemma returned non-JSON output:", cleaned.slice(0, 800));
		throw new AppError("AI returned an invalid response", httpStatus.BAD_GATEWAY);
	}

	const result = boardExplanationContentSchema.safeParse(parsed);

	if (!result.success) {
		console.error(
			"Gemma output failed validation:",
			result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
			"| raw:",
			cleaned.slice(0, 800),
		);
		throw new AppError("AI returned an invalid explanation", httpStatus.BAD_GATEWAY);
	}

	return result.data;
};

const callGemini = async (
	prompt: string,
	input: IGemmaRequest,
): Promise<IGemmaExplanationResult> => {
	const ai = new GoogleGenAI({ apiKey: config.gemini_api_key });
	const image = parseDataUrl(input.imageBase64);

	const parts: Part[] = [
		{ text: prompt },
		{ inlineData: { mimeType: image.mimeType, data: image.data } },
	];

	if (input.audioBase64) {
		const audio = parseDataUrl(input.audioBase64);
		parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
	}

	const response = await ai.models.generateContent({
		model: config.gemma_model,
		contents: [{ role: "user", parts }],
		config: {
			temperature: 0.3,
			responseMimeType: "application/json",
			responseSchema: gemmaResponseSchema,
		},
	});

	const text = response.text;

	if (!text) {
		throw new Error("Gemma returned an empty response");
	}

	return {
		content: parseBoardExplanation(text),
		provider: "gemini",
		model: config.gemma_model,
	};
};

const callOllama = async (
	prompt: string,
	input: IGemmaRequest,
): Promise<IGemmaExplanationResult> => {
	const image = parseDataUrl(input.imageBase64);

	if (input.audioBase64) {
		console.warn("Ollama fallback ignores audio; answering from the image and typed question.");
	}

	const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(
		boardExplanationContentSchema,
	) as Record<string, unknown>;

	const response = await fetch(`${config.ollama_url}/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: config.ollama_model,
			stream: false,
			format: jsonSchema,
			options: { temperature: 0.3 },
			messages: [{ role: "user", content: prompt, images: [image.data] }],
		}),
	});

	if (!response.ok) {
		throw new Error(`Ollama responded with ${response.status}`);
	}

	const data = (await response.json()) as { message?: { content?: string } };
	const text = data.message?.content;

	if (!text) {
		throw new Error("Ollama returned an empty response");
	}

	return {
		content: parseBoardExplanation(text),
		provider: "ollama",
		model: config.ollama_model,
	};
};

/**
 * Sends the whiteboard (and optional audio question) to Gemma and returns
 * validated content fields. Falls back to a local Ollama model when the hosted
 * call fails; never fabricates a response.
 */
export const generateBoardExplanation = async (
	input: IGemmaRequest,
): Promise<IGemmaExplanationResult> => {
	const prompt = buildPrompt(input);

	if (config.gemini_api_key) {
		try {
			return await callGemini(prompt, input);
		} catch (error) {
			console.warn(
				`Hosted Gemma call failed (${error instanceof Error ? error.message : error}); trying Ollama model ${config.ollama_model}`,
			);
		}
	}

	try {
		return await callOllama(prompt, input);
	} catch (error) {
		console.error("Ollama fallback failed:", error instanceof Error ? error.message : error);
		throw new AppError("AI explanation service is unavailable", httpStatus.BAD_GATEWAY);
	}
};

export default generateBoardExplanation;
