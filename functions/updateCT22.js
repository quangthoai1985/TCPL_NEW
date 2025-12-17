
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateCT22() {
  console.log('🔄 Đang cập nhật CT2.2...');

  try {
    const indicatorRef = db.collection('criteria')
      .doc('TC02')
      .collection('indicators')
      .doc('CT2.2');

    // Kiểm tra indicator có tồn tại không
    const doc = await indicatorRef.get();
    if (!doc.exists) {
      console.error('❌ Không tìm thấy indicator CT2.2');
      process.exit(1);
    }

    console.log('📋 Dữ liệu hiện tại của CT2.2:');
    const currentData = doc.data();
    console.log('  - parentCriterionId:', currentData.parentCriterionId);
    console.log('  - inputType:', currentData.inputType);
    console.log('  - standardLevel:', currentData.standardLevel);

    // Kiểm tra xem đã có parentCriterionId: TC01 chưa
    if (currentData.parentCriterionId === 'TC01') {
      console.log('✅ CT2.2 đã có parentCriterionId: TC01 rồi, không cần update');
      process.exit(0);
    }

    // Update indicator
    await indicatorRef.update({
      parentCriterionId: 'TC01', // Liên kết với TC01 để lấy assignedCount
      description: 'Số Nghị quyết của HĐND, Quyết định của UBND sau khi ban hành được công khai. Hệ thống tự động tính % theo thứ tự ưu tiên: (1) Số admin giao cụ thể, (2) Số admin giao theo lượng, (3) Số xã tự khai báo.',
    });

    console.log('✅ Đã cập nhật CT2.2 với parentCriterionId: TC01');

    // Verify
    const updatedDoc = await indicatorRef.get();
    const updatedData = updatedDoc.data();
    console.log('\n📋 Dữ liệu sau khi update:');
    console.log('  - parentCriterionId:', updatedData.parentCriterionId);
    console.log('  - description:', updatedData.description);

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
    process.exit(1);
  }

  process.exit(0);
}

updateCT22();
