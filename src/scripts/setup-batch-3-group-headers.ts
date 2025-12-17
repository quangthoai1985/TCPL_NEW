
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
    parentId: 'CT2.7',
    parentData: {
      id: 'CT2.7',
      name: '2.7. Thông tin, giới thiệu về trợ giúp pháp lý theo quy định của pháp luật về trợ giúp pháp lý',
      description: 'Nhóm chỉ tiêu về truyền thông trợ giúp pháp lý',
      inputType: 'group_header',
      standardLevel: 'Đạt tất cả các chỉ tiêu con',
      order: 7,
      parentCriterionId: 'TC02',
      passRule: {
        type: 'all',
      },
    },
    childIds: ['CT2.7.1', 'CT2.7.2', 'CT2.7.3'],
  },
  {
    criterionId: 'TC03',
    parentId: 'CT3.2',
    parentData: {
      id: 'CT3.2',
      name: '3.2. Các mâu thuẫn, tranh chấp, vi phạm pháp luật thuộc phạm vi hòa giải ở cơ sở được hòa giải kịp thời, hiệu quả theo quy định của pháp luật về hòa giải ở cơ sở',
      description: 'Nhóm chỉ tiêu về hiệu quả hòa giải',
      inputType: 'group_header',
      standardLevel: 'Đạt tất cả các chỉ tiêu con',
      order: 2,
      parentCriterionId: 'TC03',
      passRule: {
        type: 'all',
      },
    },
    childIds: ['CT3.2.1', 'CT3.2.2'],
  },
];

async function setupBatch3() {
  try {
    console.log('🏁 Bắt đầu setup Batch 3 (CUỐI CÙNG) - Tạo mới documents cha (CT2.7, CT3.2)...\n');

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

    console.log('🎉🎉🎉 Batch 3 hoàn thành! 🎉🎉🎉\n');
    console.log('📋 Tóm tắt Batch 3:');
    console.log('   - CT2.7: Tạo mới parent + cập nhật 3 con');
    console.log('   - CT3.2: Tạo mới parent + cập nhật 2 con');
    console.log('\n🏆 HOÀN TẤT TOÀN BỘ CẤU TRÚC CHA-CON!');
    console.log('═══════════════════════════════════════');
    console.log('✅ TC02: 4 nhóm (CT2.1, CT2.4, CT2.6, CT2.7)');
    console.log('✅ TC03: 3 nhóm (CT3.1, CT3.2, CT3.4)');
    console.log('✅ Tổng: 7 nhóm cha, 18 chỉ tiêu con');
    console.log('\n💡 Tiếp theo: Refresh trang và test toàn bộ hệ thống!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit(0);
  }
}

setupBatch3();
