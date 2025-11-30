import { MongoClient } from 'mongodb';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

// Prüfe, ob die MONGODB_URI-Umgebungsvariable definiert ist
const uri = process.env.MONGODB_URI;
if (!uri) {
  logWarn('MONGODB_URI ist nicht definiert. MongoDB-Features sind deaktiviert.');
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Globale Variable für die Entwicklung
let globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
  // In der Entwicklung verwenden wir eine globale Variable, damit die Verbindung
  // über Hot Reloads bestehen bleibt
  if (!globalWithMongo._mongoClientPromise && uri) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise || Promise.reject('MongoDB URI nicht definiert');
} else {
  // In der Produktion erstellen wir eine neue Verbindung
  if (uri) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } else {
    clientPromise = Promise.reject('MongoDB URI nicht definiert');
  }
}

// Exportieren Sie eine Funktion, um die Verbindung zu erhalten
export async function getMongoClient() {
  if (!uri) {
    return null;
  }
  try {
    return await clientPromise;
  } catch (error) {
    // Stille Behandlung - MongoDB ist optional für File Server
    return null;
  }
}

// Exportieren Sie eine Funktion, um die Datenbank zu erhalten
export async function getMongoDb(dbName = 'rwk_einbeck') {
  if (!uri) {
    return null;
  }
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    // Stille Behandlung - MongoDB ist optional für File Server
    return null;
  }
}
