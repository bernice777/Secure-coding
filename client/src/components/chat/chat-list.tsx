import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatListProps {
  onSelectChat?: (chatRoomId: number) => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat rooms
  const { data: chatRooms, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/chats"],
    retry: 1,
    staleTime: 10000, // 10초 동안 캐시 유지
    refetchInterval: 15000, // 15초마다 자동으로 업데이트
    enabled: !!user, // 로그인 상태일 때만 사용
  });

  // 수동 새로고침 핸들러
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error) {
      console.error("채팅방 목록 새로고침 오류:", error);
      toast({
        title: "오류",
        description: "채팅방 목록을 새로고침할 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter chat rooms by search query
  const filteredChatRooms = chatRooms?.filter((room: any) => {
    const productTitle = room.product?.title || "";
    const otherUserName = room.otherUser?.nickname || "";
    
    return (
      productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Format date as relative time
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: false,
      locale: ko,
    });
  };

  const handleChatSelect = (chatRoomId: number) => {
    if (onSelectChat) {
      onSelectChat(chatRoomId);
    } else {
      navigate(`/chat/${chatRoomId}`);
    }
  };

  return (
    <div className="w-full md:min-w-[300px] md:max-w-[360px] border-r border-neutral-200 dark:border-neutral-700 flex flex-col h-full">
      <div className="border-b border-neutral-200 dark:border-neutral-700 p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">채팅 목록</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", isRefreshing && "animate-spin")} />
            새로고침
          </Button>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="채팅방 검색"
            className="w-full pl-9 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredChatRooms?.length > 0 ? (
          filteredChatRooms.map((room: any) => (
            <div
              key={room.id}
              className={`border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer ${
                location === `/chat/${room.id}` ? "bg-neutral-100 dark:bg-neutral-700" : ""
              }`}
              onClick={() => handleChatSelect(room.id)}
            >
              <div className="flex items-center p-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={room.otherUser?.profileImage || ''} alt={room.otherUser?.nickname || '사용자'} />
                    <AvatarFallback>{room.otherUser?.nickname?.[0] || '사'}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium truncate">{room.otherUser?.nickname || '사용자'}</h4>
                    <span className="text-xs text-neutral-500">
                      {room.lastMessage ? formatDate(room.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                      {room.lastMessage 
                        ? (typeof room.lastMessage.message === 'string' && room.lastMessage.message.startsWith('{"message":')
                            ? JSON.parse(room.lastMessage.message).message
                            : room.lastMessage.message)
                        : (room.product?.title || '새로운 채팅')}
                    </p>
                    {room.unreadCount > 0 && (
                      <div className="bg-primary rounded-full min-w-5 h-5 flex items-center justify-center text-white text-xs px-1.5">
                        {room.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-neutral-500">
            {searchQuery
              ? "검색 결과가 없습니다."
              : "채팅 내역이 없습니다. 상품 상세페이지에서 채팅을 시작해보세요."}
          </div>
        )}
      </div>
    </div>
  );
}
