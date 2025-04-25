import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UserX, AlertTriangle, Trash, Ban, CheckCheck, Shield, Users, FileText, FileEdit, RefreshCw } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // 관리자가 아닌 경우 홈으로 리다이렉트
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
    }
  }, [user, navigate]);

  // 신고 목록 가져오기
  const { data: reports = [] } = useQuery({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/reports");
      return await res.json();
    },
    enabled: !!user?.isAdmin,
  });

  // 사용자 목록 가져오기
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
    enabled: !!user?.isAdmin,
  });

  // 상품 목록 가져오기
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return await res.json();
    },
  });

  // 관리자 권한 설정 변경 Mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, { isAdmin });
      return await res.json();
    },
    onSuccess: () => {
      // 관리자 권한 변경 후 캐시 완전히 제거 후 새로 가져오기
      queryClient.removeQueries({ queryKey: ["/api/admin/users"] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      }, 100);
      toast({
        title: "관리자 권한 변경 완료",
        description: "사용자의 관리자 권한이 변경되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "관리자 권한 변경 실패",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });
  
  // 사용자 프로필 수정 로직은 프로필 페이지로 이동
  
  // 사용자 계정 삭제 Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        throw new Error("사용자 삭제에 실패했습니다");
      }
      return userId;
    },
    onSuccess: () => {
      // 캐시 완전히 제거 후 새로 가져오도록
      queryClient.removeQueries({ queryKey: ["/api/admin/users"] });
      // 쿼리 즉시 실행을 위한 시간 간격 설정
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
      }, 100);
      toast({
        title: "사용자 삭제 완료",
        description: "사용자 계정과 관련 데이터가 모두 삭제되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "사용자 삭제 실패",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // 상품 삭제 Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/products/${productId}`);
      if (!res.ok) {
        throw new Error("상품 삭제에 실패했습니다");
      }
      return productId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "상품 삭제 완료",
        description: "상품이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "상품 삭제 실패",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // 신고 처리 Mutation
  const handleReportMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: number, action: string }) => {
      const res = await apiRequest("POST", `/api/admin/reports/${reportId}/handle`, { action });
      if (!res.ok) {
        throw new Error("신고 처리에 실패했습니다");
      }
      return reportId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: "신고 처리 완료",
        description: "신고가 성공적으로 처리되었습니다.",
      });
    },
    onError: (error) => {
      toast({
        title: "신고 처리 실패",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleAdminToggle = (userId: number, isAdmin: boolean) => {
    // 자기 자신의 관리자 권한을 해제하지 못하도록 방지
    if (userId === user?.id && !isAdmin) {
      toast({
        title: "권한 변경 실패",
        description: "자신의 관리자 권한은 해제할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    toggleAdminMutation.mutate({ userId, isAdmin });
  };
  
  // handleUpdateUserProfile 함수는 더 이상 필요 없음 (프로필 페이지에서 처리)
  
  const handleUserDelete = (userId: number) => {
    // 자기 자신은 삭제 불가
    if (userId === user?.id) {
      toast({
        title: "계정 삭제 불가",
        description: "자신의 계정은 삭제할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm("정말로 이 사용자 계정을 삭제하시겠습니까?\n\n주의: 이 작업은 되돌릴 수 없으며, 사용자의 모든 상품, 채팅, 찜 목록 등이 함께 삭제됩니다.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleProductDelete = (productId: number) => {
    if (window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleReport = (reportId: number, action: string) => {
    handleReportMutation.mutate({ reportId, action });
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>관리자 전용 페이지</CardTitle>
            <CardDescription>이 페이지는 관리자만 접근할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>관리자 계정으로 로그인해주세요.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>로그인 페이지로 이동</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
          <p className="text-gray-500">사이트 관리 및 모니터링</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="flex items-center gap-1"
          >
            홈으로 이동
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-4 h-4" /> 관리자 계정
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 신고 관리
            {reports.length > 0 && (
              <Badge variant="destructive" className="ml-1">{reports.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> 상품 관리
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> 사용자 관리
          </TabsTrigger>
        </TabsList>

        {/* 신고 관리 탭 */}
        <TabsContent value="reports" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">신고 목록</h2>
          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <CheckCheck className="w-12 h-12 text-green-500 mb-4" />
                <p className="text-lg text-center">현재 처리할 신고가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        신고 #{report.id}
                      </CardTitle>
                      <Badge variant={report.status === '처리중' ? 'outline' : 'secondary'}>
                        {report.status || '처리중'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {format(new Date(report.createdAt), 'yyyy년 MM월 dd일 HH:mm')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div>
                        <p className="font-semibold mb-1">신고 사유:</p>
                        <p>{report.reason}</p>
                      </div>
                      
                      {report.details && (
                        <div>
                          <p className="font-semibold mb-1">상세 내용:</p>
                          <p className="text-sm">{report.details}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {report.reportedUserId && (
                          <div className="p-3 bg-slate-50 rounded-md">
                            <p className="text-sm font-semibold mb-1">신고된 사용자:</p>
                            <div className="flex items-center">
                              <Avatar className="w-6 h-6 mr-2">
                                <AvatarFallback>{report.reportedUser?.nickname?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <span>{report.reportedUser?.nickname || '탈퇴한 사용자'}</span>
                            </div>
                          </div>
                        )}
                        
                        {report.reportedProductId && (
                          <div className="p-3 bg-slate-50 rounded-md">
                            <p className="text-sm font-semibold mb-1">신고된 상품:</p>
                            <div className="flex items-center">
                              <span>{report.reportedProduct?.title || '삭제된 상품'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {report.status === '처리중' && (
                    <CardFooter className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReport(report.id, 'ignore')}
                      >
                        무시하기
                      </Button>
                      {report.reportedProductId && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (report.reportedProductId) {
                              handleProductDelete(report.reportedProductId);
                              handleReport(report.id, 'delete_content');
                            }
                          }}
                        >
                          <Trash className="w-4 h-4 mr-1" /> 상품 삭제
                        </Button>
                      )}
                      {report.reportedUserId && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleReport(report.id, 'ban_user')}
                        >
                          <Ban className="w-4 h-4 mr-1" /> 사용자 차단
                        </Button>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 상품 관리 탭 */}
        <TabsContent value="products" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">상품 목록</h2>
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex">
                  <div className="w-24 h-24 bg-slate-100 relative flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{product.title}</h3>
                        <p className="text-sm text-gray-500">
                          {product.category} · {product.location}
                        </p>
                        <p className="font-medium mt-1">
                          {product.price.toLocaleString()}원
                        </p>
                      </div>
                      <Badge variant={
                        product.status === '판매중' 
                          ? 'default' 
                          : product.status === '예약중' 
                            ? 'outline' 
                            : 'secondary'
                      }>
                        {product.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border-l gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/products/${product.id}/edit`)}
                    >
                      <FileText className="w-4 h-4 mr-1" /> 수정
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleProductDelete(product.id)}
                    >
                      <Trash className="w-4 h-4 mr-1" /> 삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">사용자 목록</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                // 캐시를 무효화한 후 데이터를 다시 가져옴
                queryClient.removeQueries({ queryKey: ["/api/admin/users"] });
                await refetchUsers();
                toast({
                  title: "새로고침",
                  description: "사용자 목록을 새로고침했습니다."
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
          <div className="grid gap-4">
            {users.map((u) => (
              <Card key={u.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={u.profileImage || undefined} />
                        <AvatarFallback>{u.nickname?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{u.nickname}</CardTitle>
                        <CardDescription>{u.username}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={u.isAdmin ? 'default' : 'outline'}>
                      {u.isAdmin ? '관리자' : '일반 사용자'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">거래 횟수</p>
                      <p className="font-medium">{u.transactionCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">평점</p>
                      <p className="font-medium">{u.rating ? `${u.rating.toFixed(1)}/5.0` : '평점 없음'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">상품 수</p>
                      <p className="font-medium">{products.filter(p => p.sellerId === u.id).length}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center w-full">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/users/${u.id}`)}
                      >
                        <FileEdit className="w-4 h-4 mr-1" /> 프로필 보기 및 수정
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`admin-switch-${u.id}`}
                          checked={u.isAdmin}
                          disabled={toggleAdminMutation.isPending}
                          onCheckedChange={(checked) => handleAdminToggle(u.id, checked)}
                        />
                        <Label htmlFor={`admin-switch-${u.id}`} className="cursor-pointer">관리자 권한</Label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUserDelete(u.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        <UserX className="w-4 h-4 mr-1" /> 계정 삭제
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}