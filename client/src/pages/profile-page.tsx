import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/products/product-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Loader2,
  Package,
  UserMinus,
  Edit,
  Save,
  Star,
  ShoppingBag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user: currentUser, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  
  // 현재 보고 있는 프로필이 자신의 것인지 다른 사용자의 것인지 확인
  const isViewingOwnProfile = !params.id || (currentUser && params.id === currentUser.id.toString());
  const viewingUserId = isViewingOwnProfile && currentUser ? currentUser.id : params.id ? parseInt(params.id) : 0;
  
  // 사용자 데이터 조회
  const { data: profileUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/users", viewingUserId],
    queryFn: async () => {
      if (isViewingOwnProfile && currentUser) {
        return currentUser; // 자신의 프로필인 경우 useAuth의 데이터 사용
      } else if (viewingUserId) {
        // 다른 사용자의 프로필인 경우 API 호출
        const res = await fetch(`/api/users/${viewingUserId}`);
        if (!res.ok) throw new Error('사용자 정보를 불러올 수 없습니다.');
        return await res.json();
      }
      return null;
    },
    enabled: !!viewingUserId || isViewingOwnProfile,
  });
  
  const [nickname, setNickname] = useState(profileUser?.nickname || "");
  const [profileImage, setProfileImage] = useState(profileUser?.profileImage || "");
  
  // 프로필 유저가 변경될 때 상태 업데이트
  useEffect(() => {
    if (profileUser) {
      setNickname(profileUser.nickname || "");
      setProfileImage(profileUser.profileImage || "");
    }
  }, [profileUser]);
  
  // Fetch user's products
  const { data: userProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products", { sellerId: viewingUserId }],
    enabled: !!viewingUserId,
  });
  
  // Fetch blocked users (only if viewing own profile)
  const { data: blockedUsers, isLoading: isLoadingBlocked } = useQuery({
    queryKey: ["/api/blocks"],
    enabled: isViewingOwnProfile && !!currentUser?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { nickname: string; profileImage: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${currentUser?.id}`, profileData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "프로필 업데이트 성공",
        description: "프로필 정보가 업데이트되었습니다.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "프로필 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: async (blockedUserId: number) => {
      await apiRequest("DELETE", `/api/blocks/${blockedUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      toast({
        title: "차단 해제 성공",
        description: "사용자 차단이 해제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "차단 해제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    if (!nickname.trim()) {
      toast({
        title: "입력 오류",
        description: "닉네임은 비워둘 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate({ nickname, profileImage });
  };

  const handleUnblock = (blockedUserId: number) => {
    unblockUserMutation.mutate(blockedUserId);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  // Format date
  const formatDate = (dateString: Date) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  // If not logged in, redirect to login page
  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              프로필을 확인하려면 로그인이 필요합니다.
            </p>
            <Button onClick={() => navigate("/auth")}>로그인하러 가기</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // 로딩 상태 표시
  if (isLoadingUser) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 프로필 카드 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>내 프로필</CardTitle>
              <CardDescription>
                프로필 정보 및 관리
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={isEditing ? profileImage : profileUser?.profileImage || ""} />
                  <AvatarFallback className="text-lg">{profileUser?.nickname?.[0] || "?"}</AvatarFallback>
                </Avatar>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">닉네임</label>
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">프로필 이미지 URL</label>
                    <Input
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      placeholder="이미지 URL"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-neutral-500">닉네임</p>
                      <p className="font-medium">{profileUser?.nickname}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">아이디</p>
                      <p className="font-medium">{profileUser?.username}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-neutral-500 mr-1">평점:</span>
                      <span className="font-medium">{profileUser?.rating ? profileUser.rating.toFixed(1) : "0.0"}</span>
                    </div>
                    <div className="flex items-center">
                      <ShoppingBag className="h-4 w-4 text-primary mr-1" />
                      <span className="text-sm text-neutral-500 mr-1">거래:</span>
                      <span className="font-medium">{profileUser?.transactionCount || 0}회</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {isEditing ? (
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    className="w-1/2"
                    onClick={() => {
                      setIsEditing(false);
                      setNickname(profileUser?.nickname || "");
                      setProfileImage(profileUser?.profileImage || "");
                    }}
                  >
                    취소
                  </Button>
                  <Button 
                    className="w-1/2"
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    저장
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  프로필 수정
                </Button>
              )}
              
              <Dialog open={showBlockedUsers} onOpenChange={setShowBlockedUsers}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    차단 목록 관리
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>차단 사용자 관리</DialogTitle>
                    <DialogDescription>
                      차단한 사용자 목록을 확인하고 관리할 수 있습니다.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {isLoadingBlocked ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : blockedUsers && blockedUsers.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {blockedUsers.map((block: any) => (
                        <div 
                          key={block.id} 
                          className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                        >
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={block.blockedUser?.profileImage} />
                              <AvatarFallback>{block.blockedUser?.nickname?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{block.blockedUser?.nickname}</p>
                              <p className="text-xs text-neutral-500">
                                {formatDate(block.createdAt)}에 차단됨
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUnblock(block.blockedUserId)}
                            disabled={unblockUserMutation.isPending}
                          >
                            차단 해제
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserMinus className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" />
                      <p className="mt-4 text-neutral-500">차단한 사용자가 없습니다.</p>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBlockedUsers(false)}
                    >
                      닫기
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {isViewingOwnProfile ? (
                <Button 
                  variant="outline" 
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={handleLogout}
                >
                  로그아웃
                </Button>
              ) : currentUser?.isAdmin && (
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    if (window.confirm(`정말 "${profileUser?.nickname}" 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                      // 계정 삭제 API 호출
                      apiRequest("DELETE", `/api/admin/users/${viewingUserId}`)
                        .then(() => {
                          toast({
                            title: "계정 삭제 완료",
                            description: "사용자 계정이 삭제되었습니다."
                          });
                          // 캐시 완전히 제거 후 새로 가져오도록
                          queryClient.removeQueries({ queryKey: ["/api/admin/users"] });
                          // 사용자 목록 갱신 (fetch 시점 조절)
                          setTimeout(() => {
                            queryClient.refetchQueries({ queryKey: ["/api/admin/users"] });
                          }, 100);
                          // 관리자 페이지로 리디렉션
                          navigate("/admin");
                        })
                        .catch(error => {
                          toast({
                            title: "계정 삭제 실패",
                            description: error.message,
                            variant: "destructive"
                          });
                        });
                    }
                  }}
                >
                  계정 삭제
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* 판매 상품 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>나의 판매 내역</CardTitle>
              <CardDescription>
                등록한 상품 목록과 거래 현황을 확인할 수 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="판매중">판매중</TabsTrigger>
                  <TabsTrigger value="예약중">예약중</TabsTrigger>
                  <TabsTrigger value="판매완료">판매완료</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  {isLoadingProducts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userProducts && userProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProducts.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                      <h3 className="mt-4 text-lg font-medium">등록한 상품이 없습니다</h3>
                      <p className="mt-2 text-sm text-neutral-500">
                        상품을 등록하고 판매를 시작해보세요.
                      </p>
                      <Button 
                        onClick={() => navigate("/products/create")} 
                        className="mt-6"
                      >
                        상품 등록하기
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="판매중">
                  {isLoadingProducts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userProducts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProducts
                        .filter((product: any) => product.status === "판매중")
                        .map((product: any) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  ) : null}
                </TabsContent>
                
                <TabsContent value="예약중">
                  {isLoadingProducts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userProducts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProducts
                        .filter((product: any) => product.status === "예약중")
                        .map((product: any) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  ) : null}
                </TabsContent>
                
                <TabsContent value="판매완료">
                  {isLoadingProducts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : userProducts ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userProducts
                        .filter((product: any) => product.status === "판매완료")
                        .map((product: any) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                  ) : null}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
