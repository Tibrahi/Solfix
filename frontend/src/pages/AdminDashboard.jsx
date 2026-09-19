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

  const fetchDashboardData = async () => {
    try {
      const [applicantsData, statsData] = await Promise.all([
        apiRequest(config.endpoints.applicants),
        apiRequest(config.endpoints.stats)
      ]);

      setApplicants(applicantsData.applicants || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      await apiRequest(config.endpoints.applicant(id), {
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
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-zinc-400 text-sm font-medium tracking-wide">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-white">Solfix Admin</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 pl-3 pr-4 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-full">
              <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold shadow-inner">
                {adminUser?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-medium text-zinc-300">{adminUser?.username}</span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/80 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Total Applicants</p>
                  <p className="text-2xl font-semibold text-white mt-1.5">{stats.totalApplicants}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/80 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-semibold text-amber-400 mt-1.5">{stats.pendingCount}</p>
                </div>
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/80 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Approved</p>
                  <p className="text-2xl font-semibold text-emerald-400 mt-1.5">{stats.approvedCount}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/80 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Rejected</p>
                  <p className="text-2xl font-semibold text-rose-400 mt-1.5">{stats.rejectedCount}</p>
                </div>
                <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, email, or phone..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-emerald-600/20"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => fetchDashboardData()}
                className="flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700/60"
              >
                <svg className="w-4 h-4 mr-2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm">
                {applicants.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-zinc-500 py-16">
                      No applicants found. Share the registration form to collect applications.
                    </td>
                  </tr>
                ) : (
                  applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white">{applicant.fullName}</td>
                      <td className="px-6 py-4 text-zinc-400">{applicant.email}</td>
                      <td className="px-6 py-4 text-zinc-400">{applicant.mobileNumber}</td>
                      <td className="px-6 py-4 text-zinc-300">
                        {applicant.desiredCourse?.split(' - ')[0] || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          applicant.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          applicant.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {applicant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedApplicant(applicant);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <select
                            value={applicant.status}
                            onChange={(e) => handleStatusUpdate(applicant.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => handleDelete(applicant.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-white">Applicant Information</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedApplicant.paymentProof && (
              <div className="my-6 p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Proof of Payment</p>
                <div className="flex justify-center">
                  <img
                    src={selectedApplicant.paymentProof}
                    alt="Payment proof"
                    className="max-h-60 max-w-full rounded-lg border border-zinc-800 object-contain shadow"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Full Name</p>
                <p className="text-zinc-200 font-medium">{selectedApplicant.fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Email Address</p>
                <p className="text-zinc-200">{selectedApplicant.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Phone Number</p>
                <p className="text-zinc-200">{selectedApplicant.mobileNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Facebook Name</p>
                <p className="text-zinc-200">{selectedApplicant.facebookName || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Present Work</p>
                <p className="text-zinc-200">{selectedApplicant.presentWork || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Present Address</p>
                <p className="text-zinc-200">{selectedApplicant.presentAddress || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Desired Course</p>
                <p className="text-zinc-200">{selectedApplicant.desiredCourse || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Training Format</p>
                <p className="text-zinc-200">{selectedApplicant.trainingFormat || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Payment Mode</p>
                <p className="text-zinc-200">{selectedApplicant.paymentMode || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 font-medium">Current Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${
                  selectedApplicant.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  selectedApplicant.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {selectedApplicant.status}
                </span>
              </div>
              {selectedApplicant.additionalNotes && (
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-xs text-zinc-500 font-medium">Additional Notes</p>
                  <p className="text-zinc-200 bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/80">{selectedApplicant.additionalNotes}</p>
                </div>
              )}
              <div className="sm:col-span-2 space-y-1 pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 font-medium">Submitted At</p>
                <p className="text-zinc-400 text-xs">{new Date(selectedApplicant.submittedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700/60"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4">
              <h2 className="text-lg font-semibold text-white">Admin Settings</h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setSettingsMessage({ type: '', text: '' });
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {settingsMessage.text && (
              <div className={`mb-4 p-3 rounded-lg text-sm border ${
                settingsMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {settingsMessage.text}
              </div>
            )}

            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-zinc-400 text-xs font-medium">Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  placeholder={adminUser?.email}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-zinc-400 text-xs font-medium">Phone</label>
                <input
                  type="tel"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  placeholder={adminUser?.phone}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-zinc-400 text-xs font-medium">Username</label>
                <input
                  type="text"
                  value={settingsForm.username}
                  onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                  placeholder={adminUser?.username}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-zinc-400 text-xs font-medium">Current Password</label>
                <input
                  type="password"
                  value={settingsForm.currentPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-zinc-400 text-xs font-medium">New Password <span className="text-zinc-600 font-normal">(optional)</span></label>
                <input
                  type="password"
                  value={settingsForm.newPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-zinc-400 text-xs font-medium">Confirm New Password</label>
                <input
                  type="password"
                  value={settingsForm.confirmPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettings(false);
                    setSettingsMessage({ type: '', text: '' });
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-600/20"
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
