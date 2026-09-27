import { RequestModel } from '../models/index.js';

export async function generateRequestNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const total = await RequestModel.countDocuments();
  const nextNum = total + 1;
  const padded = String(nextNum).padStart(6, '0');
  return `GOV-${currentYear}-${padded}`;
}
