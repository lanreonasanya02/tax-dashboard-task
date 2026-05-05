import { Router } from 'express';
import { clientController } from '../controllers/clientController.js';

export const clientRoutes: Router = Router();

clientRoutes.get('/', clientController.list);
clientRoutes.post('/', clientController.create);
