import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import api from '../../api'

const statusStyles = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-200',
  published: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  in_negotiation: 'bg-blue-100 text-blue-700 border border-blue-200',
  closed: 'bg-purple-100 text-purple-700 border border-purple-200',
  withdrawn: 'bg-red-100 text-red-700 border border-red-200',
}

const interestStatusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  denied: 'bg-red-100 text-red-700 border border-red-200',
}

const domainColors = {
  FinTech: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  EdTech: 'bg-blue-50 text-blue-700 border border-blue-200',
  HealthTech: 'bg-rose-50 text-rose-700 border border-rose-200',
  D2C: 'bg-amber-50 text-amber-700 border border-amber-200',
  SaaS: 'bg-violet-50 text-violet-700 border border-violet-200',
  Other: 'bg-gray-50 text-gray-700 border border-gray-200',
}

function formatCurrency(amount) {
  const num = Number(amount)
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
  return `₹${num.toLocaleString('en-IN')}`
}

export default function PitchDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [pitch, setPitch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal State
  const [selectedInterest, setSelectedInterest] = useState(null)
  const [finalAmount, setFinalAmount] = useState('')
  const [finalEquityPct, setFinalEquityPct] = useState('')
  const [finalTermsNote, setFinalTermsNote] = useState('')
  const [accepting, setAccepting] = useState(false)

  async function fetchPitch() {
    try {
      const res = await api.get(`/startup/pitches/${id}`)
      setPitch(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch pitch details. Make sure it exists.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPitch()
  }, [id])

  const handleReject = async (interestId, investorName) => {
    if (!window.confirm(`Are you sure you want to reject the offer from ${investorName}?`)) return
    try {
      await api.post(`/startup/interests/${interestId}/deny`)
      alert('Offer rejected successfully.')
      fetchPitch()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to reject offer.')
    }
  }

  const openAcceptModal = (interest) => {
    setSelectedInterest(interest)
    setFinalAmount(interest.proposedAmount)
    setFinalEquityPct(Number(interest.proposedEquityPct).toString())
    setFinalTermsNote(`Agreed to finalize terms with ${interest.investor.name}.`)
  }

  const closeAcceptModal = () => {
    setSelectedInterest(null)
    setFinalAmount('')
    setFinalEquityPct('')
    setFinalTermsNote('')
  }

  const handleConfirmAccept = async () => {
    if (!selectedInterest) return
    setAccepting(true)
    try {
      // POST to /api/startup/interests/:id/accept
      await api.post(`/startup/interests/${selectedInterest.id}/accept`, {
        finalAmount: finalAmount,
        finalEquityPct: finalEquityPct,
        finalTermsNote: finalTermsNote
      })
      alert('Investment proposal accepted successfully! Negotiation room is pending admin finalization.')
      closeAcceptModal()
      fetchPitch()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to accept interest.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading pitch details…</span>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center max-w-lg mx-auto mt-12 shadow-sm">
          <p className="font-semibold">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/startup/pitches')}>
            Back to Pitches
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header breadcrumb */}
      <button
        onClick={() => navigate('/startup/pitches')}
        className="text-sm text-indigo-600 hover:underline mb-4 inline-block font-semibold"
      >
        ← Back to Pitches
      </button>

      {/* Main detail page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Pitch details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-150 shadow-sm relative">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${domainColors[pitch.domain] || domainColors.Other}`}>
                {pitch.domain}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${statusStyles[pitch.status]}`}>
                {pitch.status.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-950 mb-4">{pitch.title}</h2>
            <div className="text-xs text-gray-400 mb-6">Last updated on {new Date(pitch.updatedAt).toLocaleDateString()}</div>

            {/* Target Raises */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Target Funding Goal</span>
                <span className="text-xl font-extrabold text-indigo-600">{formatCurrency(pitch.fundingAmount)}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Equity Relinquished</span>
                <span className="text-xl font-extrabold text-indigo-600">{Number(pitch.equityPercent)}%</span>
              </div>
            </div>

            {/* Structured details */}
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Problem Statement</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{pitch.problem}</p>
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-bold text-gray-800 mb-1">Solution Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{pitch.solution}</p>
              </div>
            </div>

            {/* Pitch deck document */}
            {pitch.deckFile && (
              <div className="mt-6 pt-4 border-t border-gray-150 flex items-center justify-between bg-indigo-50/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-semibold truncate max-w-xs">{pitch.deckFile.originalName}</span>
                </div>
                <a
                  href={`/api/files/${pitch.deckFile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-900 font-bold border-b border-indigo-600"
                >
                  Download Deck
                </a>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Interests received */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Investor Offers</h3>
            <p className="text-xs text-gray-500">View terms and accept proposals from certified angel networks.</p>
          </div>

          {pitch.interests.length === 0 ? (
            <Card className="text-center py-8 border border-gray-150">
              <svg className="mx-auto h-10 w-10 text-gray-350 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <p className="text-gray-500 text-sm font-semibold">No offers received yet</p>
              <p className="text-xs text-gray-400 mt-1">Offers will populate immediately when an investor expresses interest.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pitch.interests.map((interest) => (
                <Card key={interest.id} className="border border-gray-150 shadow-sm">
                  {/* Status header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{interest.investor.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${interestStatusStyles[interest.status]}`}>
                      {interest.status}
                    </span>
                  </div>

                  {/* Proposed terms */}
                  <div className="grid grid-cols-2 gap-2 mb-3 bg-gray-50 p-2 rounded border border-gray-100">
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Proposed Funding</span>
                      <span className="text-xs font-bold text-gray-950">{formatCurrency(interest.proposedAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Equity Seek</span>
                      <span className="text-xs font-bold text-gray-950">{Number(interest.proposedEquityPct)}%</span>
                    </div>
                  </div>

                  {/* Intro message */}
                  <div className="bg-gray-50/20 p-2 rounded border border-gray-100 text-xs text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed">
                    "{interest.message}"
                  </div>

                  {/* Actions */}
                  {interest.status === 'pending' && pitch.status === 'published' && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 text-xs py-1.5 font-bold shadow-sm"
                        onClick={() => openAcceptModal(interest)}
                      >
                        Accept Proposal
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs py-1.5 font-bold px-3 shadow-sm"
                        onClick={() => handleReject(interest.id, interest.investor.name)}
                      >
                        Reject Offer
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept Proposal Modal */}
      {selectedInterest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden transform transition-all">
            <div className="px-6 py-4.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Finalize Investment Terms</h3>
              <p className="text-xs text-gray-400 mt-1">Accepting offer from {selectedInterest.investor.name}</p>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Note alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg font-medium leading-relaxed">
                <strong>Attention:</strong> Accepting this proposal closes active fundraising, denies all other pending offers, and moves the pitch to an active negotiation phase awaiting admin closure.
              </div>

              {/* Amount */}
              <Input
                label="Final Investment Amount (₹)"
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                placeholder="e.g. 5000000"
              />

              {/* Equity */}
              <Input
                label="Final Equity Share (%)"
                type="number"
                step="0.01"
                value={finalEquityPct}
                onChange={(e) => setFinalEquityPct(e.target.value)}
                placeholder="e.g. 10.0"
              />

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Final Terms Details</label>
                <textarea
                  rows={3}
                  value={finalTermsNote}
                  onChange={(e) => setFinalTermsNote(e.target.value)}
                  placeholder="Record note details regarding board seats, milestone distributions etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                onClick={closeAcceptModal}
                disabled={accepting}
                className="text-xs py-1.5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAccept}
                disabled={accepting || !finalAmount || !finalEquityPct}
                className="text-xs py-1.5 font-bold shadow-sm"
              >
                {accepting ? 'Finalizing deal…' : 'Confirm & Accept Deal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}