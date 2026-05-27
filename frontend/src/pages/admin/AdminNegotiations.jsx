import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import Button from '../../components/ui/Button'
import api from '../../api'

const STATUS_TABS = ['all', 'open', 'pending_admin_close', 'concluded', 'failed']

const statusBadge = {
  open:                'bg-blue-100 text-blue-700',
  pending_admin_close: 'bg-amber-100 text-amber-700',
  concluded:           'bg-green-100 text-green-700',
  failed:              'bg-red-100 text-red-700',
}

export default function AdminNegotiations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('status') || 'all'

  const [negotiations, setNegotiations] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  const fetchNegotiations = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const res = await api.get('/admin/negotiations', { params })
      setNegotiations(res.data.negotiations)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchNegotiations() }, [fetchNegotiations])

  async function handleAction(url) {
    setActionMsg('')
    try {
      const res = await api.put(url)
      setActionMsg(res.data.message)
      fetchNegotiations()
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Action failed')
    }
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Negotiations</h2>
      <p className="text-gray-500 mb-6">View all group rooms, read messages, conclude or fail deals</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setSearchParams(tab !== 'all' ? { status: tab } : {})}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg">{actionMsg}</div>
      )}

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading negotiations…</div>
      ) : negotiations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No negotiations found
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Pitch</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Startup</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Winner</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Msgs</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Opened</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {negotiations.map(neg => (
                <tr key={neg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {neg.pitch?.title}
                    <span className="ml-2 text-xs text-gray-400">{neg.pitch?.domain}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{neg.startup?.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {neg.acceptedInvestor?.name || <span className="text-gray-300">none yet</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[neg.status]}`}>
                      {neg.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{neg._count?.messages}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(neg.openedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        to={`/admin/negotiations/${neg.id}/messages`}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        View messages
                      </Link>
                      {['open', 'pending_admin_close'].includes(neg.status) && (
                        <>
                          <Button onClick={() => handleAction(`/admin/negotiations/${neg.id}/conclude`)}>
                            Conclude
                          </Button>
                          <Button variant="secondary" onClick={() => handleAction(`/admin/negotiations/${neg.id}/fail`)}>
                            Mark failed
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
