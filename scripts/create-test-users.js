// node-fetch v3는 ESM 모듈이라 import 문을 사용하거나 v2를 사용해야 합니다
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createUser(userData) {
  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '계정 생성 실패');
    }
    
    console.log(`사용자 ${userData.username} 생성 완료:`, data);
    return data;
  } catch (error) {
    console.error(`사용자 ${userData.username} 생성 실패:`, error.message);
    return null;
  }
}

async function main() {
  console.log('테스트 사용자 생성 시작...');
  
  // 일반 사용자 3명
  const users = [
    {
      username: 'user1',
      password: 'password123',
      confirmPassword: 'password123',
      nickname: '테스트계정1',
      profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
      agreeToTerms: true
    },
    {
      username: 'user2',
      password: 'password123',
      confirmPassword: 'password123',
      nickname: '테스트계정2',
      profileImage: 'https://randomuser.me/api/portraits/women/2.jpg',
      agreeToTerms: true
    },
    {
      username: 'user3',
      password: 'password123',
      confirmPassword: 'password123',
      nickname: '테스트계정3',
      profileImage: 'https://randomuser.me/api/portraits/men/3.jpg',
      agreeToTerms: true
    },
  ];

  // 관리자 계정
  const admin = {
    username: 'admin',
    password: 'admin123',
    confirmPassword: 'admin123',
    nickname: '관리자',
    profileImage: 'https://randomuser.me/api/portraits/men/10.jpg',
    agreeToTerms: true
  };

  // 일반 사용자 생성
  for (const userData of users) {
    await createUser(userData);
  }
  
  // 관리자 생성
  await createUser(admin);
  
  console.log('테스트 사용자 생성 완료!');
}

main().catch(error => console.error('스크립트 실행 오류:', error));