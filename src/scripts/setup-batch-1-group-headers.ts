
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
    parentId: 'CT2.1',
    parentData: {
      id: 'CT2.1',
      name: '2.1. Thực hiện lập, cập nhật, đăng tải (hoặc niêm yết) Danh mục thông tin phải được công khai và Danh mục thông tin công dân được tiếp cận có điều kiện theo quy định của pháp luật về tiếp cận thông tin',
      description: 'Nhóm chỉ tiêu về Danh mục thông tin công khai',
      inputType: 'group_header',
      standardLevel: 'Đạt tất cả các chỉ tiêu con',
      order: 1,
      parentCriterionId: 'TC02',
      passRule: {
        type: 'all',
      },
    },
    childIds: ['CT2.1.1', 'CT2.1.2'],
  },
  {
    criterionId: 'TC03',
    parentId: 'CT3.1',
    parentData: {
      id: 'CT3.1',
      name: '3.1. Thành lập, kiện toàn tổ hòa giải và công nhận tổ trưởng tổ hòa giải, hòa giải viên theo quy định của pháp luật về hòa giải ở cơ sở',
      description: 'Nhóm chỉ tiêu về tổ hòa giải',
      inputType: 'group_header',
      standardLevel: 'Đạt tất cả các chỉ tiêu con',
      order: 1,
      parentCriterionId: 'TC03',
      passRule: {
        type: 'all',
      },
    },
    childIds: ['CT3.1.1', 'CT3.1.2'],
  },
];

async function setupBatch1() {
  try {
    console.log('🚀 Bắt đầu setup Batch 1 - Tạo mới documents cha...\n');

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

    console.log('🎉 Batch 1 hoàn thành!\n');
    console.log('📋 Tóm tắt:');
    console.log('   - CT2.1: Tạo mới parent + cập nhật 2 con');
    console.log('   - CT3.1: Tạo mới parent + cập nhật 2 con');
    console.log('\n💡 Tiếp theo: Refresh trang web và kiểm tra UI');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    // process.exit(0); // Comment out or remove to let the process exit naturally
  }
}

setupBatch1();
