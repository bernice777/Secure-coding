import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileMenu } from "./mobile-menu";
import { 
  Search,
  Sun, 
  Moon,
  Menu,
  User,
  Heart,
  MessageCircle,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get unread messages count
  const { data: unreadData } = useQuery({
    queryKey: ["/api/chats/unread"],
    enabled: !!user,
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  const unreadCount = unreadData?.count || 0;

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary text-2xl font-bold">중고마켓</span>
            </Link>
          </div>

          {/* 검색창 (태블릿/데스크탑) */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                placeholder="게시글 검색하기"
                className="w-full py-2 pl-10 pr-4 rounded-full border bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            </form>
          </div>

          {/* 네비게이션 (데스크탑) */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/" className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400">
              홈
            </Link>
            <Link href="/?view=categories" className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400">
              카테고리
            </Link>
            {user && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {user.nickname}
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-5 w-auto min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {user ? (
              <>
                <Link href="/chat" className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400 relative">
                  채팅
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-destructive text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/favorites" className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400">
                  찜 목록
                </Link>
                <Link href="/profile" className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400">
                  내 프로필
                </Link>
                {user && user.isAdmin && (
                  <Link href="/admin" className="text-neutral-600 dark:text-neutral-300 hover:text-primary dark:hover:text-primary-400">
                    관리자
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage || ''} alt={user.nickname} />
                        <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium">{user.nickname}</p>
                      <p className="text-xs text-muted-foreground">{user.username}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>프로필</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer flex w-full">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>찜 목록</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/chat" className="cursor-pointer flex w-full">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        <span>채팅</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate("/auth")} className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-600 transition-colors">
                로그인
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <div className="flex items-center space-x-3 lg:hidden">
            {user && (
              <div className="flex items-center mr-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {user.nickname}
                  {unreadCount > 0 && (
                    <span className="ml-1.5 inline-flex h-5 w-auto min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowMobileMenu(true)} 
              className="p-2 rounded-md text-neutral-500 dark:text-neutral-300"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* 검색창 (모바일) */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Input
              type="text"
              placeholder="게시글 검색하기"
              className="w-full py-2 pl-10 pr-4 rounded-full border bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          </form>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <MobileMenu 
        isOpen={showMobileMenu} 
        onClose={() => setShowMobileMenu(false)} 
        unreadCount={unreadCount}
      />
    </header>
  );
}
