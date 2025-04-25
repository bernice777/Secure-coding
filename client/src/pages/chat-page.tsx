import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatList } from "@/components/chat/chat-list";
import { ChatRoom } from "@/components/chat/chat-room";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const { id } = useParams();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(id ? parseInt(id) : null);
  const [_, navigate] = useLocation();

  // Update selected chat when URL param changes
  useEffect(() => {
    if (id) {
      setSelectedChatId(parseInt(id));
    }
  }, [id]);

  // Handle chat selection from the list
  const handleSelectChat = (chatRoomId: number) => {
    setSelectedChatId(chatRoomId);
    navigate(`/chat/${chatRoomId}`);
  };

  // If not authenticated, show login prompt
  if (!isLoadingAuth && !user) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              채팅 기능을 이용하려면 로그인이 필요합니다.
            </p>
            <Button onClick={() => navigate("/auth")}>로그인하러 가기</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h1 className="text-xl font-bold">채팅</h1>
          </div>
          
          <div className="flex flex-col md:flex-row h-[calc(80vh-16rem)]">
            {/* Chat list (always visible on desktop, conditionally on mobile) */}
            <div className={`${selectedChatId && 'hidden md:block'} w-full md:w-auto`}>
              <ChatList onSelectChat={handleSelectChat} />
            </div>
            
            {/* Selected chat or empty state */}
            {selectedChatId ? (
              <div className={`flex-1 ${!selectedChatId && 'hidden md:block'}`}>
                <ChatRoom chatRoomId={selectedChatId} />
              </div>
            ) : (
              <div className="hidden md:flex flex-1 items-center justify-center p-4">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium">채팅방을 선택해주세요</h3>
                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    왼쪽 목록에서 채팅방을 선택하거나<br />
                    상품 상세페이지에서 채팅을 시작해보세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
