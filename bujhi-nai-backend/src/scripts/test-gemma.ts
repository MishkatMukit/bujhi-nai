import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertEnv } from "../app/config/index";
import { generateBoardExplanation } from "../app/lib/gemma";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

const image = await fs.readFile(path.join(fixturesDir, "dfa-minimization.png"));
const imageBase64 = `data:image/png;base64,${image.toString("base64")}`;

assertEnv();

const result = await generateBoardExplanation({
	imageBase64,
	department: "CSE",
	textQuestion: "৩ নম্বর লাইনটা বুঝি নাই — q1 আর q2 কেন আলাদা?",
});

console.log(`provider: ${result.provider} (${result.model})`);
console.log(JSON.stringify(result.content, null, 2));

const bengali = /[\u0980-\u09FF]/;
const { content } = result;
const checks = {
	banglaInSpecificAnswer: bengali.test(content.specificAnswer),
	banglaInEveryStep:
		content.stepByStepBangla.length > 0 &&
		content.stepByStepBangla.every((step) => bengali.test(step.banglaExplanation)),
	nonEmptySteps: content.stepByStepBangla.length > 0,
	onePracticeProblem:
		typeof content.practiceProblem.question === "string" &&
		content.practiceProblem.question.length > 0 &&
		content.practiceProblem.hint.length > 0 &&
		content.practiceProblem.solution.length > 0,
	serverOwnedFieldsAbsent: !("department" in content) && !("helpfulCount" in content),
};

// Model-quality hint, not a hard requirement: the local Ollama fallback often
// writes plain ASCII math, while the hosted model emits LaTeX.
const warnings = {
	latexInTranscription: /\$[^$]+\$|\$\$[\s\S]+\$\$/.test(content.cleanTranscription),
};

console.log("checks:", checks);
console.log("warnings:", warnings);

if (!Object.values(checks).every(Boolean)) {
	console.error("smoke test failed");
	process.exitCode = 1;
}
