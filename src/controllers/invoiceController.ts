import type { NextFunction, Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService.js';
import { HttpError } from '../services/httpError.js';

export const invoiceController = {
  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const invoice = invoiceService.create(req.body);
      res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  },

  summary(req: Request, res: Response, next: NextFunction): void {
    try {
      const raw = req.query.client_id;
      let clientId: number | undefined;
      if (raw !== undefined) {
        if (typeof raw !== 'string') {
          throw new HttpError(400, 'client_id must be a single value');
        }
        const parsed = Number(raw);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw new HttpError(400, 'client_id must be a positive integer');
        }
        clientId = parsed;
      }
      res.json(invoiceService.summary(clientId));
    } catch (err) {
      next(err);
    }
  },

  markPaid(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        throw new HttpError(400, 'invoice id must be a positive integer');
      }
      const updated = invoiceService.markPaid(id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};
