import z from 'zod';

export const loginFormSchema = z.object({
  email: z.email({
    message: 'Please enter a valid email address',
  }),
  password: z
    .string({
      message: 'Please enter a password',
    })
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
