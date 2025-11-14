import React from 'react'

export const ApiKeys = ({
  vars, updateVar
}: {
  vars: Record<string, string>;
  updateVar: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <h2 className="text-lg font-semibold mb-4">API Keys & Variables</h2>
    <div className="space-y-4">
      <div>
        <label className="block">
          <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
            PageSpeed Insights Key
            <a
              href="https://developers.google.com/speed/docs/insights/v5/get-started"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 underline"
            >
              Docs
            </a>
          </span>
          <input
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="Enter your PSI API key"
            value={vars['google_page_speed_insights_key'] || ''}
            onChange={updateVar('google_page_speed_insights_key')}
          />
          <p className="text-xs text-gray-600 mt-1">
            Required for PSI rules (mobile/desktop/FCP). Use a Google Cloud API key tied to the PageSpeed Insights API.
          </p>
        </label>
      </div>
      <div>
        <label className="block">
          <span className="text-sm font-medium text-gray-900">Search Console Site URL</span>
          <input
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="https://example.com/ or sc-domain:example.com"
            value={vars['gsc_site_url'] || ''}
            onChange={updateVar('gsc_site_url')}
          />
          <p className="text-xs text-gray-600 mt-1">
            Used by Search Console rules (top queries, indexing). Provide the exact property identifier such as
            <code className="mx-1">https://example.com/</code> or <code className="mx-1">sc-domain:example.com</code>.
          </p>
        </label>
      </div>
    </div>
  </div>
)
