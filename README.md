# 중고마켓 플랫폼

한국어 인터페이스를 갖춘 종합적인 중고 거래 플랫폼입니다. 사용자 인증, 상품 관리, 실시간 채팅, 찜 기능, 결제 시스템, 신고 및 차단 기능, 관리자 기능 등을 제공합니다.

## 주요 기능

### 사용자 관리
- 회원가입 및 로그인 (세션 기반 인증)
- 사용자 프로필 관리
- 다크모드 지원

### 상품 관리
- 상품 등록, 수정, 삭제
- 카테고리 및 위치 기반 필터링
- 상품 검색 기능
- 상품 상세 조회

### 커뮤니케이션
- 실시간 채팅 (RESTful API 기반 폴링 방식)
- 댓글 시스템
- 읽지 않은 메시지 알림

### 결제 시스템
- Stripe 기반 결제 처리
- 결제 완료 상태 추적

### 찜 기능
- 상품 찜하기/찜 해제
- 찜 목록 조회

### 신고 및 차단
- 사용자 차단 기능
- 상품 및 사용자 신고 기능
- 신고 처리 시스템

### 관리자 기능
- 사용자 관리 (계정 삭제, 관리자 권한 설정)
- 상품 관리 (수정, 삭제)
- 신고 처리 (사용자 차단, 콘텐츠 삭제)

## 기술 스택

### 프론트엔드
- React + TypeScript
- TailwindCSS + Shadcn/UI
- Tanstack Query (React Query)
- Zod (폼 유효성 검증)
- React Hook Form
- Stripe 결제 통합

### 백엔드
- Node.js + Express
- RESTful API
- 세션 기반 인증 (Passport.js)
- Drizzle ORM

### 데이터베이스
- 인메모리 데이터베이스 (개발용)
- PostgreSQL 연동 지원

### 보안
- XSS 방어
- CSRF 방어
- Rate Limiting
- Helmet 보안 헤더

## 설치 및 실행 방법

### 필요 조건
- Node.js 18 이상
- npm 9 이상

### 설치

```bash
# 저장소 클론
git clone https://github.com/bernice777/Secure-coding.git
cd Secure-coding

# 의존성 설치
npm install
```

### 환경 변수 설정
`.env` 파일을 프로젝트 루트에 생성하고 다음 환경 변수를 설정하세요:

NODE_ENV=development
SESSION_SECRET="a98s7g9aw-91q7gqf1-217tgf@3r13r1"
VITE_STRIPE_PUBLIC_KEY=pk_test_51RHJYfFxCWbNyYzWrWhYJzYoU2ELxNmS8iAS67KhqGcYNIpUEzDanw2Ms0kOMaPrCLhWPWWUicb3dW2yRkFRLNQm00Xkm1DdKw
STRIPE_SECRET_KEY=sk_test_51RHJYfFxCWbNyYzWGiE6BSjPncwbR5yuVrSB4cj0tnqC7MXIkN6fDdHMHxqDwTPe8HUL0aSdljoczcCOpP1HWIai007Ntgfzc2


### 실행

```bash
# 개발 서버 실행
npm run dev
```

ngrok 사용해주셔도 됩니다.

서버는 기본적으로 http://localhost:5000 에서 실행됩니다.

## 테스트 계정

시스템에는 기본적으로 다음 테스트 계정이 제공됩니다:

- 관리자: admin / admin1234
- 일반 사용자 1: user1 / password1 (홍길동)
- 일반 사용자 2: user2 / password2 (김철수)
- 일반 사용자 3: user3 / password3 (이영희)

## 사용 방법

1. 로그인 또는 회원가입을 통해 계정을 생성합니다.
2. 홈 화면에서 상품을 검색하거나 필터링합니다.
3. 상품 상세 페이지에서 찜하기, 채팅하기, 구매하기 등의 액션을 수행할 수 있습니다.
4. 프로필 페이지에서 개인 정보 수정, 차단 목록 관리가 가능합니다.
5. 관리자 계정으로 로그인하면 상단에 관리자 페이지 링크가 표시됩니다.

## Stripe 테스트 결제

테스트 모드에서 결제 기능을 테스트하려면 다음 테스트 카드 정보를 사용하세요:

- 카드 번호: 4242 4242 4242 4242
- 만료일: 미래의 아무 날짜 (예: 12/25)
- CVC: 아무 3자리 숫자 (예: 123)
- 우편번호: 아무 5자리 숫자 (예: 12345)
