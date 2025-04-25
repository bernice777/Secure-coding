import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Product } from "@shared/schema";
import { Heart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get favorite status and count
  const { data: favoriteData } = useQuery({
    queryKey: [`/api/products/${product.id}/favorites`],
    enabled: !!product.id,
  });
  
  const isFavorited = favoriteData?.isFavorited || false;
  const favoriteCount = favoriteData?.count || 0;
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }
      
      if (isFavorited) {
        await apiRequest("DELETE", `/api/favorites/${product.id}`);
      } else {
        await apiRequest("POST", "/api/favorites", { productId: product.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}/favorites`] });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      toast({
        title: isFavorited ? "찜 해제" : "찜하기 완료",
        description: isFavorited ? "찜 목록에서 제거되었습니다." : "찜 목록에 추가되었습니다.",
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
  
  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };
  
  // Format date
  const formatDate = (dateString: Date) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "찜하기 기능은 로그인 후 이용 가능합니다.",
        variant: "destructive",
      });
      return;
    }
    
    toggleFavoriteMutation.mutate();
  };

  return (
    <div className={cn(
      "bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-w-1 aspect-h-1">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-48 object-cover"
          />
          <button
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-neutral-700",
              isFavorited ? "text-primary-500" : "text-neutral-400 hover:text-primary-500"
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
          </button>
          <div className={cn(
            "absolute bottom-0 left-0 text-xs px-2 py-1 rounded-tr-md",
            getStatusBadgeColor(product.status)
          )}>
            {product.status}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-2 mb-1">{product.title}</h3>
          <div className="flex justify-between items-center">
            <p className="font-bold text-lg">{formatPrice(product.price)}</p>
            <div className="flex items-center text-neutral-500 text-sm">
              <Heart className="mr-1 h-4 w-4" />
              <span>{favoriteCount}</span>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-neutral-500">
            <span>{product.location}</span>
            <span className="mx-1">·</span>
            <span>{formatDate(product.createdAt)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
