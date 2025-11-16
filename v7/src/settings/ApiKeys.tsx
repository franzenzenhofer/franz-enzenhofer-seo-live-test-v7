import React from 'react'

import { PSIKeyInput } from './PSIKeyInput'

export const ApiKeys = ({
  vars, updateVar
}: {
  vars: Record<string, string>
  updateVar: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">API Keys & Variables</h2>
      <div className="space-y-4">
        <PSIKeyInput
          value={vars['google_page_speed_insights_key'] || ''}
          onChange={updateVar('google_page_speed_insights_key')}
        />
      </div>
    </div>
  )
}
