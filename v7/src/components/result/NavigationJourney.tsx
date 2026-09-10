import { DetailCopyButton } from './DetailCopyButton'

import { navigationStepMeaning, navigationStepsCopy, navigationStepTitle } from '@/shared/navigationSteps'
import type { NavigationStep } from '@/shared/navigationSteps'

export const NavigationJourney = ({ steps }: { steps: NavigationStep[] }) => (
  <section aria-label="Navigation journey" className="space-y-3 text-base">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-semibold text-slate-900">What happened</h3>
      <DetailCopyButton value={navigationStepsCopy(steps)}>Copy journey</DetailCopyButton>
    </div>
    <ol className="ml-3 border-l-2 border-slate-300">
      {steps.map((step, index) => (
        <li key={index} className="relative pb-4 pl-6 last:pb-0" data-testid="navigation-step">
          <span className="absolute -left-4 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-800 font-semibold text-white">{index + 1}</span>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <p className={`font-semibold ${step.type === 'history_api' ? 'text-slate-700' : (step.statusCode ?? 0) >= 400 ? 'text-red-800' : step.type === 'load' ? 'text-emerald-800' : 'text-blue-800'}`}>{navigationStepTitle(step)}</p>
            <p className="break-all text-slate-900">{step.url}</p>
            <p className="text-slate-600">{navigationStepMeaning(step, steps[index - 1])}</p>
            {step.target && <p className="break-all text-slate-800"><span className="font-medium">Destination:</span> {step.target}</p>}
            {step.type === 'http_redirect' && !step.target && <p className="text-slate-600">Destination not captured.</p>}
          </div>
        </li>
      ))}
    </ol>
  </section>
)
