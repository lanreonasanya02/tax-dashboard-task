import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { clientRoutes } from './routes/clientRoutes.js';
import { invoiceRoutes } from './routes/invoiceRoutes.js';
import { HttpError } from './services/httpError.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.use('/api/clients', clientRoutes);
  app.use('/api/invoices', invoiceRoutes);

  app.use(express.static(resolve(__dirname, '../public')));

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Express recognises this as the error middleware only because of the 4-arg signature.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
