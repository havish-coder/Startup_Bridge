import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Layout from '../../components/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import api from '../../api'

const DOMAINS = ['FinTech', 'EdTech', 'HealthTech', 'D2C', 'SaaS', 'Other']

export default function CreatePitch() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  
  const [deckFileId, setDeckFileId] = useState(null)
  const [deckFileName, setDeckFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Handle PDF file upload immediately on selection
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF format pitch decks are allowed.')
      return
    }

    setUploadError('')
    setUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      // POST to /api/files with query parameter scope=pitch_deck
      const res = await api.post('/files?scope=pitch_deck', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setDeckFileId(res.data.id)
      setDeckFileName(file.name)
    } catch (err) {
      console.error(err)
      setUploadError(err.response?.data?.error || 'Failed to upload pitch deck. Make sure it is a valid PDF.')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data) => {
    setServerError('')
    setSubmitting(true)

    try {
      await api.post('/startup/pitches', {
        title: data.title,
        problem: data.problem,
        solution: data.solution,
        fundingAmount: data.fundingAmount,
        equityPercent: data.equityPercent,
        domain: data.domain,
        deckFileId: deckFileId || null
      })
      navigate('/startup/pitches')
    } catch (err) {
      console.error(err)
      setServerError(err.response?.data?.error || 'Failed to create pitch. Please verify all inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-indigo-600 hover:underline mb-4 inline-block font-semibold"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Fundraising Pitch</h2>
          <p className="text-gray-500 mt-1">Pitch your product concept, explain details, and upload documents to attract investors.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm border border-red-200 rounded-xl font-medium shadow-sm">
            {serverError}
          </div>
        )}

        <Card className="shadow-md border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Title */}
            <Input
              label="Pitch Title / Startup Name"
              placeholder="e.g. Acme Health - AI Medical Assistant"
              {...register('title', { required: 'Title is required' })}
              error={errors.title?.message}
            />

            {/* Domain Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sector Domain</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                {...register('domain', { required: 'Domain is required' })}
              >
                <option value="">Select a sector…</option>
                {DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain.message}</p>}
            </div>

            {/* Funding Amount and Equity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Funding Goal (₹)"
                type="number"
                placeholder="e.g. 5000000"
                {...register('fundingAmount', { 
                  required: 'Funding amount is required', 
                  min: { value: 1, message: 'Must be greater than 0' } 
                })}
                error={errors.fundingAmount?.message}
              />

              <Input
                label="Equity Offered (%)"
                type="number"
                step="0.01"
                placeholder="e.g. 10.0"
                {...register('equityPercent', { 
                  required: 'Equity percentage is required', 
                  min: { value: 0.01, message: 'Must be greater than 0%' },
                  max: { value: 99.99, message: 'Must be less than 100%' }
                })}
                error={errors.equityPercent?.message}
              />
            </div>

            {/* Problem Statement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Problem Statement</label>
              <textarea
                rows={3}
                placeholder="What user pain point or market gap are you resolving?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                {...register('problem', { required: 'Problem statement is required' })}
              />
              {errors.problem && <p className="mt-1 text-sm text-red-600">{errors.problem.message}</p>}
            </div>

            {/* Solution Statement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Solution Description</label>
              <textarea
                rows={3}
                placeholder="How does your product solve this issue? Highlight core innovations."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                {...register('solution', { required: 'Solution statement is required' })}
              />
              {errors.solution && <p className="mt-1 text-sm text-red-600">{errors.solution.message}</p>}
            </div>

            {/* Pitch Deck File Upload */}
            <div className="pt-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Pitch Deck File (Optional PDF)</label>
              <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-4 bg-gray-50/50 hover:bg-indigo-50/10 transition text-center relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={uploading}
                />
                
                <div className="space-y-1">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-600">Click to upload or drag & drop PDF</p>
                  <p className="text-[10px] text-gray-400">PDF documents only</p>
                </div>
              </div>

              {uploading && (
                <div className="mt-2 text-xs text-indigo-600 flex items-center gap-2 font-medium">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                  Uploading PDF pitch deck file…
                </div>
              )}
              {deckFileName && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-semibold shadow-sm">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Successfully uploaded: {deckFileName}
                </div>
              )}
              {uploadError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg font-medium">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate('/startup/dashboard')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || uploading}
                className="shadow-sm hover:shadow-md"
              >
                {submitting ? 'Creating draft…' : 'Create Draft Pitch'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}