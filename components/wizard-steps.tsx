import { ICheck } from './icons';

const STEPS = ['Add your website', 'Install the script', 'Verify it works'];

export function WizardSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="rise mb-6 flex items-center gap-2" style={{ animationDelay: '60ms' }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-200 ${
                done ? 'bg-primary text-[color:var(--c-on-primary)]'
                : active ? 'bg-primary-soft text-primary ring-1 ring-primary/40'
                : 'bg-container-high text-fg-subtle'
              }`}
            >
              {done ? <ICheck width={12} height={12} /> : n}
            </span>
            <span className={`hidden text-[12.5px] sm:block ${active ? 'text-fg' : 'text-fg-subtle'}`}>
              {label}
            </span>
            {n < STEPS.length && (
              <span className={`h-px flex-1 ${done ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
