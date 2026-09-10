import { fixtures, pageUrl } from './fixtures.mjs'
import { linkedValue } from './links.mjs'
import { bindMenu } from './menu.mjs'
import { favorites, disabled, toggleSetting, displayItem } from './settings.mjs'
import { card, copyText, escapeHtml, icon } from './render.mjs'

const root = document.querySelector('#prototype')
let selected = Number(new URLSearchParams(location.search).get('example') ?? 2)
if (!fixtures[selected]) selected = 0
const reportMode = new URLSearchParams(location.search).has('report')
let views = reportMode ? fixtures.map(() => true) : [false, true]
let feedbackTimer
const render = () => {
  clearTimeout(feedbackTimer)
  const entries = views.map((expanded, index) => ({ expanded, item: displayItem(fixtures[reportMode ? index : selected]), example: reportMode ? index : selected }))
  root.innerHTML = `<div class="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
    <header class="mb-8 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-widest text-slate-500">SEO Live Test · Design prototype</p><span class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-500">Dummy data</span></div>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-950">${reportMode ? 'Full report · Dummy results' : 'One result card. Two states.'}</h1>
      <div class="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-6">
        <div class="space-y-1"><p class="text-xs font-medium text-slate-500">Page URL</p><p class="text-sm text-slate-700 [overflow-wrap:anywhere]">${linkedValue(pageUrl)}</p></div>
        <label class="flex flex-col gap-1.5 text-xs font-medium text-slate-500">Example<select id="example" class="h-10 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700">${fixtures.map((fixture, index) => `<option value="${index}" ${index === selected ? 'selected' : ''}>${escapeHtml(fixture.name)}</option>`).join('')}</select></label>
      </div>
    </header>
    <div class="grid items-start gap-7 ${reportMode ? 'mx-auto max-w-2xl' : 'md:grid-cols-2'}">
      ${entries.map(({ item, expanded }, index) => `<section class="min-w-0 space-y-3">${reportMode ? '' : `<p class="text-xs font-semibold uppercase tracking-widest text-slate-500">${index ? 'Detail mode' : 'Overview'}</p>`}${card(item, expanded, `view-${index}`, { favorite: favorites.has(item.id), disabled: disabled.has(item.id) })}</section>`).join('')}
    </div>
    <footer class="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">Interactive dummy: settings are saved only for this prototype. No live checks are run. Icons: <a class="text-blue-700 underline underline-offset-2" href="https://lucide.dev/">Lucide</a>.</footer>
    <p id="feedback" role="status" class="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white empty:hidden"></p>
  </div>`
  document.querySelector('#example').addEventListener('change', event => {
    selected = Number(event.target.value); views = reportMode ? fixtures.map(() => true) : [false, true]; render()
  })
  root.querySelectorAll('[data-card]').forEach((element, index) => {
    const { item, example } = entries[index]
    bindMenu(element.querySelector('[data-actions]'), action => {
      if (action === 'report') {
        const url = new URL(location.href); url.searchParams.set('report', '1'); url.searchParams.set('example', String(example))
        window.open(url.href, '_blank', 'noopener'); return
      }
      toggleSetting(action === 'favorite' ? favorites : disabled, item.id)
      render()
      document.querySelector(`[data-card="view-${index}"] [data-menu-toggle]`).focus()
    })
    element.querySelector('[data-toggle]').addEventListener('click', () => {
      views[index] = !views[index]; render()
      document.querySelector(`[data-card="view-${index}"] [data-toggle]`).focus()
    })
    element.querySelector('[data-copy]').addEventListener('click', async event => {
      const button = event.currentTarget
      try {
        await navigator.clipboard.writeText(copyText(item))
        button.innerHTML = icon('check')
        document.querySelector('#feedback').textContent = 'Result copied'
        clearTimeout(feedbackTimer)
        feedbackTimer = setTimeout(() => {
          if (button.isConnected) button.innerHTML = icon('copy')
          document.querySelector('#feedback').textContent = ''
        }, 1800)
      } catch {
        const dialog = document.querySelector('#copy-fallback')
        const reportText = dialog.querySelector('#copy-text')
        reportText.textContent = copyText(item)
        dialog.showModal(); reportText.focus()
        const range = document.createRange(); range.selectNodeContents(reportText)
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range)
      }
    })
  })
}
render()
if (reportMode) document.querySelector(`[data-card="view-${selected}"]`).scrollIntoView({ block: 'start' })
document.querySelector('#close-copy').addEventListener('click', () => document.querySelector('#copy-fallback').close())
