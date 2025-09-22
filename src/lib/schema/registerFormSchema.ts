import z from 'zod';

const registerFormSchema = z
  .object({
    name: z
      .string({
        message: 'Please enter your first name',
      })
      .min(2, 'First name must be at least 2 characters long'),
    email: z.email({
      message: 'Please enter a valid email address',
    }),
    password: z
      .string({
        message: 'Please enter a password',
      })
      .min(8, 'Password must be at least 8 characters long')
      .max(32, 'Password must be at most 32 characters long'),
    confirmPassword: z.string({
      message: 'Please confirm your password',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export { registerFormSchema, type RegisterFormData };
