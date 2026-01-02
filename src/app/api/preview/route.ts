import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client for MinIO
const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'password',
    },
    forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tcpl-files';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const format = searchParams.get('format'); // 'base64' for JSON response

    if (!fileUrl) {
        return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    try {
        console.log('Preview proxy: Processing', fileUrl);

        // Extract key from URL
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/');
        const key = pathParts.slice(2).join('/');

        console.log('Preview proxy: Fetching key', key, 'from bucket', BUCKET_NAME);

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: 'Empty file' }, { status: 404 });
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        // @ts-ignore - response.Body is a readable stream
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const contentType = response.ContentType || 'application/pdf';

        // If base64 format requested, return as JSON (bypasses IDM)
        if (format === 'base64') {
            const base64Data = buffer.toString('base64');
            return NextResponse.json({
                data: base64Data,
                contentType: contentType,
                size: buffer.length
            });
        }

        console.log('Preview proxy: Success, returning', buffer.length, 'bytes as', contentType);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': 'inline',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error: any) {
        console.error('Preview proxy error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
