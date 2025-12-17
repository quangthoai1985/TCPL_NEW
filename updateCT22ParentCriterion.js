const admin = require('firebase-admin');
const serviceAccount = require('./service-account-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateCT22() {
  const indicatorRef = db.collection('criteria')
    .doc('TC02')
    .collection('indicators')
    .doc('CT2.2');
  
  await indicatorRef.update({
    parentCriterionId: 'TC01', // ===== THÊM FIELD NÀY =====
    description: 'Số Nghị quyết của HĐND, Quyết định của UBND sau khi ban hành được công khai. Hệ thống tự động tính % dựa trên tổng số văn bản được giao.',
  });
  
  console.log('✅ Đã cập nhật CT2.2 với parentCriterionId: TC01');
}

updateCT22().then(() => process.exit(0));
