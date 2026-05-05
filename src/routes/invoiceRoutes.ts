import { Router } from 'express';
import { invoiceController } from '../controllers/invoiceController.js';

export const invoiceRoutes: Router = Router();

invoiceRoutes.post('/', invoiceController.create);
invoiceRoutes.get('/summary', invoiceController.summary);
invoiceRoutes.patch('/:id/pay', invoiceController.markPaid);
