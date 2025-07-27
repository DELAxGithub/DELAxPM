import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyReview } from '../../../lib/weeklyReview';

export async function POST(request: NextRequest) {
  try {
    const result = await sendWeeklyReview();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // GET リクエストでも週報を実行できるようにする
  return POST(request);
}