import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CurrentUserData {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  redirect_url: string;
  lawyer_id: string | null;
}

export function useCurrentLawyer() {
  const [lawyerId, setLawyerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        console.log("🔍 جلب بيانات المستخدم الحالي...");
        
        const response = await fetch("/api/me", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
          },
        });

        console.log("📡 استجابة /api/me:", response.status);

        // ✅ معالجة 401 - المستخدم غير مسجل دخول
        if (response.status === 401) {
          console.log("❌ 401 - المستخدم غير مسجل دخول");
          setError("يجب تسجيل الدخول أولاً");
          
          // إعادة توجيه لصفحة تسجيل الدخول
          const currentPath = window.location.pathname;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        // ✅ معالجة أخطاء أخرى
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ خطأ من السيرفر:", errorText);
          throw new Error(`فشل في جلب بيانات المستخدم: ${response.status}`);
        }

        const data: CurrentUserData = await response.json();
        console.log("✅ بيانات المستخدم:", data);
        
        // ✅ التحقق من أن المستخدم محامي
        if (data.role !== "lawyer") {
          setError("المستخدم الحالي ليس محاميًا");
          console.log("⚠️ المستخدم ليس محاميًا، role:", data.role);
          return;
        }

        // ✅ التحقق من وجود lawyer_id
        if (!data.lawyer_id) {
          setError("لم يتم العثور على ملف المحامي");
          console.error("❌ lawyer_id غير موجود في الاستجابة");
          return;
        }

        setLawyerId(data.lawyer_id);
        console.log("✅ تم العثور على lawyer_id:", data.lawyer_id);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير معروف";
        setError(errorMessage);
        console.error("❌ خطأ في جلب بيانات المحامي:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentUser();
  }, [router, API_BASE_URL]);

  return { lawyerId, isLoading, error };
}