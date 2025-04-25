import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryList } from "@/components/products/category-list";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  
  const category = params.get("category");
  const searchQuery = params.get("search");
  const view = params.get("view");
  
  console.log("SearchQuery:", searchQuery);
  console.log("URL params:", search);
  
  // Featured products query
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["/api/products", { featured: true, limit: 4 }],
  });
  
  // Recent products query
  const { data: recentProducts, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["/api/products/recent", { limit: 4 }],
  });
  
  // Category products query
  const { data: categoryProducts, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["/api/products", { category }],
    enabled: !!category,
  });
  
  // Search results query
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["/api/products", { search: searchQuery }],
    enabled: !!searchQuery,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Determine which products to show
  const getProductsToShow = () => {
    if (searchQuery) {
      return {
        title: `"${searchQuery}" 검색 결과`,
        products: searchResults || [],
        isLoading: isLoadingSearch,
      };
    } else if (category) {
      return {
        title: `${category} 카테고리`,
        products: categoryProducts || [],
        isLoading: isLoadingCategory,
      };
    } else {
      return null;
    }
  };

  const productsToShow = getProductsToShow();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* 배너 섹션 */}
        {!searchQuery && !category && (
          <section className="bg-gradient-to-r from-primary to-primary-400 rounded-xl p-6 mb-8 text-white">
            <div className="md:flex items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">내 주변의 중고 거래, 지금 시작해보세요!</h1>
                <p className="text-primary-50">신뢰할 수 있는 이웃과 함께하는 중고 거래 커뮤니티</p>
                <div className="mt-6">
                  {user ? (
                    <Button 
                      variant="default" 
                      className="bg-white text-primary hover:bg-neutral-100"
                      onClick={() => navigate("/products/create")}
                    >
                      상품 등록하기
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      className="bg-white text-primary hover:bg-neutral-100"
                      onClick={() => navigate("/auth")}
                    >
                      회원가입하기
                    </Button>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <svg
                  className="h-48"
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#fff"
                    d="M150,100 C150,127.6 127.6,150 100,150 C72.4,150 50,127.6 50,100 C50,72.4 72.4,50 100,50 C127.6,50 150,72.4 150,100 Z"
                  />
                  <g transform="translate(82, 80)">
                    <path
                      fill="#FF7E36"
                      d="M30,10 L35,10 L35,5 C35,2.2 32.8,0 30,0 L5,0 C2.2,0 0,2.2 0,5 L0,30 C0,32.8 2.2,35 5,35 L30,35 C32.8,35 35,32.8 35,30 L35,15 L30,15 L30,30 L5,30 L5,5 L30,5 L30,10 Z"
                    />
                    <path
                      fill="#333"
                      d="M25,20 C25,22.8 22.8,25 20,25 C17.2,25 15,22.8 15,20 C15,17.2 17.2,15 20,15 C22.8,15 25,17.2 25,20 Z"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </section>
        )}
        
        {/* 카테고리 섹션 */}
        {(!searchQuery && !category) || view === "categories" ? (
          <CategoryList />
        ) : null}
        
        {/* 검색 결과 또는 카테고리 상품 */}
        {productsToShow && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">{productsToShow.title}</h2>
            {productsToShow.isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : productsToShow.products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productsToShow.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                <p className="text-neutral-500 mb-4">검색 결과가 없습니다.</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/")}
                >
                  홈으로 돌아가기
                </Button>
              </div>
            )}
          </section>
        )}
        
        {/* 추천 상품 섹션 */}
        {!searchQuery && !category && (
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">지금 핫한 상품</h2>
              <Button 
                variant="link" 
                className="text-sm text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                onClick={() => navigate("/?view=featured")}
              >
                더보기
              </Button>
            </div>
            {isLoadingFeatured ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : featuredProducts && featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                <p className="text-neutral-500">아직 추천 상품이 없습니다.</p>
              </div>
            )}
          </section>
        )}
        
        {/* 최근 등록된 상품 섹션 */}
        {!searchQuery && !category && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">최근 등록된 상품</h2>
              <Button 
                variant="link" 
                className="text-sm text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                onClick={() => navigate("/?view=recent")}
              >
                더보기
              </Button>
            </div>
            {isLoadingRecent ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : recentProducts && recentProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                <p className="text-neutral-500">아직 등록된 상품이 없습니다.</p>
              </div>
            )}
          </section>
        )}
        
        {/* 상품 등록 플로팅 버튼 */}
        {user && (
          <Button
            onClick={() => navigate("/products/create")}
            className="fixed right-4 bottom-4 lg:right-8 lg:bottom-8 w-14 h-14 bg-primary hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 p-0"
          >
            <PlusIcon className="h-6 w-6" />
          </Button>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
