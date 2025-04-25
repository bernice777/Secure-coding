import fetch from 'node-fetch';

async function login(username, password) {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function createProduct(cookie, productData) {
  const response = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.statusText}`);
  }

  return await response.json();
}

async function main() {
  try {
    console.log('테스트 상품 생성 시작...');
    
    // 로그인
    console.log('user1로 로그인 중...');
    const user1Cookie = await login('user1', 'password1');
    
    console.log('user2로 로그인 중...');
    const user2Cookie = await login('user2', 'password2');
    
    console.log('user3로 로그인 중...');
    const user3Cookie = await login('user3', 'password3');
    
    // 테스트 상품 데이터
    const testProducts = [
      {
        title: '삼성 갤럭시 S22 울트라',
        price: 950000,
        description: '삼성 갤럭시 S22 울트라 퍼플 색상 판매합니다. 구매한지 3개월 되었고 액정 및 외관 깨끗합니다. 충전기, 케이스 함께 드립니다.',
        category: '전자기기',
        location: '서울시 강남구',
        images: [
          'https://images.unsplash.com/photo-1662206788625-bf20de35fa02',
          'https://images.unsplash.com/photo-1652976423993-5776dcec397c',
        ],
        status: '판매중',
      },
      {
        title: '아이폰 14 프로 128GB',
        price: 1050000,
        description: '아이폰 14 프로 128GB 스페이스 블랙 판매합니다. 애플케어+ 적용 중이며 완전 새 제품입니다. 필름 부착 안했습니다.',
        category: '전자기기',
        location: '서울시 송파구',
        images: [
          'https://images.unsplash.com/photo-1663499482516-c803189e82fa',
          'https://images.unsplash.com/photo-1667897500629-1a12a5f94709',
        ],
        status: '판매중',
      },
      {
        title: '캠핑 텐트 4인용',
        price: 120000,
        description: '코베아 4인용 텐트 판매합니다. 작년에 구매해서 두 번 사용했습니다. 상태 매우 좋습니다. 직접 보시고 결정하셔도 됩니다.',
        category: '스포츠/레저',
        location: '경기도 고양시',
        images: [
          'https://images.unsplash.com/photo-1624254495476-12ceca272d1a',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
        ],
        status: '판매중',
      },
      {
        title: '다이슨 에어랩',
        price: 350000,
        description: '다이슨 에어랩 컴플리트 판매합니다. 정품이며 구성품 모두 있습니다. 사용감 있으나 성능에는 문제 없습니다.',
        category: '생활/가전',
        location: '서울시 마포구',
        images: [
          'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5',
          'https://images.unsplash.com/photo-1590439471364-192aa70c0b53',
        ],
        status: '판매중',
      },
      {
        title: '나이키 에어포스1 07',
        price: 85000,
        description: '나이키 에어포스1 07 화이트 255 사이즈 판매합니다. 한 번 신어본 거의 새 제품입니다. 직거래 가능합니다.',
        category: '패션/의류',
        location: '서울시 영등포구',
        images: [
          'https://images.unsplash.com/photo-1600269452121-4f2416e55c28',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a',
        ],
        status: '판매중',
      },
      {
        title: '플레이스테이션 5',
        price: 650000,
        description: '플레이스테이션 5 디스크 에디션 판매합니다. 구성품 모두 있고 추가 컨트롤러 포함입니다. 디지털 게임 몇 개 설치되어 있습니다.',
        category: '전자기기',
        location: '인천시 부평구',
        images: [
          'https://images.unsplash.com/photo-1607853202273-797f1c22a38e',
          'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13',
        ],
        status: '판매중',
      },
      {
        title: '필립스 에어프라이어',
        price: 75000,
        description: '필립스 에어프라이어 XL 사이즈 판매합니다. 사용 기간 6개월이며 상태 좋습니다. 직접 보시고 결정하세요.',
        category: '생활/가전',
        location: '서울시 강서구',
        images: [
          'https://images.unsplash.com/photo-1648145325527-33400ff9fe3a',
          'https://images.unsplash.com/photo-1612883596117-3e5f5687af69',
        ],
        status: '판매중',
      },
      {
        title: '루이비통 네버풀 MM',
        price: 1450000,
        description: '루이비통 네버풀 MM 다미에 판매합니다. 정품이며 구매 영수증 있습니다. 사용감 약간 있으나 전체적으로 깨끗합니다.',
        category: '패션/잡화',
        location: '서울시 강남구',
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
          'https://images.unsplash.com/photo-1592111332972-1ce4307c9150',
        ],
        status: '판매중',
      },
      {
        title: '닌텐도 스위치 OLED',
        price: 340000,
        description: '닌텐도 스위치 OLED 화이트 판매합니다. 작년에 구매했고 게임 3개 포함입니다. 직거래 가능합니다.',
        category: '전자기기',
        location: '경기도 성남시',
        images: [
          'https://images.unsplash.com/photo-1662286844552-e4e2f8253b6b',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d',
        ],
        status: '판매중',
      },
    ];
    
    // 사용자별로 상품 등록 (user1: 1-3, user2: 4-6, user3: 7-9)
    console.log('user1의 상품 등록 중...');
    for (let i = 0; i < 3; i++) {
      const product = await createProduct(user1Cookie, testProducts[i]);
      console.log(`상품 등록 완료: ${product.title}`);
    }
    
    console.log('user2의 상품 등록 중...');
    for (let i = 3; i < 6; i++) {
      const product = await createProduct(user2Cookie, testProducts[i]);
      console.log(`상품 등록 완료: ${product.title}`);
    }
    
    console.log('user3의 상품 등록 중...');
    for (let i = 6; i < 9; i++) {
      const product = await createProduct(user3Cookie, testProducts[i]);
      console.log(`상품 등록 완료: ${product.title}`);
    }
    
    console.log('테스트 상품 생성 완료!');
  } catch (error) {
    console.error('스크립트 실행 오류:', error);
  }
}

// ESM 모듈에서 기본 함수 실행
main();