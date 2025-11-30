// Export Firebase configuration and instances
import { db, auth, storage, functions } from './config';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export { db, auth, storage, functions };
