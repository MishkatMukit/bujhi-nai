import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { assertEnv } from "../app/config/index";
import type { IBoardExplanation } from "../app/Interfaces/board.interface";
import connectDB from "../app/lib/mongoose";
import BoardExplanation from "../app/models/BoardExplanation.model";

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

type TSeedSample = Omit<IBoardExplanation, "_id" | "imageBase64" | "createdAt" | "updatedAt"> & {
	_id: string;
	imageFile: string;
};

const samples: TSeedSample[] = [
	{
		_id: "65f1a2b3c4d5e6f7a8b9c0d1",
		imageFile: "dfa-minimization.png",
		department: "CSE",
		semester: "3rd",
		courseDetected: "Theory of Computation",
		topicTitle: "DFA State Minimization",
		studentQuestion: "স্যার, q1 কে আলাদা করলাম বুঝলাম, কিন্তু q0 আর q2 একই state হবে কীভাবে?",
		hadAudioQuestion: false,
		cleanTranscription: `## DFA Minimization

Start from $P_0$: final states in one block, the rest in another.

$$P_0 = \\{q_0, q_1, q_2\\} \\mid \\{q_3\\}$$

Check transitions of every pair on each symbol:

- $q_1 \\xrightarrow{a} q_3$ (a final state), while $q_0 \\xrightarrow{a} q_1$
- so $q_1$ has to be separated

$$P_1 = \\{q_0, q_2\\} \\mid \\{q_1\\} \\mid \\{q_3\\}$$

$P_1$ is stable, so $q_0$ and $q_2$ merge. The minimal DFA has 3 states.`,
		specificAnswer:
			"তোমার প্রশ্নটা ঠিক জায়গায় — q0 আর q2 দেখতে আলাদা হলেও behavior একই। দুটো থেকেই 'a' দিলে q1-এ যাই, আর দুটোই non-final। তাই কোনো string দিয়ে তাদের আলাদা করা যায় না, minimal DFA-তে তারা একটাই state।",
		stepByStepBangla: [
			{
				stepNumber: 1,
				equationOrConcept: "P_0: final vs non-final",
				banglaExplanation:
					"প্রথম ধাপে states-গুলোকে দুই block-এ ভাগ করো: final state (q3) আর বাকি সব (q0, q1, q2)। এটাই initial partition P0।",
			},
			{
				stepNumber: 2,
				equationOrConcept: "Transition check on 'a'",
				banglaExplanation:
					"q1 থেকে 'a' দিলে q3-তে যাই, যেটা final block; কিন্তু q0 আর q2 থেকে 'a' দিলে q1-এ যাই। Target আলাদা block-এ, তাই q1 কে আলাদা করতে হবে।",
			},
			{
				stepNumber: 3,
				equationOrConcept: "P_1 = {q0,q2} | {q1} | {q3}",
				banglaExplanation:
					"এখন q0 আর q2 এর transition মিলাও — দুটোরই 'a' → q1, দুটোই non-final, তাই এই জোড়া আর ভাঙবে না।",
			},
			{
				stepNumber: 4,
				equationOrConcept: "Stable partition",
				banglaExplanation:
					"কোনো block আর ভাঙছে না, তাই P1 stable। q0 আর q2 merge হয়ে এক state, ফলে minimal DFA-তে ৩টা state: {q0,q2}, {q1}, {q3}।",
			},
		],
		examShortcutTip:
			"Exam-এ পুরো table না এঁকে শুধু সন্দেহভাজন জোড়া মিলাও: (q0,q2) একই block-এ থাকবে কি না দেখো — দুটোর transition একই target-এ গেলে আর ভাবতে হবে না।",
		practiceProblem: {
			question:
				"DFA: q0 (start), q1, q2, q3 (final); q0-a→q1, q1-b→q2, q2-a→q1, q1-a→q3। Minimal state সংখ্যা কত?",
			hint: "আগে final/non-final ভাগ করো, তারপর শুধু সন্দেহজনক জোড়াগুলোর transition মিলাও।",
			solution:
				"P0 = {q0,q1,q2}|{q3}; q1 আলাদা হয় কারণ q1-a→q3। P1 = {q0,q2}|{q1}|{q3} stable, তাই minimal DFA-তে ৩টা state।",
		},
		helpfulCount: 18,
		isSample: true,
	},
	{
		_id: "65f1a2b3c4d5e6f7a8b9c0d2",
		imageFile: "thevenin.png",
		department: "EEE",
		semester: "4th",
		courseDetected: "Electrical Circuits II",
		topicTitle: "Thevenin Equivalent Circuit",
		studentQuestion:
			"Load বাদ দিয়ে V_th বের করি, কিন্তু R_th বের করার সময় voltage source কে short করি কেন?",
		hadAudioQuestion: false,
		cleanTranscription: `## Thevenin Equivalent

Any linear two-terminal network can be replaced by $V_{th}$ in series with $R_{th}$.

1. Remove the load between $a$ and $b$.
2. $V_{th} = V_{oc}$ across the open terminals.
3. Turn off independent sources: voltage source -> short, current source -> open.
4. $R_{th}$ is the resistance seen from $a$-$b$.

$$V_{th} = 12 \\times \\frac{6}{4+6} = 7.2\\text{ V}$$

$$R_{th} = 4 \\parallel 6 = 2.4\\ \\Omega$$`,
		specificAnswer:
			"Voltage source কে short করি কারণ ideal voltage source-এর internal resistance শূন্য। Source টা off করতে হলে তার terminal voltage 0 V করতে হয়, আর 0 V মানে short circuit। Current source হলে উল্টো — open circuit, কারণ ideal current source-এর current 0 A।",
		stepByStepBangla: [
			{
				stepNumber: 1,
				equationOrConcept: "Remove the load",
				banglaExplanation:
					"প্রথমে a-b terminal থেকে load resistance খুলে ফেলো। Thevenin equivalent টা network-এর জন্য, load-এর জন্য না।",
			},
			{
				stepNumber: 2,
				equationOrConcept: "V_{th} = V_{oc}",
				banglaExplanation:
					"খোলা terminal-এ voltmeter বসালে যেটা পড়বে সেটাই V_th। Voltage divider দিয়ে: V_th = 12 × 6/(4+6) = 7.2 V।",
			},
			{
				stepNumber: 3,
				equationOrConcept: "Turn off independent sources",
				banglaExplanation:
					"Independent voltage source short, current source open। Dependent source কখনো off করা যাবে না, সেগুলো network-এ থেকে যায়।",
			},
			{
				stepNumber: 4,
				equationOrConcept: "R_{th} = 4 \\parallel 6",
				banglaExplanation:
					"a-b থেকে তাকিয়ে equivalent resistance বের করো: 4 Ω আর 6 Ω দুটোই terminal দুটোর মধ্যে, তাই parallel। R_th = (4×6)/(4+6) = 2.4 Ω।",
			},
		],
		examShortcutTip:
			"R_th বের করার সময় 4 Ω আর 6 Ω series নাকি parallel — confusion হলে terminal থেকে trace করো। দুটো resistor-ই a আর b-এর মধ্যে থাকলে parallel।",
		practiceProblem: {
			question:
				"12 V source-এর সাথে 4 Ω series, আর 6 Ω branch parallel; a-b terminal খোলা থাকলে V_th আর R_th কত?",
			hint: "V_th-এর জন্য voltage divider, R_th-এর জন্য voltage source short করে parallel combination।",
			solution: "V_th = 12 × 6/(4+6) = 7.2 V; R_th = (4×6)/(4+6) = 2.4 Ω।",
		},
		helpfulCount: 11,
		isSample: true,
	},
	{
		_id: "65f1a2b3c4d5e6f7a8b9c0d3",
		imageFile: "break-even.png",
		department: "BBA",
		semester: "5th",
		courseDetected: "Managerial Accounting",
		topicTitle: "Break-Even Point Analysis",
		studentQuestion: "Contribution margin দিয়ে BEP বের করব নাকি equation দিয়ে? কোনটা exam-এ দ্রুত?",
		hadAudioQuestion: false,
		cleanTranscription: `## Break-Even Point

At BEP, total revenue = total cost, so profit is zero.

$$\\text{BEP}_{units} = \\frac{FC}{P - VC}$$

$$\\text{BEP}_{taka} = \\frac{FC}{\\text{CM ratio}}$$

- $P$ = selling price per unit
- $VC$ = variable cost per unit
- $CM = P - VC$ = contribution margin
- $\\text{CM ratio} = CM / P$`,
		specificAnswer:
			"দুটোই একই জিনিস — $FC/(P-VC)$ আসলে contribution margin approach-ই। Unit-এ BEP চাইলে সূত্রে বসাও, টাকায় চাইলে CM ratio দিয়ে ভাগ করো। Equation পদ্ধতি লিখতে বেশি সময় লাগে, তাই exam-এ CM দিয়েই করো।",
		stepByStepBangla: [
			{
				stepNumber: 1,
				equationOrConcept: "Fixed cost আলাদা করো",
				banglaExplanation:
					"প্রথমে fixed cost (FC) বের করো — ভাড়া, salary, depreciation। এগুলো unit সংখ্যার সাথে বদলায় না।",
			},
			{
				stepNumber: 2,
				equationOrConcept: "CM = P - VC",
				banglaExplanation:
					"প্রতি unit-এ contribution margin = selling price − variable cost। এটাই প্রতি unit-এ fixed cost মেটানোর contribution।",
			},
			{
				stepNumber: 3,
				equationOrConcept: "BEP_{units} = FC / CM",
				banglaExplanation:
					"যেমন FC = 60,000 টাকা, P = 50, VC = 30 হলে CM = 20, তাই BEP = 60,000 ÷ 20 = 3,000 unit।",
			},
			{
				stepNumber: 4,
				equationOrConcept: "BEP_{taka} = BEP_{units} \\times P",
				banglaExplanation:
					"টাকায় BEP চাইলে unit × selling price, অথবা FC ÷ CM ratio। এখানে 3,000 × 50 = 1,50,000 টাকা।",
			},
		],
		examShortcutTip:
			"CM ratio = CM ÷ Sales। Multiple product থাকলে weighted average CM ব্যবহার করবে, নইলে উত্তর ভুল আসবে।",
		practiceProblem: {
			question:
				"FC = 80,000 টাকা, প্রতি unit selling price 40 টাকা, variable cost 24 টাকা। BEP কত unit এবং কত টাকা?",
			hint: "আগে CM বের করো, তারপর FC দিয়ে ভাগ করো।",
			solution:
				"CM = 40 − 24 = 16 টাকা; BEP = 80,000 ÷ 16 = 5,000 unit; টাকায় = 5,000 × 40 = 2,00,000 টাকা।",
		},
		helpfulCount: 6,
		isSample: true,
	},
];

const toDataUrl = async (file: string): Promise<string> => {
	const buffer = await fs.readFile(path.join(fixturesDir, file));
	return `data:image/png;base64,${buffer.toString("base64")}`;
};

const seed = async (): Promise<void> => {
	assertEnv();
	await connectDB();
	await BoardExplanation.init();

	let inserted = 0;
	let skipped = 0;

	for (const { imageFile, ...sample } of samples) {
		const existing = await BoardExplanation.exists({ _id: sample._id });

		if (existing) {
			skipped += 1;
			console.log(`skipped (already present): ${sample.topicTitle}`);
			continue;
		}

		await BoardExplanation.create({
			...sample,
			imageBase64: await toDataUrl(imageFile),
		});
		inserted += 1;
		console.log(`inserted: ${sample.topicTitle}`);
	}

	const total = await BoardExplanation.countDocuments({ isSample: true });
	console.log(
		`seed complete: ${inserted} inserted, ${skipped} skipped, ${total} sample board(s) in DB`,
	);

	await mongoose.disconnect();
};

seed().catch(async (error) => {
	console.error("seed failed:", error instanceof Error ? error.message : error);
	await mongoose.disconnect().catch(() => undefined);
	process.exit(1);
});
