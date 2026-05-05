import type { NextFunction, Request, Response } from 'express';
import { clientService } from '../services/clientService.js';

export const clientController = {
  list(_req: Request, res: Response): void {
    res.json(clientService.list());
  },

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const client = clientService.create(req.body);
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  },
};
