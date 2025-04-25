import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 카테고리 목록
const categories = [
  "전자제품",
  "의류",
  "가구",
  "도서",
  "스포츠",
  "음악",
  "취미",
  "식품",
  "기타",
];

// 지역 목록
const locations = [
  "서울",
  "부산",
  "인천",
  "대구",
  "대전",
  "광주",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  // 상품 데이터 가져오기
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  // 폼 스키마 정의
  const formSchema = z.object({
    title: z.string()
      .min(2, { message: "제목은 최소 2글자 이상이어야 합니다." })
      .max(100, { message: "제목은 최대 100글자까지 가능합니다." }),
    price: z.coerce.number()
      .min(0, { message: "가격은 0원 이상이어야 합니다." })
      .max(100000000, { message: "가격은 1억원 이하여야 합니다." }),
    description: z.string()
      .min(10, { message: "설명은 최소 10글자 이상이어야 합니다." })
      .max(2000, { message: "설명은 최대 2000글자까지 가능합니다." }),
    category: z.string({
      required_error: "카테고리를 선택해주세요.",
    }),
    location: z.string({
      required_error: "지역을 선택해주세요.",
    }),
    status: z.string({
      required_error: "상태를 선택해주세요.",
    }),
    images: z.string().array().min(1, { message: "최소 1개 이상의 이미지가 필요합니다." }),
  });

  type FormValues = z.infer<typeof formSchema>;

  // 폼 초기화
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      price: 0,
      description: "",
      category: "",
      location: "",
      status: "판매중",
      images: [],
    },
  });

  // 상품 데이터로 폼 업데이트
  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        location: product.location,
        status: product.status,
        images: product.images,
      });
    }
  }, [product, form]);

  // 상품 수정 뮤테이션
  const updateProductMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 관리자가 다른 사람의 상품을 수정할 때는 원래 sellerId를 유지
      const productData = {
        ...values,
        // 관리자이고 자신의 상품이 아닌 경우 원래 판매자 ID 유지
        sellerId: user.isAdmin && product?.sellerId !== user.id 
          ? product?.sellerId 
          : user.id,
      };

      const res = await apiRequest("PATCH", `/api/products/${id}`, productData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "상품 수정 완료",
        description: "상품이 성공적으로 수정되었습니다.",
      });
      navigate(`/products/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "상품 수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 로그인하지 않은 경우 처리
  useEffect(() => {
    if (!user && !isLoadingProduct) {
      toast({
        title: "로그인 필요",
        description: "로그인 후 이용해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isLoadingProduct, navigate, toast]);

  // 자신이 등록한 상품이 아니고 관리자도 아닌 경우
  useEffect(() => {
    if (product && user && product.sellerId !== user.id && !user.isAdmin) {
      toast({
        title: "접근 권한 없음",
        description: "자신이 등록한 상품이나 관리자만 수정할 수 있습니다.",
        variant: "destructive",
      });
      navigate(`/products/${id}`);
    }
  }, [product, user, id, navigate, toast]);

  // 폼 제출 처리
  const onSubmit = (values: FormValues) => {
    updateProductMutation.mutate(values);
  };

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">상품 수정</h1>

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
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="가격을 입력하세요"
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value) || 0);
                      }}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
                      원
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지역</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="판매중">판매중</SelectItem>
                      <SelectItem value="예약중">예약중</SelectItem>
                      <SelectItem value="판매완료">판매완료</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상품 설명</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="상품에 대한 상세한 설명을 입력하세요."
                    className="min-h-[200px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이미지 URL</FormLabel>
                <FormDescription>
                  이미지 URL을 한 줄에 하나씩 입력하세요. (쉼표로 구분)
                </FormDescription>
                <FormControl>
                  <Textarea
                    placeholder="예: https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className="min-h-[100px] resize-none"
                    value={field.value.join(",")}
                    onChange={(e) => {
                      const urls = e.target.value
                        .split(",")
                        .map((url) => url.trim())
                        .filter((url) => url.length > 0);
                      field.onChange(urls);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/products/${id}`)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={updateProductMutation.isPending}
              className={cn(
                updateProductMutation.isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              {updateProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  수정 중...
                </>
              ) : (
                "수정 완료"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}