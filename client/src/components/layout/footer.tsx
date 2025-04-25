import { Link } from "wouter";
import { AppStoreIcon, GooglePlayIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">중고마켓</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
              안전하고 편리한 중고 거래 서비스를 제공합니다.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-neutral-500 hover:text-primary">
                <i className="ri-instagram-line text-xl"></i>
              </Link>
              <Link href="#" className="text-neutral-500 hover:text-primary">
                <i className="ri-facebook-circle-line text-xl"></i>
              </Link>
              <Link href="#" className="text-neutral-500 hover:text-primary">
                <i className="ri-twitter-line text-xl"></i>
              </Link>
              <Link href="#" className="text-neutral-500 hover:text-primary">
                <i className="ri-youtube-line text-xl"></i>
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link href="#" className="hover:text-primary">공지사항</Link></li>
              <li><Link href="#" className="hover:text-primary">자주 묻는 질문</Link></li>
              <li><Link href="#" className="hover:text-primary">운영정책</Link></li>
              <li><Link href="#" className="hover:text-primary">1:1 문의하기</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">서비스 정보</h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link href="#" className="hover:text-primary">이용약관</Link></li>
              <li><Link href="#" className="hover:text-primary">개인정보처리방침</Link></li>
              <li><Link href="#" className="hover:text-primary">위치기반서비스 이용약관</Link></li>
              <li><Link href="#" className="hover:text-primary">사업자 정보</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">다운로드</h4>
            <div className="space-y-2">
              <Link href="#" className="block">
                <AppStoreIcon className="h-10" />
              </Link>
              <Link href="#" className="block">
                <GooglePlayIcon className="h-10" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 text-center text-sm text-neutral-500">
          <p>© 2023 중고마켓. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

