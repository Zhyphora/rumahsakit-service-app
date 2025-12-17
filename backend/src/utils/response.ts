import { Response } from "express";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  error?: string;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = "Created successfully"
): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  error?: string
): Response => {
  return res.status(statusCode).json({
    status: "error",
    message,
    error: error || message,
  });
};

export const sendNotFound = (
  res: Response,
  message: string = "Resource not found"
): Response => {
  return sendError(res, message, 404);
};

export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized"
): Response => {
  return sendError(res, message, 401);
};

export const sendForbidden = (
  res: Response,
  message: string = "Forbidden"
): Response => {
  return sendError(res, message, 403);
};

export const sendServerError = (
  res: Response,
  error: any,
  message: string = "Internal server error"
): Response => {
  console.error("Server error:", error);
  return res.status(500).json({
    status: "error",
    message,
    error: error.message || String(error),
  });
};
