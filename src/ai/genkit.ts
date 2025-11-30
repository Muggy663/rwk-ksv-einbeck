import {genkit} from 'genkit';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
