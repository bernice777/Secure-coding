import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/products/product-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch favorites
  const { data: favorites, isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  // Filter favorites based on product status
  const getFilteredFavorites = () => {
    if (!favorites) return [];
    
    if (activeTab === "all") {
      return favorites;
    }
    
    return favorites.filter((fav: any) => fav.product?.status === activeTab);
  };

  const filteredFavorites = getFilteredFavorites();

  // If not logged in, redirect to login page
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">로그인이 필요합니다</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              찜 목록을 확인하려면 로그인이 필요합니다.
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">찜 목록</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            관심 있는 상품들을 모아볼 수 있습니다.
          </p>
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="판매중">판매중</TabsTrigger>
            <TabsTrigger value="예약중">예약중</TabsTrigger>
            <TabsTrigger value="판매완료">판매완료</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFavorites.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFavorites.map((favorite: any) => (
                  <ProductCard key={favorite.id} product={favorite.product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                <Heart className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                <h2 className="mt-4 text-lg font-medium">찜한 상품이 없습니다</h2>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  마음에 드는 상품을 찾아 하트 아이콘을 눌러 추가해보세요.
                </p>
                <Button 
                  onClick={() => navigate("/")} 
                  className="mt-6"
                >
                  상품 둘러보기
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
