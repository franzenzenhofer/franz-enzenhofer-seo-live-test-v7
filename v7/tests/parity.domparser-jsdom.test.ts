import { describe, it, expect } from 'vitest'

import { runAll } from '@/core/run'
import { pageFromEvents } from '@/shared/page'
import { titleLengthRule } from '@/rules/head/titleLength'
import { metaCharsetRule } from '@/rules/head/metaCharset'
import { trailingSlashRule } from '@/rules/url/trailingSlash'
import { JSDOM } from 'jsdom'

const events = (url: string, html: string) => ([
  { t: 'nav:before', u: url },
  { t: 'nav:commit', u: url },
  { t: 'dom:document_end', d: { html } },
  { t: 'dom:document_idle', d: { html } },
]) as unknown as import('@/background/pipeline/types').EventRec[]

describe('parity: DOMParser vs JSDOM', () => {
  it('produces identical results for core head/url rules', async () => {
    const url = 'https://a.example/x'
    const html = '<!doctype html><meta charset="utf-8"><title>Hello World</title>'
    const rules = [titleLengthRule, metaCharsetRule, trailingSlashRule] as unknown as import('@/core/types').Rule[]

    const dp = await pageFromEvents(events(url, html), (s)=> new DOMParser().parseFromString(s,'text/html'), ()=>'about:blank')
    const jd = await pageFromEvents(events(url, html), (s)=> new JSDOM(s).window.document, ()=>'about:blank')

    const a = await runAll(0, rules, dp, { globals: {} })
    const b = await runAll(0, rules, jd, { globals: {} })

    const norm = (xs: any[]) => xs.map((r)=>({label:r.label,type:r.type,message:r.message})).sort((x,y)=> (x.label+x.type).localeCompare(y.label+y.type))
    expect(norm(a)).toEqual(norm(b))
  })
})

