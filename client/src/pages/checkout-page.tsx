import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Stripe 초기화
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// 결제 폼 컴포넌트
const CheckoutForm = ({ productId, productTitle, amount }: { productId: number, productTitle: string, amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "결제 준비 중",
        description: "결제창이 아직 완전히 로딩되지 않았습니다.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    console.log("✅ confirm 시작");
    console.log("stripe:", stripe);
    console.log("elements:", elements);
  
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/products/${productId}?payment_success=true`,
      },
    });
  
    console.log("🎯 confirm 결과:", { error, paymentIntent });

    if (error) {
      toast({
        title: "결제 실패",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing} 
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              결제 처리 중...
            </>
          ) : (
            `${amount.toLocaleString()}원 결제하기`
          )}
        </Button>
      </div>
    </form>
  );
};

// 메인 결제 페이지
export default function CheckoutPage() {
  const [match, params] = useRoute("/checkout/:productId");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productData, setProductData] = useState<{
    title: string;
    price: number;
    sellerId: number;
  } | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const productId = params?.productId ? parseInt(params.productId) : null;

  useEffect(() => {
    if (!productId) {
      setError("상품 정보를 찾을 수 없습니다");
      setIsLoading(false);
      return;
    }

    // 상품 정보 가져오기
    const fetchProductData = async () => {
      try {
        const res = await apiRequest("GET", `/api/products/${productId}`);
        if (!res.ok) {
          throw new Error("상품 정보를 가져오는데 실패했습니다");
        }
        const product = await res.json();
        setProductData(product);
        
        // 상품 정보를 가져온 후 결제 의도 생성
        const paymentRes = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: product.price,
          productId: product.id,
          sellerId: product.sellerId
        });
        
        if (!paymentRes.ok) {
          throw new Error("결제 정보를 생성하는데 실패했습니다");
        }
        
        const { clientSecret } = await paymentRes.json();
        setClientSecret(clientSecret);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError((err as Error).message);
        toast({
          title: "오류 발생",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [productId, toast]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-lg">결제 정보를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 오류 발생 시
  if (error || !productData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>결제 오류</CardTitle>
              <CardDescription>결제를 처리할 수 없습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error || "상품 정보를 찾을 수 없습니다"}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate("/")}>홈으로 돌아가기</Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>결제 페이지</CardTitle>
              <CardDescription>
                안전한 결제를 위해 카드 정보를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-muted rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">상품명:</span>
                  <span>{productData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">결제 금액:</span>
                  <span className="font-bold text-primary">
                    {productData.price.toLocaleString()}원
                  </span>
                </div>
              </div>

              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    productId={productId!} 
                    productTitle={productData.title} 
                    amount={productData.price}
                  />
                </Elements>
              ) : (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-xs text-muted-foreground">
                <p>* 테스트 모드에서는 실제 결제가 발생하지 않습니다.</p>
                <p>* 테스트용 카드 번호: 4242 4242 4242 4242 (만료일: 미래 날짜, CVC: 아무 3자리)</p>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/products/${productId}`)}
              >
                결제 취소하고 돌아가기
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}