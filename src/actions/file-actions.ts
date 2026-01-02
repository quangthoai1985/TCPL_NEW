'use server';

import { uploadFile, deleteFile, generateFilePath, getFileUrl } from '@/lib/minio';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Upload a file for a commune registration or assessment
 * @returns The URL of the uploaded file, or an error message
 */
export async function uploadRegistrationFile(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Unauthorized' };
        }

        const file = formData.get('file') as File;
        const periodId = formData.get('periodId') as string;
        const communeId = (session.user as any).communeId;

        if (!file || !periodId || !communeId) {
            return { success: false, error: 'Missing required fields' };
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate file path
        const filePath = generateFilePath(communeId, 'registration', periodId, file.name);

        // Upload to MinIO
        const url = await uploadFile(filePath, buffer, file.type);

        revalidatePath('/dashboard');
        revalidatePath('/commune/assessments');

        return { success: true, url };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Upload failed' };
    }
}

/**
 * Upload evidence file for an assessment indicator
 */
export async function uploadEvidenceFile(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Unauthorized' };
        }

        const file = formData.get('file') as File;
        const periodId = formData.get('periodId') as string;
        const indicatorId = formData.get('indicatorId') as string;
        const communeId = (session.user as any).communeId;

        if (!file || !periodId || !communeId) {
            return { success: false, error: 'Missing required fields' };
        }

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate file path with indicator info
        const category = `evidence/${indicatorId}`;
        const filePath = generateFilePath(communeId, category, periodId, file.name);

        // Upload to MinIO
        const url = await uploadFile(filePath, buffer, file.type);

        return { success: true, url };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Upload failed' };
    }
}

/**
 * Delete a file from storage
 */
export async function deleteStorageFile(
    fileUrl: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Unauthorized' };
        }

        // Extract key from URL (assumes format: endpoint/bucket/key)
        const urlParts = fileUrl.split('/');
        const key = urlParts.slice(4).join('/'); // Skip protocol, domain, bucket

        await deleteFile(key);

        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'Delete failed' };
    }
}

/**
 * Get a signed URL for downloading a file
 */
export async function getSignedDownloadUrl(
    key: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user) {
            return { success: false, error: 'Unauthorized' };
        }

        const url = await getFileUrl(key);
        return { success: true, url };
    } catch (error) {
        console.error('Get URL error:', error);
        return { success: false, error: 'Failed to get URL' };
    }
}
