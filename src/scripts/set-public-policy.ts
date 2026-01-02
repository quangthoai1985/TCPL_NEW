import { S3Client, PutBucketPolicyCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

const policy = {
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
    ]
};

async function setPolicy() {
    console.log(`Configuring MinIO Bucket: ${BUCKET_NAME}`);
    console.log(`Endpoint: ${process.env.S3_ENDPOINT}`);

    // Create bucket if not exists
    try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Created bucket ${BUCKET_NAME}`);
    } catch (e: any) {
        // Identify error code properly. S3 errors often have specific shapes.
        // Common codes: BucketAlreadyExists, BucketAlreadyOwnedByYou
        if (e.name === 'BucketAlreadyOwnedByYou' || e.name === 'BucketAlreadyExists') {
            console.log(`Bucket ${BUCKET_NAME} already exists.`);
        } else {
            console.log(`Note during creation (might be harmless if exists): ${e.message}`);
        }
    }

    // Set Policy
    try {
        const command = new PutBucketPolicyCommand({
            Bucket: BUCKET_NAME,
            Policy: JSON.stringify(policy),
        });

        await s3Client.send(command);
        console.log(`✅ Successfully set public read policy for bucket: ${BUCKET_NAME}`);
    } catch (error) {
        console.error("❌ Error setting policy:", error);
    }
}

setPolicy();
