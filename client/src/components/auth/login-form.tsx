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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const loginFormSchema = z.object({
  username: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  onShowSignup: () => void;
}

export function LoginForm({ onShowSignup }: LoginFormProps) {
  const { loginMutation } = useAuth();
  const [_, navigate] = useLocation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate("/");
      },
    });
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">로그인</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          계정에 로그인하고 중고 거래를 시작하세요.
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="비밀번호를 입력해주세요" 
                    type="password" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full mt-6"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </Form>

      <div className="mt-6">
        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 px-2 text-xs text-neutral-500">
            또는
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
          >
            <i className="ri-kakao-talk-fill text-yellow-400 mr-2 text-lg"></i>
            <span>카카오</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
          >
            <i className="ri-google-fill text-red-500 mr-2 text-lg"></i>
            <span>구글</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 flex items-center justify-center"
          >
            <i className="ri-apple-fill mr-2 text-lg"></i>
            <span>애플</span>
          </Button>
        </div>
      </div>

      <div className="text-center text-sm mt-6">
        <span className="text-neutral-600 dark:text-neutral-400">아직 회원이 아니신가요?</span>{" "}
        <Button 
          variant="link" 
          className="p-0 h-auto text-primary font-medium"
          onClick={onShowSignup}
        >
          회원가입
        </Button>
      </div>
    </div>
  );
}
