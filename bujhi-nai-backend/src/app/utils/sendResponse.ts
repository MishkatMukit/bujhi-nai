import type { Response } from "express";

export type TMeta = { page: number; limit: number; total: number };

export type TResponseData<T> = {
	success: boolean;
	statusCode: number;
	message: string;
	data?: T;
	meta?: TMeta;
};

const sendResponse = <T>(res: Response, data: TResponseData<T>): void => {
	res.status(data.statusCode).json({
		success: data.success,
		statusCode: data.statusCode,
		message: data.message,
		data: data.data,
		meta: data.meta,
	});
};

export default sendResponse;
