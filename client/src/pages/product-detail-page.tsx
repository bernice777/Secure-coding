import { useParams, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductDetail } from "@/components/products/product-detail";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch product
  const { data: product, isLoading } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : id ? (
          <ProductDetail productId={parseInt(id)} />
        ) : (
          <div className="flex justify-center items-center h-96">
            <p className="text-neutral-500">상품을 찾을 수 없습니다.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
