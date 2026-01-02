import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for MinIO
const s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'admin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'password',
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tcpl-files';

/**
 * Upload a file to MinIO
 * @param key - The path/filename in the bucket (e.g., "hoso/communeId/file.pdf")
 * @param body - The file content as Buffer
 * @param contentType - MIME type of the file
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
    key: string,
    body: Buffer,
    contentType: string
): Promise<string> {
    console.log(`[MinIO] Uploading: Bucket=${BUCKET_NAME}, Key=${key}, Size=${body.length} bytes, Type=${contentType}`);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentDisposition: 'inline',
    });

    try {
        const result = await s3Client.send(command);
        console.log(`[MinIO] Upload SUCCESS: ${key}`, result.$metadata?.httpStatusCode);
    } catch (error: any) {
        console.error(`[MinIO] Upload FAILED: ${key}`, error.message);
        throw error; // Re-throw to propagate
    }

    // Return the public URL (assuming bucket is public or we'll generate signed URL)
    const url = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
    console.log(`[MinIO] Returned URL: ${url}`);
    return url;
}

/**
 * Get a signed URL for downloading a file (valid for 1 hour)
 * @param key - The path/filename in the bucket
 * @returns Signed URL for the file
 */
export async function getFileUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
}

/**
 * Delete a file from MinIO
 * @param key - The path/filename in the bucket
 */
export async function deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * List files in a directory
 * @param prefix - The directory prefix (e.g., "hoso/communeId/")
 * @returns Array of file keys
 */
export async function listFiles(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map(item => item.Key || '') || [];
}

/**
 * Generate a file path for storage
 * @param communeId - The commune ID
 * @param category - The category (e.g., "registration", "evidence")
 * @param periodId - The assessment period ID
 * @param filename - The original filename
 * @returns Generated file path
 */
export function generateFilePath(
    communeId: string,
    category: string,
    periodId: string,
    filename: string
): string {
    // Sanitize filename
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    return `hoso/${communeId}/${category}/${periodId}/${timestamp}_${sanitizedFilename}`;
}

export { s3Client, BUCKET_NAME };
