// ESM 형식으로 storage 모듈 가져오기
const { storage } = await import('../server/storage.js');

async function main() {
  console.log('관리자 권한 부여 시작...');
  
  // admin 계정 찾기
  const adminUser = await storage.getUserByUsername('admin');
  
  if (!adminUser) {
    console.error('admin 계정을 찾을 수 없습니다.');
    return;
  }
  
  console.log(`현재 admin 계정 상태:`, adminUser);
  
  // 관리자 권한 부여
  const updatedUser = await storage.setAdminStatus(adminUser.id, true);
  
  if (updatedUser) {
    console.log(`admin 계정에 관리자 권한 부여 완료:`, updatedUser);
  } else {
    console.error('관리자 권한 부여 실패');
  }
}

main().catch(error => console.error('스크립트 실행 오류:', error));