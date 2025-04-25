import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const registerFormSchema = z.object({
  username: z.string().min(4, "아이디는 최소 4자 이상이어야 합니다"),
  nickname: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  confirmPassword: z.string(),
  profileImage: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val, "이용약관에 동의해주세요"),
}).refine(data => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  onShowLogin: () => void;
}

export function RegisterForm({ onShowLogin }: RegisterFormProps) {
  const { registerMutation } = useAuth();
  const [_, navigate] = useLocation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      nickname: "",
      password: "",
      confirmPassword: "",
      profileImage: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        onShowLogin(); // Show login form after successful registration
      },
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">회원가입</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          계정을 만들고 중고 거래의 모든 기능을 이용하세요.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>아이디</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="아이디를 입력해주세요" 
                    type="text" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>닉네임</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="닉네임을 입력해주세요" 
                    type="text" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="비밀번호를 입력해주세요 (8자 이상)" 
                    type="password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 확인</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="비밀번호를 다시 입력해주세요" 
                    type="password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profileImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로필 이미지 URL (선택사항)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="프로필 이미지 URL을 입력해주세요" 
                    type="text" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  프로필 이미지 URL을 입력하거나 비워두세요.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      <Button variant="link" className="p-0 h-auto text-primary">이용약관</Button> 및{" "}
                      <Button variant="link" className="p-0 h-auto text-primary">개인정보처리방침</Button>에 동의합니다.
                    </span>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "가입 중..." : "가입하기"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm mt-6">
        <span className="text-neutral-600 dark:text-neutral-400">이미 계정이 있으신가요?</span>{" "}
        <Button 
          variant="link" 
          className="p-0 h-auto text-primary font-medium"
          onClick={onShowLogin}
        >
          로그인
        </Button>
      </div>
    </div>
  );
}
