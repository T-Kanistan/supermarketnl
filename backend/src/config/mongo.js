import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
};

let listenersAttached = false;

const maskMongoUri = (uri) => {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return '[mongodb-uri-hidden]';
  }
};

export const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || !String(uri).trim()) {
    throw new Error(
      'MONGODB_URI is not configured. Set it in Railway Variables or backend/.env for local development.'
    );
  }

  return String(uri).trim();
};

const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Event: connected');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Event: disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Event: reconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error(`[MongoDB] Event: error — ${error.message}`);
  });
};

const logConnectionHelp = (error) => {
  const message = error?.message || '';

  if (message.includes('authentication failed') || message.includes('bad auth')) {
    console.error('[MongoDB] Authentication failed. Verify Atlas username, password, and URL encoding.');
  }

  if (message.includes('ENOTFOUND') || message.includes('querySrv')) {
    console.error('[MongoDB] DNS/cluster lookup failed. Verify the Atlas cluster hostname in MONGODB_URI.');
  }

  if (message.includes('timed out') || message.includes('Server selection')) {
    console.error(
      '[MongoDB] Connection timed out. In Atlas Network Access, allow 0.0.0.0/0 for Railway deployments.'
    );
  }
};

const connectMongo = async () => {
  attachConnectionListeners();

  if (mongoose.connection.readyState === 1) {
    console.log('[MongoDB] Already connected — reusing existing connection.');
    return mongoose.connection;
  }

  const uri = getMongoUri();

  try {
    console.log(`[MongoDB] Connecting to cluster: ${maskMongoUri(uri)}`);

    const connection = await mongoose.connect(uri, MONGO_OPTIONS);

    console.log('[MongoDB] Connection successful — Atlas cluster is reachable.');
    console.log(`[MongoDB] readyState=${mongoose.connection.readyState} (1 = connected)`);
    console.log(`[MongoDB] Host: ${connection.connection.host}`);
    console.log(`[MongoDB] Database: ${connection.connection.name}`);

    return connection;
  } catch (error) {
    console.error('[MongoDB] Connection failed.');
    console.error(`[MongoDB] Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    logConnectionHelp(error);
    throw error;
  }
};

export const disconnectMongo = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed.');
};

export const isMongoConnected = () => mongoose.connection.readyState === 1;

export default connectMongo;
