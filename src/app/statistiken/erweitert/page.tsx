import { redirect } from 'next/navigation';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export default function ExtendedStatisticsPage() {
  redirect('/statistik/erweitert');
}
