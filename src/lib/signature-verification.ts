
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";

export interface SignatureVerificationResult {
    isValid: boolean;
    status: "valid" | "expired" | "error" | "invalid";
    reason?: string;
    signerName?: string;
    signingTime?: Date;
}

function parsePdfDate(raw: string): Date | null {
    if (!raw) return null;
    try {
        const clean = raw.replace("D:", "").slice(0, 14); // YYYYMMDDHHmmss
        const year = parseInt(clean.slice(0, 4), 10);
        const month = parseInt(clean.slice(4, 6), 10) - 1;
        const day = parseInt(clean.slice(6, 8), 10);
        const hour = parseInt(clean.slice(8, 10), 10);
        const minute = parseInt(clean.slice(10, 12), 10);
        const second = parseInt(clean.slice(12, 14), 10);

        const dateInUTC = new Date(Date.UTC(year, month, day, hour, minute, second));
        // Adjust for timezone (original code subtracted 7 hours from UTC date constructed manually??)
        // Wait, original code: 
        // const dateInUTC = new Date(Date.UTC(year, month, day, hour, minute, second));
        // dateInUTC.setHours(dateInUTC.getHours() - 7);
        // This likely converts UTC to Vietnam time (UTC+7) but subtracts? 
        // If the date string is D:20241225...Z, it is UTC.
        // If it is D:20241225... it might be local to signer.
        // Assuming Vietnam context and typical PDF signing tools.
        // I will keep original logic: setHours - 7.
        dateInUTC.setHours(dateInUTC.getHours() - 7);
        return dateInUTC;
    } catch (e) {
        console.error("Failed to parse PDF date string:", raw, e);
        return null;
    }
}

async function extractSignatureInfo(pdfBuffer: Buffer): Promise<{ name: string | null; signDate: Date | null }[]> {
    const signatures: { name: string | null; signDate: Date | null }[] = [];
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer, { updateMetadata: false, ignoreEncryption: true });
        const acroForm = pdfDoc.getForm();
        const fields = acroForm.getFields();

        for (const field of fields) {
            const fieldType = field.acroField.FT()?.toString();
            if (fieldType === "/Sig") {
                const sigDict = field.acroField.V();

                if (sigDict instanceof PDFDict) {
                    const nameRaw = sigDict.get(PDFName.of("Name"))?.toString();
                    const signDateRaw = sigDict.get(PDFName.of("M"))?.toString();

                    const name = nameRaw ? nameRaw.substring(1, nameRaw.length - 1) : null; // Remove parens ()
                    // original: nameRaw.substring(1) -> maybe PDF lib returns differntly?
                    // pdf-lib toString returns `(Name)` usually.
                    // Original code: nameRaw.substring(1).
                    // Let's be safe.
                    const cleanName = nameRaw ? nameRaw.replace(/^\(/, '').replace(/\)$/, '') : null;

                    const signDate = signDateRaw ? parsePdfDate(signDateRaw.substring(1, signDateRaw.length - 1)) : null;

                    if (signDate) {
                        signatures.push({ name: cleanName, signDate });
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error extracting signature:", error);
    }
    return signatures;
}

export async function verifyPdfSignature(
    fileBuffer: Buffer,
    issueDate: Date,
    deadline: Date
): Promise<SignatureVerificationResult> {
    try {
        const signatures = await extractSignatureInfo(fileBuffer);

        if (signatures.length === 0) {
            return {
                isValid: false,
                status: "error",
                reason: "Không tìm thấy chữ ký điện tử nào trong tài liệu."
            };
        }

        const firstSignature = signatures[0];
        const signingTime = firstSignature.signDate;

        if (!signingTime) {
            return {
                isValid: false,
                status: "error",
                reason: "Chữ ký không chứa thông tin ngày ký."
            };
        }

        // Compare dates
        const isLate = signingTime > deadline;
        const isEarly = signingTime < issueDate;

        if (isLate) {
            return {
                isValid: false,
                status: "expired",
                reason: `Ký sau thời hạn (${deadline.toLocaleDateString("vi-VN")})`,
                signerName: firstSignature.name || undefined,
                signingTime
            };
        }

        if (isEarly) {
            return {
                isValid: false,
                status: "error", // Or invalid
                reason: `Ký trước ngày ban hành (${issueDate.toLocaleDateString("vi-VN")})`,
                signerName: firstSignature.name || undefined,
                signingTime
            };
        }

        return {
            isValid: true,
            status: "valid",
            signerName: firstSignature.name || undefined,
            signingTime
        };

    } catch (e: any) {
        return {
            isValid: false,
            status: "error",
            reason: `Lỗi xử lý file: ${e.message}`
        };
    }
}
