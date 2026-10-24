import mongoose from "mongoose";
import config from "../config/index";

/** Opens the single Atlas connection used by the app and by scripts. */
const connectDB = async (): Promise<void> => {
	await mongoose.connect(config.mongodb_uri, {
		dbName: "bujhi_nai_iiuc",
	});

	console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

export default connectDB;
