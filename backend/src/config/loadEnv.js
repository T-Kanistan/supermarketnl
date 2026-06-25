import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to backend/.env (stable regardless of process cwd). */
export const BACKEND_ENV_PATH = path.resolve(__dirname, '../../.env');

let loaded = false;

/**
 * Load backend/.env once. Hosted platforms may inject vars directly — those are
 * preserved when the file is missing; when the file exists it is the source of truth.
 */
export const loadEnv = () => {
  if (loaded) {
    return { path: BACKEND_ENV_PATH, loadedFromFile: fs.existsSync(BACKEND_ENV_PATH) };
  }

  const fileExists = fs.existsSync(BACKEND_ENV_PATH);

  if (fileExists) {
    const result = dotenv.config({ path: BACKEND_ENV_PATH });
    if (result.error) {
      console.error(`[env] Failed to parse ${BACKEND_ENV_PATH}: ${result.error.message}`);
    } else {
      console.log(`[env] Loaded environment from ${BACKEND_ENV_PATH}`);
    }
  } else {
    console.warn(`[env] ${BACKEND_ENV_PATH} not found — using process environment only`);
  }

  loaded = true;
  return { path: BACKEND_ENV_PATH, loadedFromFile: fileExists };
};

loadEnv();
