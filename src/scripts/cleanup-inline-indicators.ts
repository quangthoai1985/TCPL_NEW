
/* eslint-disable no-console */
import { adminDb as db, admin } from '@/lib/firebase-admin';

// ========================================================================================
// SCRIPT XÓA TRƯỜNG "indicators" INLINE TRONG CRITERIA
// ========================================================================================
// MỤC ĐÍCH:
// - Script này quét qua tất cả các tài liệu trong collection 'criteria'.
// - Với mỗi tài liệu (ví dụ: TC01, TC02), nó sẽ xóa hoàn toàn trường `indicators`
//   là một mảng được lưu trực tiếp trong tài liệu đó.
// - Thao tác này KHÔNG ảnh hưởng đến subcollection 'indicators' lồng bên trong.
// - Mục đích là để làm sạch cơ sở dữ liệu, loại bỏ dữ liệu trùng lặp và chỉ
//   sử dụng subcollection làm nguồn dữ liệu duy nhất cho các chỉ tiêu.
// - Script này được thiết kế để chạy MỘT LẦN DUY NHẤT.
//
// HƯỚNG DẪN CHẠY:
// 1. Đảm bảo file `service-account-credentials.json` tồn tại ở thư mục gốc.
// 2. Mở terminal và chạy lệnh: `npm run cleanup:inline-indicators`
// ========================================================================================

async function main() {
    try {
        console.log("Bắt đầu quá trình quét và xóa trường 'indicators' inline...");

        const criteriaRef = db.collection('criteria');
        const snapshot = await criteriaRef.get();

        if (snapshot.empty) {
            console.log("Không tìm thấy tài liệu nào trong collection 'criteria'.");
            return;
        }
        
        let updatedCount = 0;
        const batch = db.batch();

        console.log(`Tìm thấy ${snapshot.docs.length} tài liệu tiêu chí. Đang kiểm tra...`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Kiểm tra xem trường 'indicators' có tồn tại dưới dạng mảng inline không
            if (data.indicators && Array.isArray(data.indicators)) {
                console.log(`- Tìm thấy trường 'indicators' inline trong tài liệu ID: ${doc.id}. Chuẩn bị xóa...`);
                
                // Sử dụng FieldValue.delete() để xóa hoàn toàn trường này
                batch.update(doc.ref, {
                    indicators: admin.firestore.FieldValue.delete()
                });
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(`\nĐang thực hiện xóa trường 'indicators' cho ${updatedCount} tài liệu...`);
            await batch.commit();
            console.log("Tất cả các cập nhật đã hoàn tất.");
        } else {
            console.log("\nKhông có tài liệu nào chứa trường 'indicators' inline cần xóa.");
        }

        console.log("\n=========================================");
        console.log(`✅ Script đã chạy xong. Đã cập nhật ${updatedCount} tài liệu tiêu chí.`);
        console.log("=========================================");

    } catch (error) {
        console.error("\n========================================");
        console.error("🔥 Đã xảy ra lỗi trong quá trình dọn dẹp:", error);
        console.error("========================================");
        process.exit(1);
    }
}

main();
