
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

const groupConfigs = [
  {
    criterionId: 'TC02',
    parentId: 'CT2.4',
    parentData: {
      id: 'CT2.4',
      name: '2.4. Ban hành và tổ chức thực hiện kế hoạch phổ biến, giáo dục pháp luật hằng năm theo quy định của pháp luật về phổ biến, giáo dục pháp luật',
      description: 'Nhóm chỉ tiêu về kế hoạch phổ biến, giáo dục pháp luật',
      inputType: 'group_header',
      standardLevel: 'Đạt tất cả các chỉ tiêu con',
      order: 4,
      parentCriterionId: 'TC02',
      passRule: {
        type: 'all',
      },
    },
    childIds: ['CT2.4.1', 'CT2.4.2', 'CT2.4.3'],
  },
  {
    criterionId: 'TC02',
    parentId: 'CT2.6',
    parentData: {
      id: 'CT2.6',
      name: '2.6. Bảo đảm nguồn lực về con người và kinh phí, cơ sở vật chất, phương tiện để triển khai công tác phổ biến, giáo dục pháp luật theo quy định của pháp luật về phổ biến, giáo dục pháp luật',
      description: 'Nhóm chỉ tiêu về nguồn lực phổ biến, giáo dục pháp luật',
      inputType: 'group_header',
      standardLevel: 'Đạt tất cả các chỉ tiêu con',
      order: 6,
      parentCriterionId: 'TC02',
      passRule: {
        type: 'all',
      },
    },
    childIds: ['CT2.6.1', 'CT2.6.2', 'CT2.6.3'],
  },
];

async function setupBatch2() {
  try {
    console.log('🚀 Bắt đầu setup Batch 2 - Tạo mới documents cha (CT2.4, CT2.6)...\n');

    for (const config of groupConfigs) {
      const indicatorsRef = db
        .collection('criteria')
        .doc(config.criterionId)
        .collection('indicators');

      console.log(`📦 Xử lý nhóm ${config.parentId}...`);

      // 1. Kiểm tra xem parent đã tồn tại chưa
      const parentDoc = await indicatorsRef.doc(config.parentId).get();
      
      if (parentDoc.exists) {
        console.log(`   ⚠️ ${config.parentId} đã tồn tại. Cập nhật thay vì tạo mới.`);
        await indicatorsRef.doc(config.parentId).update({
          inputType: 'group_header',
          passRule: config.parentData.passRule,
          standardLevel: config.parentData.standardLevel,
        });
      } else {
        // Tạo mới parent document
        await indicatorsRef.doc(config.parentId).set(config.parentData);
        console.log(`   ✅ Đã tạo mới ${config.parentId}`);
      }

      // 2. Cập nhật children với originalParentIndicatorId
      const batch = db.batch();
      let childrenUpdated = 0;
      
      for (const childId of config.childIds) {
        const childRef = indicatorsRef.doc(childId);
        const childDoc = await childRef.get();
        
        if (!childDoc.exists) {
          console.warn(`   ⚠️ Không tìm thấy ${childId}. Bỏ qua.`);
          continue;
        }
        
        batch.update(childRef, {
          originalParentIndicatorId: config.parentId,
        });
        childrenUpdated++;
        console.log(`   ✅ Cập nhật ${childId}`);
      }
      
      if (childrenUpdated > 0) {
        await batch.commit();
      }
      
      console.log(`   ✅ Hoàn thành nhóm ${config.parentId} (${childrenUpdated}/${config.childIds.length} con)\n`);
    }

    console.log('🎉 Batch 2 hoàn thành!\n');
    console.log('📋 Tóm tắt:');
    console.log('   - CT2.4: Tạo mới parent + cập nhật 3 con');
    console.log('   - CT2.6: Tạo mới parent + cập nhật 3 con');
    console.log('\n💡 Tiếp theo: Refresh trang web và kiểm tra UI');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

setupBatch2();
