'use server';

import { uploadFile, generateFilePath, deleteFile } from '@/lib/minio';
import { verifyPdfSignature } from '@/lib/signature-verification';
import { addDays, parse, addBusinessDays } from 'date-fns';
import { convertOfficeToPdf } from '@/lib/gotenberg';

export async function uploadRegistrationFile(formData: FormData): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
        const file = formData.get('file') as File;
        const communeId = formData.get('communeId') as string;
        const periodId = formData.get('periodId') as string;

        if (!file || !communeId || !periodId) {
            return { success: false, error: 'Thiếu thông tin bắt buộc (file, communeId, periodId).' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const key = generateFilePath(communeId, 'registration', periodId, file.name);

        // uploadFile returns public URL string (bucket/key)
        const url = await uploadFile(key, buffer, file.type);

        return { success: true, url };
    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, error: error.message || "Lỗi tải tệp lên server." };
    }
}

export async function uploadEvidenceFile(formData: FormData): Promise<{
    success: boolean,
    url?: string,
    error?: string,
    signatureStatus?: "valid" | "expired" | "error" | "invalid",
    signatureError?: string,
    signerName?: string,
    signingTime?: Date,
    previewUrl?: string,
    previewError?: string
}> {
    try {
        const file = formData.get('file') as File;
        const communeId = formData.get('communeId') as string;
        const periodId = formData.get('periodId') as string;
        const indicatorId = formData.get('indicatorId') as string;

        // Optional verification params
        const issueDateStr = formData.get('issueDate') as string | null;
        const issuanceDeadlineDaysStr = formData.get('issuanceDeadlineDays') as string | null;

        if (!file || !communeId || !periodId || !indicatorId) {
            return { success: false, error: 'Thiếu thông tin bắt buộc (file, communeId, periodId, indicatorId).' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Custom path generation for evidence to include indicatorId
        // Original generateFilePath: hoso/{communeId}/{category}/{periodId}/{timestamp}_{filename}
        // We want: hoso/{communeId}/evidence/{periodId}/{indicatorId}/{timestamp}_{filename}

        const timestamp = Date.now();
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `hoso/${communeId}/evidence/${periodId}/${indicatorId}/${timestamp}_${sanitizedFilename}`;

        const url = await uploadFile(key, buffer, file.type);

        // --- Signature Verification Logic ---
        let verificationResult = {};
        if (file.type === 'application/pdf' && issueDateStr && issuanceDeadlineDaysStr) {
            try {
                const issueDate = parse(issueDateStr, 'dd/MM/yyyy', new Date());
                const days = parseInt(issuanceDeadlineDaysStr, 10);

                // Determine logic based on indicatorId (Ported from functions)
                // Default is addDays (calendar days)
                // CT2.4.1 (CT4 logic) uses addBusinessDays ?
                // checking functions/src/index.ts...
                // TC1 logic: addDays. 
                // CT2.4.1: addBusinessDays.

                let deadline: Date;
                if (indicatorId === 'CT2.4.1') {
                    deadline = addBusinessDays(issueDate, days);
                } else {
                    deadline = addDays(issueDate, days);
                }

                if (!isNaN(issueDate.getTime()) && !isNaN(days)) {
                    const verify = await verifyPdfSignature(buffer, issueDate, deadline);
                    verificationResult = {
                        signatureStatus: verify.status,
                        signatureError: verify.reason,
                        signerName: verify.signerName,
                        signingTime: verify.signingTime
                    };
                }
            } catch (e) {
                console.error("Signature verify error inside action:", e);
                verificationResult = { signatureStatus: 'error', signatureError: 'Lỗi kiểm tra chữ ký server.' };
            }
        }

        // --- Gotenberg Conversion Logic ---
        let previewUrl: string | undefined;
        let previewError: string | undefined;
        // Office extensions to convert
        const officeExtensions = ['.doc', '.docx', '.xls', '.xlsx'];
        const lowerName = file.name.toLowerCase();

        console.log(`DEBUG: Checking file '${file.name}' (lower: '${lowerName}') for conversion.`);
        const isOfficeFile = officeExtensions.some(ext => lowerName.endsWith(ext));
        console.log(`DEBUG: Is Office File? ${isOfficeFile}`);

        if (isOfficeFile) {
            try {
                console.log(`DEBUG: Starting conversion for ${file.name}...`);
                // Use original buffer for conversion
                const pdfBuffer = await convertOfficeToPdf(buffer, file.name);

                // Construct preview key
                const previewKey = key.replace(/\.[^/.]+$/, "") + "_preview.pdf";

                // Upload preview PDF
                previewUrl = await uploadFile(previewKey, pdfBuffer, 'application/pdf');
                console.log(`Conversion successful. Preview URL: ${previewUrl}`);
            } catch (convError: any) {
                console.error("Gotenberg conversion failed:", convError);
                previewError = convError.message || "Unknown conversion error";
            }
        }

        return { success: true, url, previewUrl, previewError, ...verificationResult };
    } catch (error: any) {
        console.error("Upload evidence error:", error);
        return { success: false, error: error.message || "Lỗi tải minh chứng lên server." };
    }
}

export async function deleteEvidenceFile(fileUrl: string): Promise<{ success: boolean, error?: string }> {
    try {
        if (!fileUrl) {
            return { success: false, error: "File URL is required" };
        }

        // URL format: http://minio-endpoint/bucket-name/key
        // Example: http://localhost:9000/tcpl-files/hoso/commune1/evidence/...
        // We need to extract the key.
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/');
        // pathParts[0] is empty, pathParts[1] is bucket name. Rest is key.
        // But BE CAREFUL: split('/') on "/bucket/key" -> ["", "bucket", "key"]

        // Let's assume the standard MinIO URL structure provided by `uploadFile`
        // `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`

        // A safer way might be to look for the known prefix "hoso/"
        const keyIndex = urlObj.pathname.indexOf('hoso/');
        if (keyIndex === -1) {
            // Fallback or error? specific logic for our app structure.
            // If we can't find 'hoso/', maybe try to slice after bucket name if we know it?
            // But we don't have bucket name in env available easily here without importing?
            // Actually minio.ts exports BUCKET_NAME but it's only available at runtime config.

            // Simplest is finding the substring after the bucket name part.
            // But pathParts way is relatively safe if we assume standard URL.
            // pathParts: ['', 'tcpl-files', 'hoso', ...]
            return { success: false, error: "Invalid file URL format" };
        }

        const key = urlObj.pathname.substring(keyIndex);

        // decodeURI to handle spaces/special chars in URL key
        const decodedKey = decodeURIComponent(key);

        await deleteFile(decodedKey);
        return { success: true };
    } catch (error: any) {
        console.error("Delete evidence error:", error);
        return { success: false, error: error.message || "Lỗi xóa minh chứng." };
    }
}
