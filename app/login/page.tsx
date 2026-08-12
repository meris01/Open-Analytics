import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { ILogo } from '@/components/icons';
import { currentUser, isConfigured } from '@/lib/supabase';
import { EnvSetup } from '@/components/env-setup';

export const dynamic = 'force-dynamic';

export default async function Login({
  searchParams,
}: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (!isConfigured()) return <EnvSetup />;
  if (await currentUser()) redirect(next || '/');

  return (
    <main className="dot-grid flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="rise mb-8 flex flex-col items-center text-center">
          <ILogo />
          <h1 className="headline-lg mt-4">OpenAnalytics</h1>
          <p className="mt-2 text-[13px] text-fg-muted">
            Privacy-first analytics that shows you where your revenue comes from.
          </p>
        </div>
        <Suspense fallback={null}>
          <AuthForm next={next} initialError={error} />
        </Suspense>
        <p className="mt-6 text-center text-[11.5px] leading-5 text-fg-subtle">
          No cookies are set on the sites you track. Your analytics data stays in your own database.
        </p>
      </div>
    </main>
  );
}
