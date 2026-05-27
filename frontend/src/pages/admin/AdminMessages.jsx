import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../api'

const roleBadge = {
  admin:    'bg-purple-100 text-purple-700',
  investor: 'bg-blue-100 text-blue-700',
  startup:  'bg-teal-100 text-teal-700',
}

export default function AdminMessages() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/admin/negotiations/${id}/messages`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load messages'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <Layout>
      <Link to="/admin/negotiations" className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
        ← Back to Negotiations
      </Link>

      {loading && <div className="text-gray-400 py-12 text-center">Loading messages…</div>}
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      {data && (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{data.negotiation.pitch?.title}</h2>
            <p className="text-gray-500 text-sm mt-1">
              Startup: <strong>{data.negotiation.startup?.name}</strong> ·{' '}
              {data.messages.length} message{data.messages.length !== 1 ? 's' : ''} · Read-only
            </p>
          </div>

          {data.messages.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              No messages yet in this negotiation
            </div>
          ) : (
            <div className="space-y-3">
              {data.messages.map(msg => (
                <div key={msg.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900 text-sm">{msg.sender?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[msg.sender?.role]}`}>
                      {msg.sender?.role}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
