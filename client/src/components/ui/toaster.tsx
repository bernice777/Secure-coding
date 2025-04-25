import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Auto-dismiss auth-related toasts after 1 second
        const isAuthToast = 
          (title?.includes("로그인") || 
           title?.includes("회원가입") || 
           title?.includes("로그아웃"));
        
        const autoClose = isAuthToast ? 1000 : 3000; // 1 second for auth, 3 seconds for others
        
        return (
          <Toast key={id} {...props} duration={autoClose}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport className="fixed top-4 right-4 z-50 flex flex-col items-end w-full max-w-xs" />
    </ToastProvider>
  );
}
