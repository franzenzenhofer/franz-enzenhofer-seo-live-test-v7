import { referencesFor } from './references.mjs'
import { linkedValue } from './links.mjs'
import { escapeHtml } from './html.mjs'
export { escapeHtml } from './html.mjs'
import { isCompleteOriginal, representationLabel } from './valueIntegrity.mjs'
import { icons } from './icons.mjs'
import { pageUrl } from './fixtures.mjs'
export const states = {
  pass: { label: 'Passed', icon: 'circle-check', border: 'border-emerald-300', tint: 'bg-emerald-50/60', ink: 'text-emerald-700' },
  fail: { label: 'Failed', icon: 'circle-x', border: 'border-red-300', tint: 'bg-red-50/70', ink: 'text-red-700' },
  warn: { label: 'Criterion not met', icon: 'triangle-alert', border: 'border-amber-300', tint: 'bg-amber-50/70', ink: 'text-amber-700' },
  info: { label: 'Observation', icon: 'info', border: 'border-blue-300', tint: 'bg-blue-50/60', ink: 'text-blue-700' },
  disabled: { label: 'Disabled', icon: 'circle-pause', border: 'border-slate-300', tint: 'bg-slate-50', ink: 'text-slate-500' },
  pending: { label: 'Checking', icon: 'loader-circle', border: 'border-slate-300', tint: 'bg-slate-50', ink: 'text-slate-500' },
  unavailable: { label: 'Check could not run', icon: 'circle-alert', border: 'border-orange-300', tint: 'bg-orange-50/60', ink: 'text-orange-700' },
  na: { label: 'Not applicable', icon: 'circle-minus', border: 'border-slate-300', tint: 'bg-slate-50', ink: 'text-slate-500' },
}
export const icon = (name, label, classes = 'h-4 w-4') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 ${classes}" ${label ? `role="img" aria-label="${escapeHtml(label)}"><title>${escapeHtml(label)}</title>` : 'aria-hidden="true">'}${icons[name]}</svg>`
const rows = pairs => `<dl class="space-y-1.5">${pairs.map(([key, value]) => `<div class="flex items-baseline gap-2"><dt class="shrink-0 text-sm leading-5 text-slate-600">${escapeHtml(key)}:</dt><dd class="min-w-0 flex-1 text-sm leading-5 text-slate-950 [overflow-wrap:anywhere]">${linkedValue(value)}</dd></div>`).join('')}</dl>`
const source = (item, instance) => {
  const visibleMarkup = item.values.filter(field => field[2] === 'markup' && isCompleteOriginal(field)).map(([, value]) => value)
  const remaining = (item.sources || []).filter(markup => !visibleMarkup.includes(markup))
  if (item.sources?.length && !remaining.length) return ''
  return `<section class="space-y-1.5 border-t border-slate-200/80 pt-2"><h3 class="text-sm font-semibold text-slate-900">Retrieved markup</h3>${remaining.length ? `<dl class="space-y-2">${remaining.map((value, index) => overviewField([`Markup ${index + 1}`, value, 'markup', item.sourceIntegrity], index, `${instance}-source`)).join('')}</dl>` : `<p class="text-sm text-slate-600">${escapeHtml(item.noMarkup || 'None retrieved')}</p>`}</section>`
}
const actionClass = 'flex h-8 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-sm text-slate-600 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700'
const primaryValue = (field, fieldId) => {
  const [, value, format] = field
  if (format !== 'markup') return `<span>${linkedValue(value)}</span>`
  if (!isCompleteOriginal(field)) return `<p class="text-xs font-normal text-slate-600">${representationLabel(field)}</p><code class="whitespace-pre-wrap break-words font-mono text-sm">${linkedValue(value)}</code>`
  return `<textarea id="${fieldId}" readonly rows="2" class="block min-h-9 w-full resize-y [field-sizing:content] rounded-lg border border-slate-300 bg-white/90 px-2 py-1.5 text-base leading-6 text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700">\n${escapeHtml(value)}</textarea>`
}
const overviewField = (field, index, instance) => {
  const [key, , format] = field
  if (typeof key !== 'string' || !key.trim()) throw new Error('Every result value requires a visible key')
  const fieldId = `${instance}-value-${index}`
  const label = format === 'markup' && isCompleteOriginal(field) ? `<label for="${fieldId}">${escapeHtml(key)}:</label>` : `${escapeHtml(key)}:`
  return `<div class="${format === 'markup' ? '' : 'flex items-baseline gap-2'}"><dt class="${format === 'markup' ? 'mb-1' : 'shrink-0'} text-sm text-slate-600">${label}</dt><dd class="min-w-0 text-base font-medium leading-6 text-slate-950 [overflow-wrap:anywhere]">${primaryValue(field, fieldId)}</dd></div>`
}
const references = item => `<section class="space-y-1 border-t border-slate-200/80 pt-2" aria-label="References"><h3 class="text-sm font-semibold text-slate-900">References</h3><ul class="space-y-1">${referencesFor(item).map(url => `<li class="text-sm leading-5 [overflow-wrap:anywhere]"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline underline-offset-2" data-reference-url>${escapeHtml(url)}</a></li>`).join('')}</ul></section>`
const metadata = item => [['Rule ID', item.id], ['Run position', String(item.runPosition)], ['Sort priority', item.sortPriority === null ? 'Not assigned' : String(item.sortPriority)]]
const metadataFooter = item => `<footer class="border-t border-slate-200/80 pt-2" aria-label="Rule metadata"><dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-slate-600">${metadata(item).map(([key, value]) => `<div class="flex gap-1"><dt>${escapeHtml(key)}:</dt><dd class="font-mono text-slate-700">${linkedValue(value)}</dd></div>`).join('')}</dl></footer>`
export const card = (item, expanded, instance, options = {}) => {
  const state = states[item.status]
  const detailId = `${instance}-details`
  return `<article class="relative rounded-xl border ${state.border} ${state.tint}" data-card="${instance}">
    <header class="flex items-start gap-2.5 px-3 pt-2">
      <span class="mt-1 ${state.ink}">${icon(state.icon, state.label, item.status === 'pending' ? 'h-5 w-5 motion-safe:animate-spin' : 'h-5 w-5')}</span>
      <h2 class="min-w-0 flex-1 pt-0.5 text-base font-semibold leading-6 text-slate-950">${escapeHtml(item.name)}${options.favorite ? ` ${icon('star', 'Favorited', 'ml-0.5 inline-block h-4 w-4 fill-amber-400 text-amber-600 align-[-2px]')}` : ''}</h2>
      <button class="${actionClass}" data-copy aria-label="Copy result" title="Copy result">${icon('copy')}</button>
      <button class="${actionClass}" data-toggle aria-expanded="${expanded}" aria-controls="${detailId}" aria-label="${expanded ? 'Hide details' : 'Show details'}" title="${expanded ? 'Hide details' : 'Show details'}">${icon(expanded ? 'minimize-2' : 'maximize-2')}</button>
      <div class="relative -mr-1 shrink-0" data-actions>
        <button class="${actionClass}" data-menu-toggle aria-label="Result actions" aria-haspopup="menu" aria-expanded="false" aria-controls="${instance}-menu">${icon('ellipsis-vertical')}</button>
        <div id="${instance}-menu" role="menu" aria-label="Result actions" hidden class="absolute right-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          ${[[options.favorite ? 'Unfavorite' : 'Favorite', 'favorite', 'star'], [options.disabled ? 'Enable rule' : 'Disable rule', 'disable', options.disabled ? 'circle-play' : 'circle-pause'], ['Open in full report', 'report', 'external-link']].map(([label, action, glyph]) => `<button role="menuitem" tabindex="-1" data-action="${action}" class="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none">${icon(glyph)}${label}</button>`).join('')}
        </div>
      </div>
    </header>
    ${options.disabled && item.status !== 'disabled' ? `<div class="px-3 pt-1.5">${rows([['Next run', 'Disabled']])}</div>` : ''}
    <dl class="space-y-2 px-3 pb-2 pt-1.5">${item.values.map((field, index) => overviewField(field, index, instance)).join('')}</dl>
    ${expanded ? '' : `<p class="px-3 pb-2 text-right text-xs leading-4 text-slate-500 [overflow-wrap:anywhere]" data-checked-input><span class="sr-only">Checked input: </span>${escapeHtml(item.input)}</p>`}
    <div id="${detailId}" ${expanded ? '' : 'hidden'} class="space-y-2 border-t border-slate-200/80 px-3 py-2.5">
      ${rows([['Checked input', item.input]])}
      ${item.detailValues?.length ? `<section aria-label="Extracted values">${rows(item.detailValues)}</section>` : ''}
      <section aria-label="Check performed">${rows(item.checked)}</section>
      ${item.facts ? `<section class="space-y-1.5 border-t border-slate-200/80 pt-2"><h3 class="text-sm font-semibold text-slate-900">Evidence</h3>${rows(item.facts)}</section>` : ''}
      ${item.evidence ? `<section class="space-y-2 border-t border-slate-200/80 pt-2"><h3 class="text-sm font-semibold text-slate-900">Evidence</h3>${item.evidence.map(evidence => `<section class="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3"><h4 class="text-sm font-semibold text-slate-800">${escapeHtml(evidence.name)}</h4>${rows(evidence.fields)}</section>`).join('')}</section>` : ''}
      ${source(item, instance)}
      ${references(item)}
      ${metadataFooter(item)}
    </div>
  </article>`
}
export const copyText = item => [
  `Rule: ${item.name}`, `Status: ${states[item.status].label}`, `Page URL: ${pageUrl}`, `Checked input: ${item.input}`,
  ...item.values.map(field => `${field[0]}${field[2] === 'markup' && !isCompleteOriginal(field) ? ` (${representationLabel(field)})` : ''}: ${field[1]}`),
  ...(item.detailValues || []).map(([key, value]) => `${key}: ${value}`), '', 'Checked:',
  ...item.checked.map(([key, value]) => `${key}: ${value}`),
  ...(item.facts ? ['', 'Evidence:', ...item.facts.map(([key, value]) => `${key}: ${value}`)] : []),
  ...(item.evidence || []).flatMap(record => ['', `${record.name}:`, ...record.fields.map(([key, value]) => `${key}: ${value}`)]),
  ...(item.sources ? ['', 'Retrieved markup:', ...item.sources] : ['', `Retrieved markup: ${item.noMarkup || 'None retrieved'}`]),
  '', ...referencesFor(item).map(url => `Reference: ${url}`),
  '', ...metadata(item).map(([key, value]) => `${key}: ${value}`),
].join('\n')
