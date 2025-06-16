import { MongoClient } from 'mongodb';

// Prüfe, ob die MONGODB_URI-Umgebungsvariable definiert ist
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI ist nicht definiert. Bitte überprüfen Sie Ihre .env.local-Datei.');
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
    throw new Error('MongoDB URI nicht definiert');
  }
  return clientPromise;
}

// Exportieren Sie eine Funktion, um die Datenbank zu erhalten
export async function getMongoDb(dbName = 'rwk_einbeck') {
  if (!uri) {
    throw new Error('MongoDB URI nicht definiert');
  }
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('Fehler beim Verbinden mit MongoDB:', error);
    throw error;
  }
}