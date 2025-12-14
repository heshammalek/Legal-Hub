"use client";

import { useForm } from "react-hook-form";
import * as Dialog from "@radix-ui/react-dialog";

type FormData = {
  court_name: string;
  circuit: string;
  case_number: string;
  case_date: string;
  roll?: string;
  required_action: string;
  financial_offer?: string;
  contact_phone?: string;
  whatsapp_number: string;
  whatsapp_url?: string;
  requester_signature?: string;
  registration_number: string;
  power_of_attorney_number: string;
  actor_role?: string;
  delegation_identity?: string;
};

interface DelegationRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export default function DelegationRequestForm({
  isOpen,
  onClose,
  onSubmit,
}: DelegationRequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>();

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
    reset(); // إعادة تعيين النموذج بعد الإرسال
  };

  const handleClose = () => {
    reset(); // إعادة تعيين النموذج عند الإغلاق
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg w-full max-w-xl overflow-y-auto max-h-[90vh]">
          <Dialog.Title className="text-xl font-bold mb-6 text-center">
            طلب إنابة جديد
          </Dialog.Title>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label htmlFor="court_name" className="block text-sm font-medium text-gray-700 mb-1">
                اسم المحكمة *
              </label>
              <input
                id="court_name"
                {...register("court_name", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم المحكمة"
              />
              {errors.court_name && (
                <span className="text-red-500 text-sm">{errors.court_name.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="circuit" className="block text-sm font-medium text-gray-700 mb-1">
                الدائرة *
              </label>
              <input
                id="circuit"
                {...register("circuit", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل اسم الدائرة"
              />
              {errors.circuit && (
                <span className="text-red-500 text-sm">{errors.circuit.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="case_number" className="block text-sm font-medium text-gray-700 mb-1">
                رقم الدعوى *
              </label>
              <input
                id="case_number"
                {...register("case_number", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم الدعوى"
              />
              {errors.case_number && (
                <span className="text-red-500 text-sm">{errors.case_number.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="case_date" className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الدعوى *
              </label>
              <input
                type="date"
                id="case_date"
                {...register("case_date", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.case_date && (
                <span className="text-red-500 text-sm">{errors.case_date.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="roll" className="block text-sm font-medium text-gray-700 mb-1">
                الرول (اختياري)
              </label>
              <input
                id="roll"
                {...register("roll")}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل الرول"
              />
            </div>

            <div>
              <label htmlFor="required_action" className="block text-sm font-medium text-gray-700 mb-1">
                الإجراء المطلوب *
              </label>
              <textarea
                id="required_action"
                {...register("required_action", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="صف الإجراء المطلوب بالتفصيل"
              />
              {errors.required_action && (
                <span className="text-red-500 text-sm">{errors.required_action.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="financial_offer" className="block text-sm font-medium text-gray-700 mb-1">
                القيمة المالية (اختياري)
              </label>
              <input
                type="number"
                id="financial_offer"
                {...register("financial_offer")}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل القيمة المالية"
              />
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                رقم التواصل (اختياري)
              </label>
              <input
                type="tel"
                id="contact_phone"
                {...register("contact_phone")}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم التواصل"
              />
            </div>

            <div>
              <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700 mb-1">
                رقم الواتساب *
              </label>
              <input
                type="tel"
                id="whatsapp_number"
                {...register("whatsapp_number", { 
                  required: "رقم الواتساب مطلوب",
                  pattern: {
                    value: /^[0-9+]+$/,
                    message: "يجب أن يحتوي على أرقام ورمز + فقط"
                  }
                })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: +201234567890"
              />
              {errors.whatsapp_number && (
                <span className="text-red-500 text-sm">{errors.whatsapp_number.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-1">
                رقم القيد *
              </label>
              <input
                id="registration_number"
                {...register("registration_number", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم القيد"
              />
              {errors.registration_number && (
                <span className="text-red-500 text-sm">{errors.registration_number.message}</span>
              )}
            </div>

            <div>
              <label htmlFor="power_of_attorney_number" className="block text-sm font-medium text-gray-700 mb-1">
                رقم التوكيل *
              </label>
              <input
                id="power_of_attorney_number"
                {...register("power_of_attorney_number", { required: "هذا الحقل مطلوب" })}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل رقم التوكيل"
              />
              {errors.power_of_attorney_number && (
                <span className="text-red-500 text-sm">{errors.power_of_attorney_number.message}</span>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                إنشاء طلب الإنابة
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}