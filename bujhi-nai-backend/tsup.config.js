export default {
	entry: ["src/server.ts"],
	outDir: "dist",
	format: ["esm"],
	platform: "node",
	target: "node20",
	clean: true,
	sourcemap: true,
	dts: false,
};
