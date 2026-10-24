import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export const validateRequest = (schema: ZodType) => {
	return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
		try {
			req.body = await schema.parseAsync(req.body);
			next();
		} catch (error) {
			next(error);
		}
	};
};

export const validateQuery = (schema: ZodType) => {
	return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
		try {
			const parsed = await schema.parseAsync(req.query);
			// Express 5 exposes req.query as a prototype getter, so assigning to it
			// throws; redefine the own property with the parsed value instead.
			Object.defineProperty(req, "query", {
				value: parsed,
				writable: true,
				enumerable: true,
				configurable: true,
			});
			next();
		} catch (error) {
			next(error);
		}
	};
};

export const validateParams = (schema: ZodType) => {
	return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
		try {
			const parsed = (await schema.parseAsync(req.params)) as Record<string, unknown>;
			for (const key of Object.keys(req.params)) {
				if (!Object.hasOwn(parsed, key)) {
					delete req.params[key];
				}
			}
			Object.assign(req.params, parsed);
			next();
		} catch (error) {
			next(error);
		}
	};
};
