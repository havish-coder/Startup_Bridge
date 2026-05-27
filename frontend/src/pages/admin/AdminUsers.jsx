import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import Button from '../../components/ui/Button'
import api from '../../api'

const STATUS_TABS = ['all', 'pending', 'approved', 'suspended']

function VerificationNote({ note }) {
  const [open, setOpen] = useState(false)
  if (!note) return <span className="text-xs text-gray-300">no note</span>
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="text-xs text-indigo-600 hover:underline">
        {open ? 'Hide note ▲' : 'View note ▼'}
      </button>
      {open && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-gray-700 max-w-xs whitespace-pre-wrap">
          {note}
        </div>
      )}
    </div>
  )
}

const statusBadge = {
  pending:   'bg-amber-100 text-amber-700',
  approved:  'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
}
const roleBadge = {
  admin:    'bg-purple-100 text-purple-700',
  investor: 'bg-blue-100 text-blue-700',
  startup:  'bg-teal-100 text-teal-700',
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('status') || 'all'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // userId to confirm delete

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {}
      const res = await api.get('/admin/users', { params })
      setUsers(res.data.users)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleAction(url, method = 'put') {
    setActionMsg('')
    try {
      const res = await api[method](url)
      setActionMsg(res.data.message)
      fetchUsers()
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Action failed')
    }
  }

  async function handleDelete(userId) {
    setDeleteConfirm(null)
    await handleAction(`/admin/users/${userId}`, 'delete')
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">User Management</h2>
      <p className="text-gray-500 mb-6">Approve, suspend, or remove users</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setSearchParams(tab !== 'all' ? { status: tab } : {})}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {actionMsg && (
        <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 text-sm rounded-lg">{actionMsg}</div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Delete user?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This is permanent. The user and all their data will be removed.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Yes, delete</Button>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 py-12 text-center">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No users found
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <VerificationNote note={user.verificationNote} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadge[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <div className="flex gap-2 flex-wrap">
                        {user.status === 'pending' && (
                          <Button onClick={() => handleAction(`/admin/users/${user.id}/approve`)}>
                            Approve
                          </Button>
                        )}
                        {user.status === 'approved' && (
                          <Button variant="secondary" onClick={() => handleAction(`/admin/users/${user.id}/suspend`)}>
                            Suspend
                          </Button>
                        )}
                        {user.status === 'suspended' && (
                          <Button onClick={() => handleAction(`/admin/users/${user.id}/approve`)}>
                            Re-approve
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => setDeleteConfirm(user.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
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
