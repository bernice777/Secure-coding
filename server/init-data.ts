import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Initialize admin user and test data
 */
export async function initializeData() {
  console.log("Initializing test data...");

  // 1. Create test users if they don't exist yet
  const testUsers = [
    { username: "admin", password: "admin1234", nickname: "관리자", isAdmin: true },
    { username: "user1", password: "password1", nickname: "홍길동", isAdmin: false },
    { username: "user2", password: "password2", nickname: "김철수", isAdmin: false },
    { username: "user3", password: "password3", nickname: "이영희", isAdmin: false },
  ];

  for (const userData of testUsers) {
    const existingUser = await storage.getUserByUsername(userData.username);
    if (!existingUser) {
      console.log(`Creating test user: ${userData.username}`);
      const hashedPassword = await hashPassword(userData.password);
      await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        nickname: userData.nickname,
        profileImage: null,
      });
    }
  }

  // 2. Set admin privilege
  const adminUser = await storage.getUserByUsername('admin');
  if (adminUser && !adminUser.isAdmin) {
    console.log("Setting admin privilege to admin user...");
    await storage.setAdminStatus(adminUser.id, true);
    console.log("Admin privilege set successfully.");
  }

  // 3. Create test products if there are no products yet
  const productCount = (await storage.getAllProducts()).length;
  if (productCount === 0) {
    console.log("Creating test products...");

    const user1 = await storage.getUserByUsername('user1');
    const user2 = await storage.getUserByUsername('user2');
    const user3 = await storage.getUserByUsername('user3');

    if (!user1 || !user2 || !user3) {
      console.log("Cannot create test products: test users not found");
      return;
    }

    const testProducts = [
      {
        title: '삼성 갤럭시 S22 울트라',
        price: 950000,
        description: '삼성 갤럭시 S22 울트라 퍼플 색상 판매합니다. 구매한지 3개월 되었고 액정 및 외관 깨끗합니다. 충전기, 케이스 함께 드립니다.',
        category: '전자기기',
        location: '서울시 강남구',
        sellerId: user1.id,
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
        sellerId: user1.id,
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
        sellerId: user1.id,
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
        sellerId: user2.id,
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
        sellerId: user2.id,
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
        sellerId: user2.id,
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
        sellerId: user3.id,
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
        sellerId: user3.id,
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
        sellerId: user3.id,
        images: [
          'https://images.unsplash.com/photo-1662286844552-e4e2f8253b6b',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d',
        ],
        status: '판매중',
      },
    ];

    for (const productData of testProducts) {
      await storage.createProduct(productData);
    }

    console.log(`${testProducts.length} test products created successfully.`);
  }

  // 4. 테스트 채팅방 및 메시지 추가
  const chatRoomsCount = (await storage.getChatRoomsByUserId(2)).length;
  
  if (chatRoomsCount === 0) {
    console.log("Creating test chat room and messages...");
    
    const user1 = await storage.getUserByUsername('user1');
    const user2 = await storage.getUserByUsername('user2');
    const user3 = await storage.getUserByUsername('user3');
    
    if (!user1 || !user2 || !user3) {
      console.log("Cannot create test chat: test users not found");
      return;
    }
    
    try {
      // 채팅방 생성 (user3가 user2의 상품에 대해 문의)
      const chatRoom = await storage.createChatRoom({
        productId: 1, // 첫 번째 상품
        buyerId: user3.id,
        sellerId: user2.id
      });
      
      // 읽지 않은 메시지 추가
      await storage.createChatMessage({
        chatRoomId: chatRoom.id,
        senderId: user3.id,
        message: "안녕하세요! 이 상품 아직 판매 중인가요?",
        isRead: true
      });
      
      await storage.createChatMessage({
        chatRoomId: chatRoom.id,
        senderId: user2.id,
        message: "네, 아직 판매 중입니다!",
        isRead: false
      });
      
      await storage.createChatMessage({
        chatRoomId: chatRoom.id,
        senderId: user3.id,
        message: "가격 좀 깎아주실 수 있나요?",
        isRead: true
      });
      
      await storage.createChatMessage({
        chatRoomId: chatRoom.id,
        senderId: user2.id,
        message: "조금 생각해볼게요. 얼마 정도 생각하세요?",
        isRead: false
      });
      
      console.log("테스트 채팅방 및 메시지 생성 완료");
    } catch (error) {
      console.error("테스트 채팅방 생성 중 오류:", error);
    }
  }
  
  console.log("Test data initialization complete.");
}