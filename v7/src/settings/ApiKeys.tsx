import React from 'react'

export const ApiKeys = ({
  vars, updateVar
}: {
  vars: Record<string, string>;
  updateVar: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="settings-section">
    <h2>API Keys & Variables</h2>
    <div className="space-y-4">
      <div>
        <label className="block mb-2">
          <span className="font-medium">PageSpeed Insights Key</span>
          <input
            className="dt-input w-full mt-1"
            type="text"
            placeholder="Enter your PSI API key"
            value={vars['google_page_speed_insights_key'] || ''}
            onChange={updateVar('google_page_speed_insights_key')}
          />
        </label>
      </div>
      <div>
        <label className="block mb-2">
          <span className="font-medium">Mobile Friendly Test Key</span>
          <input
            className="dt-input w-full mt-1"
            type="text"
            placeholder="Enter your MFT API key"
            value={vars['google_mobile_friendly_test_key'] || ''}
            onChange={updateVar('google_mobile_friendly_test_key')}
          />
        </label>
      </div>
      <div>
        <label className="block mb-2">
          <span className="font-medium">Search Console Site URL</span>
          <input
            className="dt-input w-full mt-1"
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