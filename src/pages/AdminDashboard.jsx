import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { config, apiRequest } from '../config';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    email: '',
    phone: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    if (!token || !user) {
      navigate('/admin/login');
      return;
    }

    setAdminUser(JSON.parse(user));
    fetchDashboardData(token);
  }, [navigate]);

  const fetchDashboardData = async (token) => {
    try {
      const [applicantsData, statsData] = await Promise.all([
        apiRequest(config.endpoints.applicants),
        apiRequest(config.endpoints.stats)
      ]);

      setApplicants(applicantsData.applicants || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      // If unauthorized, redirect to login
      if (error.message && error.message.includes('session')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const data = await apiRequest(`${config.endpoints.applicants}?${params.toString()}`);
      setApplicants(data.applicants || []);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const data = await apiRequest(config.endpoints.applicant(id), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      setApplicants(applicants.map(a => 
        a.id === id ? { ...a, status: newStatus } : a
      ));
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this applicant?')) return;

    try {
      await apiRequest(config.endpoints.applicant(id), {
        method: 'DELETE'
      });

      setApplicants(applicants.filter(a => a.id !== id));
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const exportToExcel = () => {
    const exportData = applicants.map(a => ({
      'ID': a.id,
      'Full Name': a.fullName,
      'Email': a.email,
      'Phone': a.mobileNumber,
      'Facebook Name': a.facebookName || '',
      'Present Work': a.presentWork || '',
      'Present Address': a.presentAddress || '',
      'Desired Course': a.desiredCourse || '',
      'Training Format': a.trainingFormat || '',
      'Payment Mode': a.paymentMode || '',
      'Additional Notes': a.additionalNotes || '',
      'Status': a.status,
      'Submitted At': new Date(a.submittedAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applicants');
    XLSX.writeFile(wb, `Solfix_Applicants_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsMessage({ type: '', text: '' });

    if (settingsForm.newPassword && settingsForm.newPassword !== settingsForm.confirmPassword) {
      setSettingsMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      const data = await apiRequest(config.endpoints.adminCredentials, {
        method: 'PUT',
        body: JSON.stringify({
          email: settingsForm.email,
          phone: settingsForm.phone,
          username: settingsForm.username,
          currentPassword: settingsForm.currentPassword,
          newPassword: settingsForm.newPassword || undefined
        })
      });

      setSettingsMessage({ type: 'success', text: data.message });
      setSettingsForm({
        ...settingsForm,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      setAdminUser(data.admin);
    } catch (error) {
      setSettingsMessage({ type: 'error', text: error.message || 'Failed to update settings' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Solfix Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Welcome, {adminUser?.username}</span>
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Applicants</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalApplicants}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pendingCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Approved</p>
                  <p className="text-3xl font-bold text-green-400 mt-1">{stats.approvedCount}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rejected</p>
                  <p className="text-3xl font-bold text-red-400 mt-1">{stats.rejectedCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, email, or phone..."
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white transition-colors"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => fetchDashboardData()}
                className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Name</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Email</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Phone</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Course</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Status</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {applicants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-12">
                      No applicants found. Share the registration form to collect applications.
                    </td>
                  </tr>
                ) : (
                  applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-white">{applicant.fullName}</td>
                      <td className="px-6 py-4 text-gray-400">{applicant.email}</td>
                      <td className="px-6 py-4 text-gray-400">{applicant.mobileNumber}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {applicant.desiredCourse?.split(' - ')[0] || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          applicant.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          applicant.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {applicant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedApplicant(applicant);
                              setShowModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <select
                            value={applicant.status}
                            onChange={(e) => handleStatusUpdate(applicant.id, e.target.value)}
                            className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleDelete(applicant.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Applicant Details Modal */}
      {showModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Applicant Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Full Name</p>
                <p className="text-white">{selectedApplicant.fullName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-white">{selectedApplicant.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Phone Number</p>
                <p className="text-white">{selectedApplicant.mobileNumber}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Facebook Name</p>
                <p className="text-white">{selectedApplicant.facebookName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Present Work</p>
                <p className="text-white">{selectedApplicant.presentWork || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Present Address</p>
                <p className="text-white">{selectedApplicant.presentAddress || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Desired Course</p>
                <p className="text-white">{selectedApplicant.desiredCourse || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Training Format</p>
                <p className="text-white">{selectedApplicant.trainingFormat || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Payment Mode</p>
                <p className="text-white">{selectedApplicant.paymentMode || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedApplicant.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedApplicant.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {selectedApplicant.status}
                </span>
              </div>
              {selectedApplicant.additionalNotes && (
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-sm">Additional Notes</p>
                  <p className="text-white">{selectedApplicant.additionalNotes}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-gray-500 text-sm">Submitted At</p>
                <p className="text-white">{new Date(selectedApplicant.submittedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setSettingsMessage({ type: '', text: '' });
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {settingsMessage.text && (
              <div className={`mb-4 p-3 rounded-lg ${
                settingsMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {settingsMessage.text}
              </div>
            )}

            <form onSubmit={handleSettingsSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                    placeholder={adminUser?.email}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Phone</label>
                  <input
                    type="tel"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    placeholder={adminUser?.phone}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Username</label>
                  <input
                    type="text"
                    value={settingsForm.username}
                    onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                    placeholder={adminUser?.username}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Current Password</label>
                  <input
                    type="password"
                    value={settingsForm.currentPassword}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={settingsForm.newPassword}
                    onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={settingsForm.confirmPassword}
                    onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    setSettingsMessage({ type: '', text: '' });
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}