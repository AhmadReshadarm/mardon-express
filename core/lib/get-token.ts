import { Request } from "express";

export const getToken = (req: Request) => {
  const header = req.headers['authorization'];

  return header && header.split(' ')[1];
}