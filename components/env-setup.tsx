import { CopyBlock } from './copy-block';
import { ILogo, IWarn } from './icons';

export function EnvSetup() {
  const env = `NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
OA_SALT=a-long-random-string
NEXT_PUBLIC_APP_URL=http://localhost:3000`;

  return (
    <main className="dot-grid flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 flex items-center gap-3">
          <ILogo />
          <h1 className="headline-lg">Finish setting up</h1>
        </div>
        <div className="card p-6">
          <p className="flex items-start gap-2.5 text-[13px] text-fg-muted">
            <IWarn width={16} height={16} className="mt-0.5 shrink-0 text-[color:var(--c-warn)]" />
            <span>
              OpenAnalytics needs to know where your database lives. Create{' '}
              <code className="data-mono rounded bg-container-high px-1">.env.local</code> in the project
              root with the values below, then restart the dev server.
            </span>
          </p>
          <div className="mt-4"><CopyBlock code={env} lang=".env.local" /></div>
          <ol className="mt-5 space-y-2.5 text-[13px] text-fg-muted">
            {[
              'Create a project at supabase.com (the free tier is plenty to start).',
              'Run 0001_init.sql then 0003_auth_multitenant.sql in the SQL editor.',
              'Copy the Project URL and the publishable key from Project Settings → API.',
              'Restart the dev server and reload this page.',
            ].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="data-mono flex h-5 w-5 shrink-0 items-center justify-center rounded bg-container-high text-[11px] text-primary">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-md border border-border bg-surface-low p-3 text-[12.5px] text-fg-subtle">
            Note there is no service-role key here. The dashboard reads through the signed-in
            user&apos;s own session and row-level security, so a leaked key cannot expose your data.
          </p>
        </div>
      </div>
    </main>
  );
}
