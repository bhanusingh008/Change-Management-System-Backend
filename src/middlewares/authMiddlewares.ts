import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface CustomUserReq extends Request {
  user_id?: number;
  user_role?: number;
}

const authMiddleware = (
  req: CustomUserReq,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer token

  if (!token) {
    res
      .status(401)
      .json({ message: "No token provided, authorization denied" });
    return;
  }

  try {
    const decoded: any = jwt.verify(token, "jwt_token");
    req.user_id = decoded.userId;
    req.user_role = decoded.role;
    next(); // Call the next middleware or route handler
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
    return;
  }
};

export default authMiddleware;
