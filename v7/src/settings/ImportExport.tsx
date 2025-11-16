import React, { useState } from 'react'

import { exportSettings } from './exportSettings'
import { importSettings } from './importSettings'

export const ImportExport = () => {
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    await exportSettings()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      await importSettings(file)
    } finally {
      setImporting(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div className="border rounded bg-gray-50 p-4">
      <h2 className="text-lg font-semibold mb-4">💾 Backup & Restore</h2>

      <div className="flex gap-3">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Settings
        </button>

        <label className="px-4 py-2 border rounded cursor-pointer hover:bg-gray-100">
          {importing ? 'Importing...' : 'Import Settings'}
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-sm text-gray-600 mt-3">
        Export your settings as JSON for backup or sharing. Import to restore settings.
      </p>
    </div>
  )
}
