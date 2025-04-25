import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
}

export function MobileMenu({ isOpen, onClose, unreadCount }: MobileMenuProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  return (
    <div 
      className={`lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div 
        className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-neutral-800 shadow-lg p-5 transform transition-transform duration-300" 
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">메뉴</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="p-1"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* 모바일 검색창 */}
        <form onSubmit={handleSearchSubmit} className="relative mb-4">
          <Input
            type="text"
            placeholder="게시글 검색하기"
            className="w-full py-2 pl-10 pr-4 rounded-full border bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Button 
            type="submit" 
            variant="ghost" 
            size="sm" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-neutral-400"
          >
            검색
          </Button>
        </form>
        
        <nav className="flex flex-col space-y-4">
          <Link 
            href="/" 
            className={`py-2 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
              location === "/" ? "bg-neutral-100 dark:bg-neutral-700" : ""
            }`}
            onClick={onClose}
          >
            홈
          </Link>
          
          <Link 
            href="/?view=categories" 
            className={`py-2 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
              location.includes("categories") ? "bg-neutral-100 dark:bg-neutral-700" : ""
            }`}
            onClick={onClose}
          >
            카테고리
          </Link>
          
          {user ? (
            <>
              <Link 
                href="/chat" 
                className={`py-2 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 flex justify-between items-center ${
                  location.includes("/chat") ? "bg-neutral-100 dark:bg-neutral-700" : ""
                }`}
                onClick={onClose}
              >
                채팅
                {unreadCount > 0 && (
                  <span className="bg-destructive text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              
              <Link 
                href="/favorites" 
                className={`py-2 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                  location === "/favorites" ? "bg-neutral-100 dark:bg-neutral-700" : ""
                }`}
                onClick={onClose}
              >
                찜 목록
              </Link>
              
              <Link 
                href="/profile" 
                className={`py-2 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                  location === "/profile" ? "bg-neutral-100 dark:bg-neutral-700" : ""
                }`}
                onClick={onClose}
              >
                내 프로필
              </Link>
              
              {user && user.isAdmin && (
                <Link 
                  href="/admin" 
                  className={`py-2 px-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                    location === "/admin" ? "bg-neutral-100 dark:bg-neutral-700" : ""
                  }`}
                  onClick={onClose}
                >
                  관리자
                </Link>
              )}
              
              <Button 
                variant="outline" 
                className="mt-4 w-full" 
                onClick={handleLogout}
              >
                로그아웃
              </Button>
              
              <Link
                href="/products/create"
                className="mt-4 w-full py-2 text-center rounded-md bg-primary text-white hover:bg-primary-600 transition-colors"
                onClick={onClose}
              >
                상품 등록하기
              </Link>
            </>
          ) : (
            <Link 
              href="/auth"
              className="mt-4 w-full py-2 text-center rounded-md bg-primary text-white hover:bg-primary-600 transition-colors"
              onClick={onClose}
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
