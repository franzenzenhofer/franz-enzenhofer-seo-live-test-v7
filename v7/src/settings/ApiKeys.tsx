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
          <span className="text-sm font-medium text-gray-900">PageSpeed Insights Key</span>
          <input
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="Enter your PSI API key"
            value={vars['google_page_speed_insights_key'] || ''}
            onChange={updateVar('google_page_speed_insights_key')}
          />
        </label>
      </div>
      <div>
        <label className="block">
          <span className="text-sm font-medium text-gray-900">Mobile Friendly Test Key</span>
          <input
            className="mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            type="text"
            placeholder="Enter your MFT API key"
            value={vars['google_mobile_friendly_test_key'] || ''}
            onChange={updateVar('google_mobile_friendly_test_key')}
          />
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
        </label>
      </div>
    </div>
  </div>
)