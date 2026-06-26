import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// __dirname is e:\Supermarket\supermarketnl\backend\src\config
export const UPLOAD_ROOT = path.resolve(__dirname, '../uploads');

export default { UPLOAD_ROOT };
