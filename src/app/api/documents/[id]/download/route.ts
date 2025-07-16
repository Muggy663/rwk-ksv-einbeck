import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getMongoDb();
    const collection = db.collection('documents');
    
    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $inc: { downloadCount: 1 },
        $set: { lastDownload: new Date() }
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Download-Tracking Fehler:', error);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}