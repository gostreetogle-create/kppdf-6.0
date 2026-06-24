/**
 * Login page (Client Component) — Mantine + RHF + Zod, простая форма.
 * Делает POST на /api/auth/login (тот же endpoint что в Phase 1 Bootstrap).
 * При успехе браузер получает Set-Cookie → router.push('/').
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Title, Text, Paper, PasswordInput, TextInput, Button, Alert } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});
type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'same-origin',
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setServerError(body.error ?? `Login failed (HTTP ${res.status})`);
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Network error');
    }
  };

  return (
    <Container size={420} my="xl">
      <Title order={2} ta="center" mb="md">
        KPPDF CRM — Вход
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="lg">
        Введите учётные данные.
      </Text>
      <Paper withBorder p="lg" radius="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              {...register('email')}
              label="Email"
              type="email"
              autoComplete="username"
              error={errors.email?.message}
            />
            <PasswordInput
              {...register('password')}
              label="Пароль"
              autoComplete="current-password"
              error={errors.password?.message}
            />
            {serverError && <Alert color="red">{serverError}</Alert>}
            <Button type="submit" loading={isSubmitting} fullWidth>
              Войти
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
