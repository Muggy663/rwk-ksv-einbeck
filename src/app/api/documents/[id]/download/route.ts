import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { getMongoDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getMongoDb();
    const collection = db.collection('documents');
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $inc: { downloadCount: 1 },
        $set: { lastDownload: new Date() }
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Download-Tracking Fehler:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}