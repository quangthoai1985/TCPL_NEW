'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { UnitAndUserImport, User } from '@/lib/data';

// Hàm tiện ích chuyển đổi số điện thoại sang định dạng E.164
const convertToE164 = (phoneNumber?: string): string | undefined => {
    if (!phoneNumber) return undefined;
    let cleanNumber = phoneNumber.replace(/\s+/g, '');
    if (cleanNumber.startsWith('+')) return cleanNumber;
    if (cleanNumber.startsWith('0')) return `+84${cleanNumber.substring(1)}`;
    if (cleanNumber.startsWith('84')) return `+${cleanNumber}`;
    return cleanNumber;
};

const generateRandomPhoneNumber = (): string => {
    const prefixes = ['090', '091', '092', '093', '094', '095', '096', '097', '098', '099', '086', '088', '089', '032', '033', '034', '035', '036', '037', '038', '039', '070', '079', '077', '076', '078', '081', '082', '083', '084', '085', '056', '058', '059'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000).toString().substring(1);
    return `${prefix}${suffix}`;
};

type ServerActionResult = {
    success: boolean;
    message?: string;
    error?: string;
    userId?: string;
};

export async function createUser(userData: Omit<User, 'id'>, password: string): Promise<ServerActionResult> {
    try {
        console.log(`Creating user: ${userData.username}`);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { username: userData.username },
        });

        if (existingUser) {
            return { success: false, error: 'Tên đăng nhập (email) đã tồn tại.' };
        }

        const newUser = await prisma.user.create({
            data: {
                username: userData.username,
                password: password, // Note: In production, hash this password!
                displayName: userData.displayName,
                phoneNumber: convertToE164(userData.phoneNumber),
                role: userData.role,
                communeId: userData.communeId,
            },
        });

        console.log(`User created with ID: ${newUser.id}`);
        revalidatePath('/admin/users');
        return { success: true, message: "Người dùng đã được tạo thành công.", userId: newUser.id };
    } catch (error: any) {
        console.error("Error creating user:", error);
        return { success: false, error: error.message || "Không thể tạo người dùng." };
    }
}

export async function updateUser(userData: User): Promise<ServerActionResult> {
    try {
        const { id, ...dataToUpdate } = userData;
        if (!id) throw new Error("User ID is required for update.");

        console.log(`Updating user: ${id}`);

        await prisma.user.update({
            where: { id },
            data: {
                username: dataToUpdate.username,
                displayName: dataToUpdate.displayName,
                phoneNumber: convertToE164(dataToUpdate.phoneNumber),
                role: dataToUpdate.role,
                communeId: dataToUpdate.communeId,
            },
        });

        console.log(`Successfully updated user: ${id}`);
        revalidatePath('/admin/users');
        return { success: true, message: "Thông tin người dùng đã được cập nhật." };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { success: false, error: error.message || "Không thể cập nhật người dùng." };
    }
}

export async function deleteUser(userId: string): Promise<ServerActionResult> {
    try {
        if (!userId) throw new Error("User ID is required for deletion.");

        console.log(`Deleting user: ${userId}`);
        await prisma.user.delete({
            where: { id: userId },
        });

        console.log(`Successfully deleted user: ${userId}`);
        revalidatePath('/admin/users');
        return { success: true, message: "Người dùng đã được xóa." };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message || "Không thể xóa người dùng." };
    }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<ServerActionResult> {
    try {
        if (!userId || !newPassword) throw new Error("User ID and new password are required.");

        console.log(`Resetting password for user: ${userId}`);
        await prisma.user.update({
            where: { id: userId },
            data: { password: newPassword },
        });

        console.log(`Successfully reset password for user: ${userId}`);
        return { success: true, message: "Mật khẩu đã được đặt lại thành công." };
    } catch (error: any) {
        console.error("Error resetting password:", error);
        return { success: false, error: error.message || "Không thể đặt lại mật khẩu." };
    }
}

export async function importUnitsAndUsers(data: UnitAndUserImport[]): Promise<{ successCount: number, errorCount: number, errors: string[] }> {
    const results = { successCount: 0, errorCount: 0, errors: [] as string[] };

    for (const [index, row] of data.entries()) {
        const rowIndex = index + 2;
        try {
            // Upsert Unit
            await prisma.unit.upsert({
                where: { id: row.unitId },
                update: {
                    name: row.unitName,
                    type: 'commune',
                    parentId: row.unitParentId,
                    address: row.unitAddress,
                    headquarters: row.unitHeadquarters
                },
                create: {
                    id: row.unitId,
                    name: row.unitName,
                    type: 'commune',
                    parentId: row.unitParentId,
                    address: row.unitAddress,
                    headquarters: row.unitHeadquarters
                }
            });

            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { username: row.userEmail }
            });

            if (existingUser) {
                throw new Error(`Người dùng với email '${row.userEmail}' đã tồn tại.`);
            }

            const userPhoneNumber = row.userPhoneNumber || generateRandomPhoneNumber();

            // Create User
            await prisma.user.create({
                data: {
                    username: row.userEmail,
                    password: row.userPassword,
                    displayName: row.userDisplayName,
                    phoneNumber: convertToE164(userPhoneNumber),
                    role: 'commune_staff',
                    communeId: row.unitId,
                }
            });

            results.successCount++;
        } catch (error: any) {
            results.errorCount++;
            const errorMessage = error.message || "Lỗi không xác định";
            const finalError = `Dòng ${rowIndex}: ${errorMessage}`;
            console.error(finalError);
            results.errors.push(finalError);
        }
    }

    revalidatePath('/admin/users');
    return results;
}
