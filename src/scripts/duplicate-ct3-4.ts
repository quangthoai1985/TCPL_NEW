import * as admin from 'firebase-admin';
   
// This script assumes that the service-account-credentials.json is in the root directory
const serviceAccount = require('../../service-account-credentials.json');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function duplicateCT3_4() {
  try {
    // Đọc document gốc CT3.4
    const sourceRef = db.collection('criteria').doc('TC03').collection('indicators').doc('CT3.4');
    const sourceDoc = await sourceRef.get();
    
    if (!sourceDoc.exists) {
      console.error('❌ Không tìm thấy document CT3.4');
      return;
    }
    
    const sourceData = sourceDoc.data();
    if (!sourceData) {
        console.error('❌ Document CT3.4 không có dữ liệu.');
        return;
    }
    console.log('✅ Đã đọc document CT3.4');
    
    // Tạo 4 documents mới
    const newIds = ['CT3.4.1', 'CT3.4.2', 'CT3.4.3', 'CT3.4.4'];
    const batch = db.batch();
    
    for (const newId of newIds) {
      const newRef = db.collection('criteria').doc('TC03').collection('indicators').doc(newId);
      
      // Copy toàn bộ data, chỉ thay đổi id và name
      const newData = {
        ...sourceData,
        id: newId,
        name: sourceData.name.replace('Chỉ tiêu 4', `4. ${newId.split('.')[2]}`), // Simple name change
        originalParentIndicatorId: 'CT3.4', // Set original parent ID
      };
      
      batch.set(newRef, newData);
      console.log(`📝 Chuẩn bị tạo: ${newId}`);
    }
    
    // Commit batch
    await batch.commit();
    console.log('✅ Đã tạo thành công 4 documents mới!');
    
    // Liệt kê kết quả
    console.log('\n📋 Danh sách documents đã tạo:');
    for (const newId of newIds) {
      const doc = await db.collection('criteria').doc('TC03').collection('indicators').doc(newId).get();
      console.log(`   - ${newId}: ${doc.data()?.name}`);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    // Không tự động thoát để cho phép các tiến trình khác hoàn tất
    // process.exit(0);
  }
}

duplicateCT3_4();
