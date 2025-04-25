import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/schema";
import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

/**
 * 폴링 방식으로 채팅 기능을 대체하는 훅
 * 현재는 임의의 훅으로, WebSocket 방식에서 폴링 방식으로 전환하기 위한 임시 조치입니다.
 * 
 * 이 훅은 기존 WebSocket 기반 채팅 코드와의 호환성을 유지하도록 설계되었습니다.
 * 실제로는 REST API를 통한 폴링 방식으로 동작합니다.
 */
export function useWebSocket() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 연결 상태 더미 변수
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // 연결 함수 (더미)
  const connect = useCallback(() => {
    setIsConnected(true);
    console.log("폴링 모드 활성화됨 - WebSocket 대체");
    return () => {};
  }, []);
  
  // 연결 해제 함수 (더미)
  const disconnect = useCallback(() => {
    console.log("폴링 모드 비활성화됨");
    setIsConnected(false);
  }, []);
  
  // 메시지 전송 함수 - REST API 사용
  const sendMessage = useCallback(async (chatRoomId: number, message: string) => {
    if (!user) {
      toast({
        title: "메시지 전송 실패",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!message.trim()) {
      return false;
    }
    
    try {
      await apiRequest("POST", `/api/chats/${chatRoomId}/messages`, { message });
      return true;
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      toast({
        title: "메시지 전송 실패",
        description: "메시지를 전송할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);
  
  // 메시지 읽음 처리 함수 - REST API가 자동으로 읽음 처리
  const markAsRead = useCallback((chatRoomId: number) => {
    // API가 자동으로 읽음 처리하므로 별도 구현 불필요
    return true;
  }, []);
  
  // 새 메시지 리스너 함수 (더미)
  const useMessageListener = () => {
    // 폴링 방식에서는 사용되지 않음
    // 별도로 구현된 폴링 로직에서 메시지를 가져옴
  };
  
  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    markAsRead,
    useMessageListener
  };
}
