
import { type Readable } from 'stream';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://127.0.0.1:8989';

/**
 * Converts an Office document (Word, Excel) to PDF using Gotenberg.
 * @param fileBuffer The buffer of the file to convert.
 * @param filename The original filename (helper for Gotenberg to detect type).
 * @returns Buffer of the converted PDF.
 */
export async function convertOfficeToPdf(fileBuffer: Buffer, filename: string): Promise<Buffer> {
    const formData = new FormData();

    // Create a Blob from the buffer (Ensure Uint8Array compatibility)
    const blob = new Blob([new Uint8Array(fileBuffer)]);
    formData.append('files', blob, filename);

    try {
        const response = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gotenberg conversion failed: ${response.status} - ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Gotenberg error:", error);
        throw error;
    }
}
