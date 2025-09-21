'use client'

import { useState } from 'react'
import { Upload, Download, Trash2, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  migrateLocalStorageToSupabase,
  clearCloudData,
  exportLocalStorageData,
  downloadDataAsFile
} from '@/utils/migration'

export function MigrationPanel() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
    details?: string[]
  } | null>(null)

  const handleMigration = async () => {
    setLoading(true)
    setResult(null)

    try {
      const migrationResult = await migrateLocalStorageToSupabase()

      if (migrationResult.success) {
        setResult({
          type: 'success',
          message: migrationResult.message,
          details: migrationResult.errors.length > 0 ? migrationResult.errors : undefined
        })
      } else {
        setResult({
          type: 'error',
          message: migrationResult.message,
          details: migrationResult.errors
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Migration failed with an unexpected error',
        details: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    setResult(null)

    try {
      const exportResult = await exportLocalStorageData()

      if (exportResult.success && exportResult.data) {
        downloadDataAsFile(exportResult.data)
        setResult({
          type: 'success',
          message: exportResult.message
        })
      } else {
        setResult({
          type: 'error',
          message: exportResult.message
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Export failed with an unexpected error',
        details: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearCloud = async () => {
    if (!window.confirm(
      'Are you sure you want to clear all your cloud data? This action cannot be undone!'
    )) {
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const clearResult = await clearCloudData()

      if (clearResult.success) {
        setResult({
          type: 'success',
          message: clearResult.message
        })
      } else {
        setResult({
          type: 'error',
          message: clearResult.message
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to clear cloud data',
        details: [error instanceof Error ? error.message : 'Unknown error']
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <>
      {/* Migration Button - Fixed position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 md:hidden"
        title="Data Migration & Export"
      >
        <Upload className="w-5 h-5" />
      </button>

      {/* Desktop Migration Link */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
      >
        <Upload className="w-4 h-4" />
        Data Migration
      </button>

      {/* Migration Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
          <div className="bg-white rounded-t-2xl md:rounded-lg w-full md:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Data Migration & Export</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info Section */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">About Data Migration</p>
                    <p>
                      You can migrate your local data to the cloud for syncing across devices,
                      or export it as a backup file.
                    </p>
                  </div>
                </div>
              </div>

              {/* Result Display */}
              {result && (
                <div className={`mb-4 p-4 rounded-lg ${
                  result.type === 'success' ? 'bg-green-50 border border-green-200' :
                  result.type === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {result.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                    {result.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />}
                    {result.type === 'info' && <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        result.type === 'success' ? 'text-green-800' :
                        result.type === 'error' ? 'text-red-800' :
                        'text-blue-800'
                      }`}>
                        {result.message}
                      </p>
                      {result.details && result.details.length > 0 && (
                        <ul className={`mt-2 text-sm ${
                          result.type === 'success' ? 'text-green-700' :
                          result.type === 'error' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          {result.details.map((detail, index) => (
                            <li key={index} className="ml-4">• {detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleMigration}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      {loading ? 'Migrating...' : 'Migrate to Cloud'}
                    </div>
                    <div className="text-sm opacity-90">
                      Move localStorage data to cloud for syncing
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      {loading ? 'Exporting...' : 'Export Local Data'}
                    </div>
                    <div className="text-sm opacity-90">
                      Download a backup file of your local data
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleClearCloud}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">
                      Clear Cloud Data
                    </div>
                    <div className="text-sm opacity-90">
                      Remove all your data from the cloud
                    </div>
                  </div>
                </button>
              </div>

              {/* Warning */}
              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important Notes:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• Migration will only work if your cloud is empty</li>
                      <li>• Export creates a JSON backup file</li>
                      <li>• Clearing cloud data cannot be undone</li>
                      <li>• Always backup your data before major changes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}