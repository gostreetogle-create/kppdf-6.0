'use client';

import { Suspense, useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { isProd } from '@/lib/env';
import { Eye, EyeOff, Shield, Zap, BarChart3, AlertTriangle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Доступ запрещён. У вас нет прав для просмотра этой страницы.',
  viewer: 'Роль «наблюдатель» не позволяет редактировать данные.',
  expired: 'Сеанс истёк. Пожалуйста, войдите снова.',
};

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorKey = searchParams.get('error');
    if (errorKey && ERROR_MESSAGES[errorKey]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(ERROR_MESSAGES[errorKey]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Ошибка авторизации');
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, title: 'Безопасность', desc: 'JWT авторизация и ролевой доступ' },
    { icon: Zap, title: 'Скорость', desc: 'Мгновенная генерация документов' },
    { icon: BarChart3, title: 'Аналитика', desc: 'Дашборды и отчёты в реальном времени' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background from palette #245 */}
      <div className="absolute inset-0" style={{background: 'var(--gradient-background)'}} />
      {/* Warm earthy blur orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#d4a271]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#a47a58]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#b4c4bb]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl text-white text-2xl font-bold mb-4 shadow-lg" style={{background: 'var(--gradient-primary)', boxShadow: '0 8px 24px rgba(212,162,113,0.3)'}}>
            KP
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">KP CRM</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Система управления коммерческими предложениями</p>
        </div>

        <div className="bg-[var(--card)]/80 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Форма входа">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-[var(--foreground)] mb-2">Логин</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                placeholder="Введите логин"
                autoFocus
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[var(--foreground)] mb-2">Пароль</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                  placeholder="Введите пароль"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm animate-fadeIn">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-label="Войти в систему"
              className="w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
              style={{background: 'var(--gradient-primary)'}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>

          {!isProd && (
            <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
              Demo: admin / admin123
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="text-center">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl mb-2" style={{background: 'rgba(212,162,113,0.12)'}}>
                  <Icon className="h-5 w-5" style={{color: '#d4a271'}} />
                </div>
                <p className="text-xs font-medium text-[var(--foreground)]">{f.title}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
