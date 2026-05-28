import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../api'

const statusStyles = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-emerald-100 text-emerald-700',
  in_negotiation: 'bg-blue-100 text-blue-700',
  closed: 'bg-purple-100 text-purple-700',
  withdrawn: 'bg-red-100 text-red-700',
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

export default function StartupDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/startup/dashboard')
        setData(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading Dashboard…</span>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center max-w-lg mx-auto mt-12 shadow-sm">
          <p className="font-semibold">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </Layout>
    )
  }

  const { stats, recentPitches } = data

  return (
    <Layout>
      {/* Welcome header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Founder Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage your active fundraising pitches, view offers, and negotiate terms.</p>
        </div>
        <Button onClick={() => navigate('/startup/create')} className="shadow-sm hover:shadow transition-all">
          + Create New Pitch
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Pitches Card */}
        <Card className="hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Pitches</span>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalPitches}</p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Published Card */}
        <Card className="hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Feeds</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.published}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Received Interests Card */}
        <Card className="hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Interests Received</span>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{stats.interests}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Negotiations Card */}
        <Card className="hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Deals</span>
              <p className="text-3xl font-extrabold text-blue-600 mt-1">{stats.negotiations}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Pitches Section */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">My Recent Pitches</h3>
      {recentPitches.length === 0 ? (
        <Card className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No pitches created yet.</p>
          <p className="text-sm text-gray-400 mt-1">Get started by creating your first investment proposal.</p>
          <Button className="mt-4" onClick={() => navigate('/startup/create')}>
            + Create First Pitch
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 border border-gray-200 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pitch Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Funding Goal</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Equity Offered</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-150">
                {recentPitches.map((pitch) => (
                  <tr key={pitch.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{pitch.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Created {new Date(pitch.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${domainColors[pitch.domain] || domainColors.Other}`}>
                        {pitch.domain}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap font-medium text-gray-900">
                      {formatCurrency(pitch.fundingAmount)}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap font-medium text-gray-900">
                      {Number(pitch.equityPercent)}%
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyles[pitch.status]}`}>
                        {pitch.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/startup/pitches/${pitch.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Layout>
  )
}