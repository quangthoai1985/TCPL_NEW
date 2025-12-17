const admin = require('firebase-admin');

// Thay thế bằng đường dẫn đến file service-account-credentials.json của bạn
// Bạn có thể tải file này từ Firebase Console -> Project settings -> Service accounts -> Generate new private key
const serviceAccount = require('../service-account-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const INDICATOR_TO_DELETE = 'CT2.4.3';
const COLLECTION_NAME = 'assessments';

async function deleteIndicatorData() {
  console.log(`🔄 Bắt đầu xóa dữ liệu của chỉ tiêu '${INDICATOR_TO_DELETE}' trong collection '${COLLECTION_NAME}'...`);

  try {
    const assessmentsRef = db.collection(COLLECTION_NAME);
    const snapshot = await assessmentsRef.get();

    if (snapshot.empty) {
      console.log(`✅ Không tìm thấy tài liệu nào trong collection '${COLLECTION_NAME}'. Không có gì để xóa.`);
      return;
    }

    let documentsProcessed = 0;
    let documentsModified = 0;
    const batch = db.batch();

    snapshot.forEach(doc => {
      documentsProcessed++;
      const assessmentData = doc.data();
      if (assessmentData && assessmentData.assessmentData && assessmentData.assessmentData[INDICATOR_TO_DELETE]) {
        console.log(`  - Tìm thấy dữ liệu của '${INDICATOR_TO_DELETE}' trong tài liệu '${doc.id}'. Đang xóa...`);
        const fieldPath = new admin.firestore.FieldPath('assessmentData', INDICATOR_TO_DELETE);
        batch.update(doc.ref, { [fieldPath.toString()]: admin.firestore.FieldValue.delete() });
        documentsModified++;
      }
    });

    if (documentsModified > 0) {
      await batch.commit();
      console.log(`✅ Hoàn tất xóa dữ liệu. Đã xử lý ${documentsProcessed} tài liệu, sửa đổi ${documentsModified} tài liệu.`);
    } else {
      console.log(`✅ Đã xử lý ${documentsProcessed} tài liệu. Không tìm thấy dữ liệu của '${INDICATOR_TO_DELETE}' để xóa.`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
    process.exit(1);
  }

  console.log('Script hoàn thành.');
  process.exit(0);
}

deleteIndicatorData();