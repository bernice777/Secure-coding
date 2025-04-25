import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Trash2,
  X
} from "lucide-react";
import { insertProductSchema } from "@shared/schema";

// Extended schema with array validation
const createProductSchema = z.object({
  title: z.string().min(5, "제목은 최소 5자 이상이어야 합니다"),
  description: z.string().min(20, "설명은 최소 20자 이상이어야 합니다"),
  price: z.coerce.number().min(1, "가격을 입력해주세요"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  location: z.string().min(1, "지역을 입력해주세요"),
  images: z.array(z.string()).min(1, "최소 1개 이상의 이미지가 필요합니다"),
  status: z.string().default("판매중"),
});

type CreateProductFormValues = z.infer<typeof createProductSchema>;

export default function ProductCreatePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: "",
      description: "",
      price: undefined,
      category: "",
      location: "",
      images: [],
      status: "판매중",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", {
        ...data,
        sellerId: user?.id,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/recent"] });
      
      toast({
        title: "상품 등록 성공",
        description: "상품이 성공적으로 등록되었습니다.",
      });
      
      navigate(`/products/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "상품 등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateProductFormValues) => {
    createProductMutation.mutate(values);
  };

  const addImage = () => {
    if (!imageUrl) return;
    
    if (!imageUrl.startsWith("http")) {
      toast({
        title: "이미지 추가 실패",
        description: "유효한 이미지 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const newImages = [...imageUrls, imageUrl];
    setImageUrls(newImages);
    form.setValue("images", newImages);
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    const newImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImages);
    form.setValue("images", newImages);
  };

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
              상품 등록 기능을 이용하려면 로그인이 필요합니다.
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
          <Button 
            variant="ghost" 
            className="flex items-center gap-1"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>홈으로 돌아가기</span>
          </Button>
        </div>
        
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>상품 등록</CardTitle>
            <CardDescription>
              판매하고자 하는 상품의 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품명</FormLabel>
                      <FormControl>
                        <Input placeholder="상품명을 입력하세요" {...field} />
                      </FormControl>
                      <FormDescription>
                        상품의 정확한 이름을 입력해주세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>가격</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="가격을 입력하세요" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        원하는 판매 가격을 원 단위로 입력해주세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="카테고리를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="디지털기기">디지털기기</SelectItem>
                          <SelectItem value="의류">의류</SelectItem>
                          <SelectItem value="도서">도서</SelectItem>
                          <SelectItem value="가구/인테리어">가구/인테리어</SelectItem>
                          <SelectItem value="취미/게임">취미/게임</SelectItem>
                          <SelectItem value="차량/오토바이">차량/오토바이</SelectItem>
                          <SelectItem value="유아동">유아동</SelectItem>
                          <SelectItem value="스포츠/레저">스포츠/레저</SelectItem>
                          <SelectItem value="식물">식물</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        상품과 가장 잘 맞는 카테고리를 선택해주세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>거래 지역</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 서울 강남구" {...field} />
                      </FormControl>
                      <FormDescription>
                        거래를 원하는 지역을 입력해주세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품 설명</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="상품 상태, 구매 시기, 사용감 등 자세한 내용을 입력해주세요." 
                          className="min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        상품에 대한 자세한 설명을 작성해주세요. (최소 20자)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>상품 이미지</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="이미지 URL을 입력하세요" 
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                            />
                            <Button 
                              type="button" 
                              onClick={addImage}
                              variant="outline"
                            >
                              <ImagePlus className="h-4 w-4 mr-2" />
                              추가
                            </Button>
                          </div>
                          
                          {imageUrls.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {imageUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={url}
                                    alt={`상품 이미지 ${index + 1}`}
                                    className="h-32 w-full object-cover rounded-md border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border-2 border-dashed rounded-md p-8 text-center">
                              <ImagePlus className="h-10 w-10 mx-auto text-neutral-400" />
                              <p className="mt-2 text-neutral-500">이미지 URL을 추가해주세요</p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        상품 이미지 URL을 추가해주세요. (최소 1개)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? "등록 중..." : "상품 등록하기"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
