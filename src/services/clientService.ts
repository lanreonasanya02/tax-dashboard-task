import { clientModel } from '../models/clientModel.js';
import type { Client } from '../models/types.js';
import { HttpError } from './httpError.js';

function requireString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new HttpError(400, `${field} must not be empty`);
  }
  if (trimmed.length > max) {
    throw new HttpError(400, `${field} must be ${max} characters or fewer`);
  }
  return trimmed;
}

export const clientService = {
  list(): Client[] {
    return clientModel.list();
  },

  create(body: unknown): Client {
    if (typeof body !== 'object' || body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }
    const { name, email } = body as Record<string, unknown>;
    const cleanName = requireString(name, 'name', 120);
    const cleanEmail = requireString(email, 'email', 200);

    const id = clientModel.insert(cleanName, cleanEmail);
    const created = clientModel.findById(id);
    if (!created) {
      throw new HttpError(500, 'Failed to load created client');
    }
    return created;
  },
};
