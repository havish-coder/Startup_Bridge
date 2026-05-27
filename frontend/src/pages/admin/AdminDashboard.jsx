import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import Card from '../../components/ui/Card'
import api from '../../api'

function StatCard({ label, value, color, to }) {
  const colors = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <Link to={to} className={`block rounded-xl border p-6 hover:shadow-md transition ${colors[color]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-4xl font-bold mt-1">{value ?? '—'}</p>
    </Link>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h2>
      <p className="text-gray-500 mb-8">Platform overview — click a card to manage</p>

      {loading ? (
        <div className="text-gray-400 text-center py-16">Loading stats…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending Approvals" value={stats?.pendingUsers} color="amber" to="/admin/users?status=pending" />
          <StatCard label="Active Negotiations" value={stats?.activeNegotiations} color="indigo" to="/admin/negotiations" />
          <StatCard label="Concluded Deals" value={stats?.concludedDeals} color="green" to="/admin/negotiations?status=concluded" />
          <StatCard label="Total Users" value={stats?.totalUsers} color="gray" to="/admin/users" />
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <Link to="/admin/users?status=pending" className="block text-sm text-indigo-600 hover:underline">
              → Review pending user registrations
            </Link>
            <Link to="/admin/negotiations?status=pending_admin_close" className="block text-sm text-indigo-600 hover:underline">
              → Conclude deals awaiting your approval
            </Link>
            <Link to="/admin/users" className="block text-sm text-indigo-600 hover:underline">
              → Manage all users
            </Link>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-800 mb-2">How admin works</h3>
          <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
            <li>New users are <strong>pending</strong> until you approve them</li>
            <li>Investors & startups negotiate in group rooms</li>
            <li>You read all messages and conclude deals</li>
            <li>Suspended users cannot log in</li>
          </ul>
        </Card>
      </div>
    </Layout>
  )
}
