import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, InsertChatRoom, ChatRoom } from "@shared/schema";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Share,
  Heart,
  Eye,
  MessageCircle,
  AlertCircle,
  UserMinus,
  Flag,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface ProductDetailProps {
  productId: number;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch seller details
  const { data: seller } = useQuery({
    queryKey: [`/api/users/${product?.sellerId}`],
    enabled: !!product?.sellerId,
  });

  // Fetch favorite status
  const { data: favoriteData } = useQuery({
    queryKey: [`/api/products/${productId}/favorites`],
    enabled: !!productId && !!user,
  });

  // Fetch comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: [`/api/products/${productId}/comments`],
    enabled: !!productId,
  });

  // Check if user is blocked
  const { data: isBlocked } = useQuery({
    queryKey: ['/api/blocks', product?.sellerId],
    enabled: !!product?.sellerId && !!user,
    select: (data) => {
      return data.some((block: any) => block.blockedUserId === product?.sellerId);
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      if (favoriteData?.isFavorited) {
        await apiRequest("DELETE", `/api/favorites/${productId}`);
      } else {
        await apiRequest("POST", "/api/favorites", { productId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/favorites`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      toast({
        title: favoriteData?.isFavorited ? "찜 해제" : "찜하기 완료",
        description: favoriteData?.isFavorited ? "찜 목록에서 제거되었습니다." : "찜 목록에 추가되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start chat mutation
  const startChatMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const chatRoomData: Partial<InsertChatRoom> = {
        productId: Number(productId),
        sellerId: product.sellerId,
        buyerId: user.id
      };
      
      const res = await apiRequest("POST", "/api/chats", chatRoomData);
      return await res.json() as ChatRoom;
    },
    onSuccess: (chatRoom: ChatRoom) => {
      toast({
        title: "채팅방 생성",
        description: "판매자와 채팅을 시작합니다.",
      });
      navigate(`/chat/${chatRoom.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      await apiRequest("POST", "/api/blocks", { blockedUserId: product.sellerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blocks`] });
      
      toast({
        title: "사용자 차단 완료",
        description: "사용자가 차단되었습니다. 이 사용자의 글은 더 이상 보이지 않습니다.",
      });
      
      // Navigate away from the blocked user's product
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const commentData = {
        content,
        productId: Number(productId),
        userId: user.id
      };
      
      const res = await apiRequest("POST", `/api/products/${productId}/comments`, commentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/comments`] });
      setCommentText("");
      toast({
        title: "댓글 작성 완료",
        description: "댓글이 등록되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "댓글 작성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest("DELETE", `/api/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/comments`] });
      toast({
        title: "댓글 삭제 완료",
        description: "댓글이 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "댓글 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Report form
  const reportFormSchema = z.object({
    reason: z.string({
      required_error: "신고 사유를 선택해주세요",
    }),
    details: z.string().optional(),
  });

  const reportForm = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reason: "",
      details: "",
    },
  });

  // Report product mutation
  const reportProductMutation = useMutation({
    mutationFn: async (values: z.infer<typeof reportFormSchema>) => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const reportData = {
        reporterId: user.id,
        reportedProductId: productId,
        reason: values.reason,
        details: values.details || "",
      };
      
      await apiRequest("POST", "/api/reports", reportData);
    },
    onSuccess: () => {
      toast({
        title: "신고 접수 완료",
        description: "신고가 접수되었습니다. 관리자가 검토 후 조치하겠습니다.",
      });
      setShowReportDialog(false);
      reportForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "신고 접수 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      
      if (response.status !== 204) {
        throw new Error("상품 삭제에 실패했습니다.");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "상품 삭제 완료",
        description: "상품이 성공적으로 삭제되었습니다.",
      });
      
      // Home으로 이동 전에 상품 리스트 캐시를 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/recent'] });
      
      // 약간의 딜레이 후 리디렉션
      setTimeout(() => {
        navigate("/");
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "상품 삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onReportSubmit = (values: z.infer<typeof reportFormSchema>) => {
    reportProductMutation.mutate(values);
  };

  // Image navigation handlers
  const goToPrevImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
  };

  // Submit comment handler
  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "댓글을 작성하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    
    addCommentMutation.mutate(commentText);
  };

  // Format date
  const formatDate = (dateString: Date) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "판매중":
        return "bg-success-500 text-white";
      case "예약중":
        return "bg-warning text-neutral-800";
      case "판매완료":
        return "bg-neutral-500 text-white";
      default:
        return "bg-success-500 text-white";
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">상품을 찾을 수 없습니다</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">해당 상품이 삭제되었거나 잘못된 주소입니다.</p>
        <Button onClick={() => navigate("/")}>홈으로 돌아가기</Button>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="text-center py-8">
        <UserMinus className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">차단된 사용자의 상품입니다</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-6">차단을 해제하시려면 프로필 &gt; 차단 목록에서 관리하세요.</p>
        <Button onClick={() => navigate("/")}>홈으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
      {/* 상품 이미지 슬라이더 */}
      <div className="relative mb-6">
        <div className="overflow-hidden rounded-lg">
          <img 
            src={product.images[currentImageIndex]} 
            alt={product.title} 
            className="w-full h-96 object-contain"
          />
        </div>
        {product.images.length > 1 && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-1/2 left-4 transform -translate-y-1/2 rounded-full bg-white/80 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700"
              onClick={goToPrevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute top-1/2 right-4 transform -translate-y-1/2 rounded-full bg-white/80 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700"
              onClick={goToNextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white/80 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700"
          >
            <Share className="h-5 w-5" />
          </Button>
          {user && (
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full bg-white/80 dark:bg-neutral-800/80",
                favoriteData?.isFavorited 
                  ? "text-primary" 
                  : "text-neutral-400 hover:text-primary"
              )}
              onClick={() => toggleFavoriteMutation.mutate()}
            >
              <Heart className={cn("h-5 w-5", favoriteData?.isFavorited && "fill-current")} />
            </Button>
          )}
        </div>
        <div className={cn(
          "absolute bottom-4 left-4 px-3 py-1 rounded-md text-xs",
          getStatusBadgeColor(product.status)
        )}>
          {product.status}
        </div>
      </div>

      <div className="p-4">
        {/* 판매자 정보 */}
        <div className="flex items-center mb-4">
          <Avatar className="w-12 h-12 mr-3">
            <AvatarImage src={seller?.profileImage || ''} alt={seller?.nickname || '판매자'} />
            <AvatarFallback>{seller?.nickname?.[0] || '판'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium">{seller?.nickname || '판매자'}</h3>
              <div className="ml-2 text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-400">
                인증 완료
              </div>
              {user?.id === product.sellerId && (
                <div className="ml-auto flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate(`/products/${productId}/edit`)}
                  >
                    수정하기
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    삭제하기
                  </Button>
                </div>
              )}
              {user && user.id !== product.sellerId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 h-auto py-1"
                  onClick={() => blockUserMutation.mutate()}
                >
                  <UserMinus className="h-3 w-3 mr-1" /> 차단
                </Button>
              )}
            </div>
            <p className="text-sm text-neutral-500">
              {product.location} • 평점 {seller?.rating || 0} ({seller?.transactionCount || 0}회 거래)
            </p>
          </div>
        </div>

        {/* 상품 정보 */}
        <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
        <div className="flex items-center mb-4">
          <p className="text-lg font-bold mr-2">{formatPrice(product.price)}</p>
          <span className="text-sm text-neutral-500">{formatDate(product.createdAt)}</span>
        </div>

        <div className="mb-6">
          <p className="whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* 상품 태그 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400">
            #{product.category}
          </span>
          <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm text-neutral-600 dark:text-neutral-400">
            #{product.location}
          </span>
        </div>

        {/* 상품 통계 */}
        <div className="flex items-center text-sm text-neutral-500 mb-4">
          <div className="flex items-center mr-4">
            <Eye className="mr-1 h-4 w-4" />
            <span>조회 {product.viewCount}</span>
          </div>
          <div className="flex items-center mr-4">
            <Heart className="mr-1 h-4 w-4" />
            <span>관심 {favoriteData?.count || 0}</span>
          </div>
          <div className="flex items-center">
            <MessageCircle className="mr-1 h-4 w-4" />
            <span>채팅 {/* Chat count would be fetched from API */}</span>
          </div>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 px-4 mb-6">
        <h3 className="font-bold mb-4">댓글 <span className="text-neutral-500">({comments?.length || 0})</span></h3>
        
        <div className="space-y-4 mb-6">
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : comments?.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex">
                <Avatar className="w-10 h-10 mr-3">
                  <AvatarImage src={comment.user?.profileImage || ''} alt={comment.user?.nickname || '사용자'} />
                  <AvatarFallback>{comment.user?.nickname?.[0] || '사'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h4 className="font-medium text-sm">
                      {comment.user?.nickname || '사용자'}
                      {comment.userId === product.sellerId && (
                        <span className="text-primary ml-1">(판매자)</span>
                      )}
                    </h4>
                    <span className="text-xs text-neutral-500 ml-2">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm mb-2">{comment.content}</p>
                  <div className="flex items-center text-sm text-neutral-500">
                    {(user?.id === comment.userId || user?.isAdmin) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mr-4 hover:text-neutral-700 dark:hover:text-neutral-300 h-auto p-0 text-xs"
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                      >
                        삭제
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="hover:text-neutral-700 dark:hover:text-neutral-300 h-auto p-0 text-xs"
                    >
                      신고
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-neutral-500 py-4">아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</p>
          )}
        </div>
        
        <div className="flex">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={user?.profileImage || ''} alt={user?.nickname || '사용자'} />
            <AvatarFallback>{user?.nickname?.[0] || '사'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 relative">
            <Textarea 
              placeholder="댓글을 남겨보세요" 
              className="w-full resize-none h-20"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <Button 
              className="absolute right-3 bottom-3"
              size="sm"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              onClick={handleCommentSubmit}
            >
              {addCommentMutation.isPending ? "등록 중..." : "등록"}
            </Button>
          </div>
        </div>
      </div>

      {/* 상품 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteProductMutation.mutate()}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteProductMutation.isPending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 신고 다이얼로그 */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>상품 신고하기</DialogTitle>
            <DialogDescription>
              이 상품이 부적절하거나 가이드라인을 위반한다고 생각하시면 신고해주세요.
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>신고 사유</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="허위매물" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            허위매물
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="부적절한 내용" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            부적절한 내용
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="사기 의심" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            사기 의심
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="기타" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            기타
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reportForm.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상세 내용 (선택사항)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="추가 설명이 필요하시면 입력해주세요"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReportDialog(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={reportProductMutation.isPending}
                >
                  {reportProductMutation.isPending ? "제출 중..." : "신고하기"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 고정된 하단 버튼 */}
      <div className="sticky bottom-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowReportDialog(true)}
        >
          <Flag className="mr-2 h-4 w-4" />
          신고하기
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => startChatMutation.mutate()}
          disabled={!user || user.id === product.sellerId || startChatMutation.isPending}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          채팅하기
        </Button>
        <Button
          className="flex-1"
          disabled={!user || user.id === product.sellerId || product.status === "판매완료"}
          onClick={() => {
            if (user && product.id) {
              navigate(`/checkout/${product.id}`);
            }
          }}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          구매하기
        </Button>
      </div>
    </div>
  );
}
