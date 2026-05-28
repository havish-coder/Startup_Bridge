import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import api from '../../api'

const statusStyles = {
  open: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pending_admin_close: 'bg-blue-100 text-blue-700 border border-blue-200',
  concluded: 'bg-purple-100 text-purple-700 border border-purple-200',
  failed: 'bg-red-100 text-red-700 border border-red-200',
}

const interestStatusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  accepted: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  denied: 'bg-red-100 text-red-700 border border-red-200',
}

function formatCurrency(amount) {
  const num = Number(amount)
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`
  return `₹${num.toLocaleString('en-IN')}`
}

export default function NegotiationChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [negotiation, setNegotiation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typedMessage, setTypedMessage] = useState('')

  // Modal State for Finalizing Deal
  const [selectedInterest, setSelectedInterest] = useState(null)
  const [finalAmount, setFinalAmount] = useState('')
  const [finalEquityPct, setFinalEquityPct] = useState('')
  const [finalTermsNote, setFinalTermsNote] = useState('')
  const [accepting, setAccepting] = useState(false)

  const messagesEndRef = useRef(null)

  // Fetch initial details
  async function fetchDetails() {
    try {
      const res = await api.get(`/negotiations/${id}`)
      setNegotiation(res.data.negotiation)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to load negotiation room details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetails()
  }, [id])

  // Polling for messages
  useEffect(() => {
    let intervalId

    const pollMessages = async () => {
      // Smart pause: pauses when tab/page is hidden
      if (document.hidden) return

      try {
        const res = await api.get('/messages', { params: { negotiationId: id } })
        setMessages(res.data.messages)
      } catch (err) {
        console.error('Failed to poll messages:', err)
      }
    }

    pollMessages()
    intervalId = setInterval(pollMessages, 5000)

    // Listener for tab visibility change to instantly poll when active
    const handleVisibilityChange = () => {
      if (!document.hidden) pollMessages()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [id])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Post a message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!typedMessage.trim()) return

    const content = typedMessage.trim()
    setTypedMessage('')

    // Optimistic UI update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      await api.post('/messages', {
        negotiationId: id,
        content,
      })
      // Refetch to replace temp message with proper db values
      const res = await api.get('/messages', { params: { negotiationId: id } })
      setMessages(res.data.messages)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to send message.')
    }
  }

  // Open deal modal pre-filled with investor's offer terms
  const openAcceptModal = (interest) => {
    setSelectedInterest(interest)
    setFinalAmount(interest.proposedAmount)
    setFinalEquityPct(Number(interest.proposedEquityPct).toString())
    setFinalTermsNote(`Agreed final terms with ${interest.investor.name}.`)
  }

  const closeAcceptModal = () => {
    setSelectedInterest(null)
    setFinalAmount('')
    setFinalEquityPct('')
    setFinalTermsNote('')
  }

  // Confirm accept and pick investor
  const handleConfirmAccept = async () => {
    if (!selectedInterest) return
    setAccepting(true)
    try {
      await api.post(`/startup/interests/${selectedInterest.id}/accept`, {
        finalAmount,
        finalEquityPct,
        finalTermsNote,
      })
      alert('Deal finalized! Negotiation is now pending admin close.')
      closeAcceptModal()
      fetchDetails()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to accept offer.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 font-medium">Entering chat room…</span>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center max-w-lg mx-auto mt-12 shadow-sm">
          <p className="font-semibold">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </Layout>
    )
  }

  const isFounder = user?.role === 'startup'
  const isRoomOpen = negotiation.status === 'open'

  return (
    <Layout>
      {/* Top Banner Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-indigo-600 hover:underline mb-3 inline-block font-semibold"
        >
          ← Back
        </button>

        <Card className="border border-gray-200 bg-white/50 backdrop-blur-sm p-4 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                  Group Negotiation
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusStyles[negotiation.status]}`}>
                  {negotiation.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-950 mt-1">Pitch: {negotiation.pitch.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Agreed terms will update here once accepted.</p>
            </div>

            {/* Target Raises */}
            <div className="flex gap-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div>
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Pitch Goal</span>
                <span className="text-sm font-bold text-gray-950">{formatCurrency(negotiation.pitch.fundingAmount)}</span>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Offered Equity</span>
                <span className="text-sm font-bold text-gray-950">{Number(negotiation.pitch.equityPercent)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main layout: Chat and Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-290px)] min-h-[480px]">
        
        {/* Left Side: Negotiating Parties list */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
          <Card className="border border-gray-150 p-4 h-full flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Room Members</h3>
            
            {/* Founder details */}
            <div className="mb-4 pb-3 border-b border-gray-100">
              <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mb-1.5">
                Founder
              </span>
              <p className="text-xs font-bold text-gray-900">{negotiation.startup.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{negotiation.startup.email}</p>
            </div>

            {/* Investors list */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mb-1">
                Investors List
              </span>
              
              {negotiation.interests.map((interest) => (
                <div key={interest.id} className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-gray-900 truncate">{interest.investor.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${interestStatusStyles[interest.status]}`}>
                      {interest.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mb-1">{interest.investor.email}</p>
                  <p className="text-[10px] font-medium text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    Offers {formatCurrency(interest.proposedAmount)} for {Number(interest.proposedEquityPct)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center: Live Group Chat */}
        <div className="lg:col-span-2 flex flex-col h-full bg-white border border-gray-150 rounded-xl overflow-hidden shadow-sm">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No messages in this chat room yet. Type below to start negotiating!
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender.id === user.id
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {/* Sender Name */}
                    <span className="text-[9px] font-bold text-gray-400 mb-0.5 px-1">
                      {msg.sender.name} ({msg.sender.role === 'startup' ? 'Founder' : 'Investor'})
                    </span>

                    {/* Chat Bubble */}
                    <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                      isMine 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-150 text-gray-800 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[8px] text-gray-400 mt-0.5 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Type Message Area */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-150 bg-white flex gap-2">
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Send message to room members…"
              className="flex-1 px-3 py-2 border border-gray-350 focus:border-indigo-500 rounded-lg text-xs outline-none transition"
            />
            <Button type="submit" className="text-xs font-bold py-1.5 px-4 shadow-sm">
              Send
            </Button>
          </form>
        </div>

        {/* Right Side: Startup Pick Winner panel OR Finalized terms details */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
          {isFounder && isRoomOpen ? (
            <Card className="border border-indigo-200 bg-indigo-50/10 p-4 h-full flex flex-col">
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                Pick a Winner
              </h3>
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                Confirm a deal with any active investor in this room to finalize negotiations.
              </p>

              {/* Roster of active investors to choose from */}
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {negotiation.interests.filter(i => i.status === 'pending').map((interest) => (
                  <Card key={interest.id} className="p-3 border border-gray-200 bg-white hover:border-indigo-400 shadow-sm flex flex-col gap-2 hover:-translate-y-0.5 transition duration-150">
                    <div className="text-xs font-bold text-gray-900">{interest.investor.name}</div>
                    <div className="text-[10px] text-indigo-600 bg-indigo-50/60 font-semibold px-2 py-0.5 rounded-md inline-block mr-auto">
                      {formatCurrency(interest.proposedAmount)} ({Number(interest.proposedEquityPct)}%)
                    </div>
                    <Button
                      onClick={() => openAcceptModal(interest)}
                      className="text-[10px] py-1 font-bold w-full mt-1"
                    >
                      Accept Deal Terms
                    </Button>
                  </Card>
                ))}

                {negotiation.interests.filter(i => i.status === 'pending').length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs italic">
                    No active proposals left to choose from.
                  </div>
                )}
              </div>
            </Card>
          ) : (
            // Room is NOT open, or logged-in user is an investor -> show agreed terms details
            <Card className="border border-gray-150 p-4 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Agreed Final Terms
                </h3>

                {negotiation.finalAmount ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 text-xs font-medium">
                      ✓ Investment offer finalized. Pending final admin verification.
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block">Agreed Investment</span>
                      <span className="text-base font-extrabold text-indigo-600 mt-0.5 block">{formatCurrency(negotiation.finalAmount)}</span>
                      
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider block mt-2">Agreed Equity Share</span>
                      <span className="text-base font-extrabold text-indigo-600 mt-0.5 block">{Number(negotiation.finalEquityPct)}%</span>
                    </div>

                    {negotiation.finalTermsNote && (
                      <div className="text-xs text-gray-500 italic bg-gray-50/40 p-2.5 rounded border border-gray-100">
                        <strong>Notes:</strong> "{negotiation.finalTermsNote}"
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs italic leading-relaxed">
                    Founder and investors are currently discussing. Agreeds terms will publish here.
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Finalize investment terms modal */}
      {selectedInterest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full overflow-hidden transform transition-all">
            <div className="px-6 py-4.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Finalize Investment Terms</h3>
              <p className="text-xs text-gray-400 mt-1">Accepting offer from {selectedInterest.investor.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg font-medium leading-relaxed">
                <strong>Attention:</strong> Accepting this proposal immediately finalizes terms, rejects other investors in the room, and moves negotiation status to pending admin close.
              </div>

              <Input
                label="Final Investment Amount (₹)"
                type="number"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                placeholder="e.g. 5000000"
              />

              <Input
                label="Final Equity Share (%)"
                type="number"
                step="0.01"
                value={finalEquityPct}
                onChange={(e) => setFinalEquityPct(e.target.value)}
                placeholder="e.g. 10.0"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Final Terms Details</label>
                <textarea
                  rows={3}
                  value={finalTermsNote}
                  onChange={(e) => setFinalTermsNote(e.target.value)}
                  placeholder="Record deal terms, board seats, milestone releases…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                />
              </div>
            </div>

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
