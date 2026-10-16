import { supabase } from '@/lib/supabase'

export type RegisterableRole = 'student' | 'staff'

export type RegisterAccountInput = {
  email: string
  password: string
  fullName: string
  role: RegisterableRole
}

export function isRegisterableRole(value: string): value is RegisterableRole {
  return value === 'student' || value === 'staff'
}

export async function registerAccount(input: RegisterAccountInput) {
  if (!isRegisterableRole(input.role)) {
    throw new Error('El rol debe ser estudiante o personal')
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        role: input.role,
      },
    },
  })

  if (error) throw error
  return data
}
