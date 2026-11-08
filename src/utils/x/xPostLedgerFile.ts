import fs from 'fs';
import { X_POST_LEDGER_PATH } from '../../constants/xPost';
import {
  emptyXPostLedger,
  parseXPostLedger,
  type XPostLedger,
} from './xPostLedger';

/**
 * Absolute ledger path for a checkout.
 */
export function xPostLedgerFilePath(cwd: string): string {
  return `${cwd.replace(/\/$/, '')}/${X_POST_LEDGER_PATH}`;
}

/**
 * Reads the ledger. A missing file is an empty ledger.
 * Invalid JSON fails closed.
 */
export function readLedgerFile(filePath: string): XPostLedger {
  if (!fs.existsSync(filePath)) return emptyXPostLedger();
  const raw: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return parseXPostLedger(raw);
}

/**
 * Writes the ledger as formatted JSON.
 */
export function writeLedgerFile(filePath: string, ledger: XPostLedger): void {
  const checked = parseXPostLedger(ledger);
  fs.writeFileSync(filePath, `${JSON.stringify(checked, null, 2)}\n`, 'utf8');
}
