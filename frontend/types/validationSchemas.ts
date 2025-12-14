import { z } from 'zod'

// شرط تطابق كلمة المرور
const passwordMatch = (schema: z.ZodObject<any>) =>
  schema.refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  })

export const userSchema = passwordMatch(
  z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    nationalId: z.string(),
    country: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
)

export const lawyerSchema = passwordMatch(
  z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    nationalId: z.string(),
    country: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    barAssociation: z.string(),
    registrationNumber: z.string(),
    registrationYear: z.string(),
    specialization: z.string(),
    paymentMethod: z.string(),
  })
)

export const judgeSchema = passwordMatch(
  z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    nationalId: z.string(),
    country: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    courtName: z.string(),
    appointmentYear: z.string(),
    paymentMethod: z.string(),
  })
)

export const expertSchema = passwordMatch(
  z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    nationalId: z.string(),
    country: z.string(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    expertiseField: z.string(),
    licenseNumber: z.string(),
    licenseYear: z.string(),
    paymentMethod: z.string(),
  })
)

// تجميعهم حسب الدور
export const roleSchemas = {
  user: userSchema,
  lawyer: lawyerSchema,
  judge: judgeSchema,
  expert: expertSchema,
}
