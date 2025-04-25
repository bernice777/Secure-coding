import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  User as SelectUser, 
  InsertUser, 
  LoginData, 
  RegisterData 
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<SelectUser, "password">, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<SelectUser, "password">, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation<Omit<SelectUser, "password">, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (userData: Omit<SelectUser, "password">) => {
      queryClient.setQueryData(["/api/user"], userData);
      
      // 기본 로그인 성공 메시지
      toast({
        title: "로그인 성공",
        description: `${userData.nickname}님, 환영합니다!`,
        variant: "default",
      });
      
      // 1.5초 후 채팅 알림 표시 - 테스트용
      setTimeout(() => {
        toast({
          title: "채팅이 왔어요",
          description: `읽지 않은 메시지가 있습니다.`,
          variant: "default",
        });
      }, 1500);
      
      // 아래는 테스트 후 다시 활성화
      /*
      try {
        const response = await apiRequest("GET", "/api/chats/unread");
        const data = await response.json();
        
        if (data.count > 0) {
          // 1.5초 후에 채팅 알림 표시 (로그인 메시지가 먼저 보이도록)
          setTimeout(() => {
            toast({
              title: "채팅이 왔어요",
              description: `읽지 않은 메시지가 ${data.count}개 있습니다.`,
              variant: "default",
            });
          }, 1500);
        }
      } catch (error) {
        console.error("채팅 메시지 확인 오류:", error);
      }
      */
    },
    onError: (error: Error) => {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<Omit<SelectUser, "password">, Error, RegisterData>({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (userData: Omit<SelectUser, "password">) => {
      toast({
        title: "회원가입 성공",
        description: "회원가입이 완료되었습니다.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "회원가입 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "로그아웃 성공",
        description: "로그아웃 되었습니다.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "로그아웃 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
