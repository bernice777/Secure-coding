import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChatMessage } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Image, SendHorizontal, MoreHorizontal, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface ChatRoomProps {
  chatRoomId: number;
}

export function ChatRoom({ chatRoomId }: ChatRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<number>(0);

  // Fetch chat room details
  const { data: chatRoom, isLoading: isLoadingChatRoom } = useQuery({
    queryKey: [`/api/chats/${chatRoomId}`],
    enabled: !!chatRoomId,
    retry: 1,
    staleTime: 30000, // 30초 동안 캐시 유지
  });

  // Fetch chat messages
  const { data: messages, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: [`/api/chats/${chatRoomId}/messages`],
    enabled: !!chatRoomId,
    retry: 1,
    refetchInterval: 0, // 자동 갱신 비활성화 (폴링으로 대체)
  });

  // 메시지 전송 뮤테이션
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      try {
        const res = await apiRequest(
          "POST", 
          `/api/chats/${chatRoomId}/messages`, 
          { message: messageText }
        );
        
        // 서버 응답이 201(Created)이 아닌 경우에도 즉시 갱신
        if (!res.ok) {
          throw new Error('메시지 전송에 실패했습니다');
        }
        
        // 응답 본문이 없을 수도 있으므로 처리
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // 성공했지만 응답 본문이 없는 경우
          // 메시지 폴링으로 최신 데이터를 가져올 것이므로 임시 객체 반환
          return {
            id: Date.now(),  // 임시 ID
            chatRoomId,
            senderId: user!.id,
            message: messageText,
            isRead: false,
            createdAt: new Date().toISOString()
          };
        }
        
        return await res.json();
      } catch (error) {
        console.error("메시지 전송 오류:", error);
        throw error;
      }
    },
    onSuccess: (newMessage) => {
      // 메시지 목록 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: [`/api/chats/${chatRoomId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      
      // 로컬 메시지 목록에 바로 추가
      setLocalMessages((prev) => [...prev, newMessage]);
      
      // 마지막 메시지 ID 업데이트
      if (newMessage.id > lastMessageIdRef.current) {
        lastMessageIdRef.current = newMessage.id;
      }
      
      // 즉시 새로운 메시지를 가져오도록 폴링
      fetchNewMessages();
    },
    onError: (error) => {
      toast({
        title: "메시지 전송 실패",
        description: "메시지를 전송할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      console.error("메시지 전송 오류:", error);
    }
  });

  // 폴링으로 새 메시지 가져오기
  const fetchNewMessages = async () => {
    // 채팅방 ID, 사용자 로그인 상태 또는 이미 폴링 중인지 확인
    if (!chatRoomId || !user || isPolling) return;
    
    try {
      setIsPolling(true);
      
      // apiRequest 사용하여 인증 토큰 유지
      const res = await apiRequest(
        "GET",
        `/api/chats/${chatRoomId}/messages/poll?lastMessageId=${lastMessageIdRef.current}`
      );
      
      // 응답 상태 확인 (401 등에 대응)
      if (!res.ok) {
        // 401 오류는 로그인 만료를 의미하므로 조용히 실패
        if (res.status === 401) {
          return;
        }
        // 다른 오류는 출력
        console.warn(`폴링 중 오류: ${res.status} ${res.statusText}`);
        return;
      }
      
      // 응답이 JSON인지 확인
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return;
      }
      
      const newMessages = await res.json();
      
      // 새 메시지가 있고, 배열인지 확인
      if (newMessages && Array.isArray(newMessages) && newMessages.length > 0) {
        // 새 메시지가 있으면 로컬 상태 업데이트
        setLocalMessages((prev) => [...prev, ...newMessages]);
        
        // 마지막 메시지 ID 업데이트
        const maxId = Math.max(...newMessages.map(msg => msg.id));
        if (maxId > lastMessageIdRef.current) {
          lastMessageIdRef.current = maxId;
        }
      }
    } catch (error) {
      // 오류 발생 시 로깅만 하고 사용자에게 알리지 않음
      console.debug("폴링 중 오류:", error);
    } finally {
      setIsPolling(false);
    }
  };

  // 초기 메시지 설정
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      setLocalMessages(messages);
      
      // 마지막 메시지 ID 업데이트
      if (messages.length > 0) {
        const maxId = Math.max(...messages.map(msg => msg.id));
        lastMessageIdRef.current = maxId;
      }
    }
  }, [messages]);

  // 폴링 설정
  useEffect(() => {
    if (chatRoomId) {
      // 이전 인터벌 정리
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // 새 인터벌 설정 (5초마다 폴링)
      pollingIntervalRef.current = setInterval(fetchNewMessages, 5000);
      
      // 컴포넌트 언마운트 시 정리
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [chatRoomId]);

  // 메시지 변경 시 스크롤 하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Get other user (not the current user)
  const otherUser = chatRoom?.buyerId === user?.id ? chatRoom?.seller : chatRoom?.buyer;
  
  // Get chat product
  const product = chatRoom?.product;

  // Check if the other user has blocked the current user
  const isBlockedByOtherUser = chatRoom?.isBlockedBy || false;

  const handleSendMessage = () => {
    // 입력 메시지가 없거나 이미 전송 중인 경우 처리하지 않음
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {      
      // 차단 유저 확인
      if (isBlockedByOtherUser) {
        toast({
          title: "메시지 전송 불가",
          description: "상대방이 당신을 차단했습니다. 메시지를 보낼 수 없습니다.",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }
      
      // 메시지 전송 처리
      const messageCopy = message.trim();
      setMessage(""); // 즉시 입력창 비우기
      
      // 메시지 전송 뮤테이션 호출
      sendMessageMutation.mutate(messageCopy, {
        onSettled: () => {
          setIsSending(false);
        }
      });
    } catch (error) {
      console.error("메시지 전송 중 오류:", error);
      toast({
        title: "오류 발생",
        description: "메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format date as relative time
  const formatMessageTime = (dateString: Date) => {
    const date = new Date(dateString);
    
    // If the message was sent today, just show the time
    if (date.toDateString() === new Date().toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise, show relative time
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: ko,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center">
        {otherUser ? (
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.profileImage || ''} alt={otherUser.nickname} />
              <AvatarFallback>{otherUser.nickname[0]}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h4 className="font-medium">{otherUser.nickname}</h4>
              <div className="flex items-center text-xs text-neutral-500">
                <span>평점: {otherUser.rating.toFixed(1)}</span>
                <span className="mx-1">•</span>
                <span>거래: {otherUser.transactionCount}회</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex items-center">
            <div className="rounded-full bg-neutral-200 dark:bg-neutral-700 h-10 w-10"></div>
            <div className="ml-3">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-1"></div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
            </div>
          </div>
        )}
        
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>상대방 차단하기</DropdownMenuItem>
              <DropdownMenuItem>신고하기</DropdownMenuItem>
              <DropdownMenuItem>채팅방 나가기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Product information */}
      {product && (
        <div className="bg-neutral-100 dark:bg-neutral-700 p-3 border-b border-neutral-200 dark:border-neutral-700">
          <Link href={`/products/${product.id}`} className="flex items-center hover:bg-neutral-200 dark:hover:bg-neutral-600 p-1 rounded">
            <img 
              src={product.images[0]} 
              alt={product.title} 
              className="w-12 h-12 rounded object-cover"
            />
            <div className="ml-2 flex-1">
              <h4 className="text-sm font-medium line-clamp-1">{product.title}</h4>
              <p className="text-sm font-bold">{product.price.toLocaleString('ko-KR')}원</p>
            </div>
            <div className={cn(
              "text-xs px-2 py-1 rounded",
              product.status === "판매중" ? "bg-success-500 text-white" : 
              product.status === "예약중" ? "bg-warning text-neutral-800" : 
              "bg-neutral-500 text-white"
            )}>
              {product.status}
            </div>
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoadingMessages ? (
          <div className="flex justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : localMessages?.length > 0 ? (
          localMessages.map((msg, index) => (
            <div 
              key={msg.id || `temp-${index}`}
              className={`flex items-end ${msg.senderId === user?.id ? 'justify-end' : ''}`}
            >
              {msg.senderId !== user?.id && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={otherUser?.profileImage || ''} alt={otherUser?.nickname || '사용자'} />
                  <AvatarFallback>{otherUser?.nickname?.[0] || '사'}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] ${msg.senderId === user?.id ? 'order-1' : 'order-2'}`}>
                <div className={cn(
                  "rounded-lg px-4 py-2 min-w-[60px] inline-block break-words",
                  msg.senderId === user?.id 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-neutral-200 dark:bg-neutral-700 rounded-bl-none"
                )}>
                  <p>{typeof msg.message === 'string' && msg.message.startsWith('{"message":') 
                    ? JSON.parse(msg.message).message 
                    : msg.message}
                  </p>
                </div>
                <span className={`text-xs text-neutral-500 ${msg.senderId === user?.id ? 'mr-1 text-right block' : 'ml-1'}`}>
                  {msg.createdAt && formatMessageTime(msg.createdAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-neutral-500">
            대화를 시작해보세요!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-neutral-500">
            <Image className="h-5 w-5" />
          </Button>
          <div className="flex-1 mx-2">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>
          <Button 
            size="icon" 
            className="text-primary" 
            disabled={!message.trim() || isSending}
            onClick={handleSendMessage}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}