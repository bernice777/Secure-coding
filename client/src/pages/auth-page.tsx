import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (user) {
    return null; // No need to render anything if redirecting
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Auth Form */}
          <Card className="w-full max-w-md mx-auto md:mx-0">
            <CardContent className="py-6">
              {showLogin ? (
                <LoginForm onShowSignup={() => setShowLogin(false)} />
              ) : (
                <RegisterForm onShowLogin={() => setShowLogin(true)} />
              )}
            </CardContent>
          </Card>
          
          {/* Hero/Information Section */}
          <div className="hidden md:flex flex-col justify-center">
            <div className="bg-primary/10 dark:bg-primary/5 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-6 text-primary">중고마켓을 시작해보세요</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <i className="ri-check-line text-primary text-xl mr-2"></i>
                  <span>내 주변의 다양한 중고 물품을 구경해보세요</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-primary text-xl mr-2"></i>
                  <span>필요 없는 물건을 판매하고 수익을 창출하세요</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-primary text-xl mr-2"></i>
                  <span>실시간 채팅으로 편리하게 거래하세요</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-primary text-xl mr-2"></i>
                  <span>다양한 카테고리의 상품을 찾아보세요</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-primary text-xl mr-2"></i>
                  <span>찜 기능으로 관심 상품을 저장하세요</span>
                </li>
              </ul>
              
              <div className="mt-8 p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  <i className="ri-shield-check-line text-success-500 mr-2"></i>
                  <span className="font-medium">안전한 거래를 약속합니다</span>
                </p>
                <p className="text-sm text-neutral-500">
                  중고마켓은 사용자의 안전과 개인정보 보호를 최우선으로 생각합니다.
                  신뢰할 수 있는 거래 환경을 제공하기 위해 최선을 다하고 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
