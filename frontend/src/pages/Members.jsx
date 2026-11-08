import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Users,
  Search,
  UserPlus,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';

// Clean date formatting helper
const formatDate = (rawDate) => {
  if (!rawDate) return '—';
  const clean = String(rawDate).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parseInt(parts[1], 10) - 1];
    if (month) return `${parts[2]} ${month} ${parts[0]}`;
  }
  return clean;
};

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();

      const response = await api.get('/members', { params });
      setMembers(response.data.data || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch members from database'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: ''
    });
    setSelectedMember(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.post('/members', formData);

      setFeedback({
        type: 'success',
        message: `Member "${response.data.data.name}" enrolled successfully!`
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to register member. Email must be unique.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.put(`/members/${selectedMember.member_id}`, formData);

      setFeedback({
        type: 'success',
        message: `Member profile for "${formData.name}" updated successfully!`
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update member profile.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.delete(`/members/${selectedMember.member_id}`);

      setFeedback({
        type: 'success',
        message: `Member "${selectedMember.name}" deleted successfully!`
      });
      setIsDeleteModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.message ||
          'Cannot delete member. Members with book borrowing history cannot be deleted.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h4" component="h1" className="font-serif font-bold text-[#1C1917] tracking-tight">
            Members Directory
          </Typography>
          <Typography variant="body2" className="text-[#4D473E] mt-1">
            Registered library patrons and faculty profiles in <code>library_db.members</code>.
          </Typography>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchMembers}
            disabled={loading}
            variant="outlined"
            aria-label="Refresh members directory"
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            className="!rounded-xl !border-[#E8DFC8] !text-[#1C1917] hover:!border-[#8C5914] hover:!bg-white"
          >
            Refresh
          </Button>
          <Button
            onClick={handleOpenAddModal}
            variant="contained"
            aria-label="Enroll a new member"
            startIcon={<UserPlus className="w-4 h-4" />}
            className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border bg-white ${
            feedback.type === 'success'
              ? 'border-[#047857]/30 text-[#047857]'
              : 'border-[#B91C1C]/30 text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2.5 font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            aria-label="Dismiss feedback notification"
            className="text-[11px] font-bold uppercase tracking-wider underline ml-4 hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Search Bar */}
      <Card className="!bg-white !border-[#E8DFC8] p-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#524C42] absolute left-3.5 top-3.5" />
            <input
              type="text"
              id="members-search-input"
              name="search"
              aria-label="Search members directory by name, email, or phone number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone number..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#8C5914] focus:bg-white"
            />
          </div>
          <span className="hidden sm:inline-block text-xs text-[#4D473E]">
            Total patrons: <strong className="text-[#8C5914]">{members.length}</strong>
          </span>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="!bg-white !border-[#E8DFC8] shadow-sm overflow-hidden rounded-2xl">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E8DFC8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-[#E8DFC8] flex items-center justify-center text-[#8C5914] shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="subtitle1" component="h2" className="!font-serif !font-bold !text-[#1C1917] !text-base !leading-tight">
                  Registered Members Directory
                </Typography>
                <span className="text-[11px] font-semibold text-[#524C42] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#E8DFC8]">
                  {members.length} patrons
                </span>
              </div>
              <p className="text-[11px] text-[#4D473E] mt-0.5">
                Patron records, contact details, and enrolled membership profiles in <code>library_db.members</code>
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {loading ? (
          <div className="py-12 text-center text-[#4D473E] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8C5914] mb-2" />
            Loading member directory from database...
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 px-6 text-center text-[#4D473E]">
            <p className="font-serif font-bold text-[#1C1917] text-sm">No members registered.</p>
            <p className="text-xs text-[#524C42] mt-1 mb-4">Click "Add Member" above to enroll a new patron.</p>
          </div>
        ) : (
          <>
            {/* Tablet & Desktop View */}
            <div className="hidden sm:block">
              <TableContainer aria-label="Members directory table">
                <Table className="w-full" aria-label="Registered members table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#FAF8F5' }}>
                      <TableCell component="th" scope="col" sx={{ width: '60px', py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          <span className="sr-only">Member </span>#
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Full Name
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Email Address
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ width: '130px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Phone
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ width: '130px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Enrolled
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" align="right" sx={{ width: '90px', py: 1.5, px: 3, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Actions
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow
                        key={member.member_id}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: '#FAF7F0 !important' },
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <TableCell component="th" scope="row" aria-label={`Member #${member.member_id}`} sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                          <span className="font-mono text-xs font-semibold text-[#524C42] bg-[#F6F3EE] px-1.5 py-0.5 rounded border border-[#E8DFC8]">
                            #{member.member_id}
                          </span>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                          <div className="flex items-center gap-2.5">
                            <div aria-hidden="true" className="w-7 h-7 rounded-full bg-[#B87B28]/15 border border-[#B87B28]/30 flex items-center justify-center text-[#8C5914] text-xs font-serif font-bold flex-shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-xs text-[#1C1917]">{member.name}</span>
                          </div>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                          <div className="flex items-center gap-1.5 text-xs text-[#4D473E]">
                            <Mail className="w-3.5 h-3.5 text-[#524C42] flex-shrink-0" />
                            <span>{member.email}</span>
                          </div>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                          <div className="flex items-center gap-1.5 font-mono text-xs text-[#4D473E]">
                            <Phone className="w-3.5 h-3.5 text-[#524C42] flex-shrink-0" />
                            <span>{member.phone || '—'}</span>
                          </div>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                          <div className="flex items-center gap-1.5 text-xs text-[#4D473E]">
                            <Calendar className="w-3.5 h-3.5 text-[#524C42] flex-shrink-0" />
                            <span>{formatDate(member.created_at)}</span>
                          </div>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 2, px: 3, borderBottom: '1px solid #F0EAE1' }}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              aria-label={`Edit profile of ${member.name}`}
                              className="p-1.5 rounded-lg text-[#4D473E] hover:text-[#8C5914] hover:bg-[#F6F3EE] transition-colors cursor-pointer"
                              title="Edit Profile"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(member)}
                              aria-label={`Delete member ${member.name}`}
                              className="p-1.5 rounded-lg text-[#4D473E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Delete Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* Mobile View (< sm) */}
            <div className="block sm:hidden divide-y divide-[#E8DFC8]">
              {members.map((member) => (
                <div key={member.member_id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#B87B28]/15 border border-[#B87B28]/30 flex items-center justify-center text-[#8C5914] text-xs font-bold font-serif">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-xs text-[#1C1917] leading-tight">
                          {member.name}
                        </h3>
                        <span className="text-[10px] font-mono text-[#524C42]">
                          Member #{member.member_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E8DFC8]/70 space-y-1.5 text-xs text-[#4D473E]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#524C42]" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 font-mono">
                        <Phone className="w-3.5 h-3.5 text-[#524C42]" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-[#524C42]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Enrolled on {formatDate(member.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      onClick={() => handleOpenEditModal(member)}
                      size="small"
                      variant="outlined"
                      aria-label={`Edit profile of ${member.name}`}
                      startIcon={<Edit className="w-3.5 h-3.5" />}
                      className="!text-xs !rounded-lg !border-[#E8DFC8] !text-[#1C1917] !py-1 !px-3"
                    >
                      Edit Profile
                    </Button>
                    <Button
                      onClick={() => handleOpenDeleteModal(member)}
                      size="small"
                      variant="outlined"
                      color="error"
                      aria-label={`Delete member ${member.name}`}
                      startIcon={<Trash2 className="w-3.5 h-3.5" />}
                      className="!text-xs !rounded-lg !py-1 !px-3"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal: Add Member */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Patron Profile"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. Sayan Mukherjee"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm placeholder-[#A8A29E] focus:outline-none focus:border-[#B87B28] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="e.g. sayan@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm placeholder-[#A8A29E] focus:outline-none focus:border-[#B87B28] focus:bg-white"
            />
            <p className="text-[11px] text-[#A8A29E] mt-1">
              Must be unique across all patrons in database.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm placeholder-[#A8A29E] focus:outline-none focus:border-[#B87B28] focus:bg-white font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl hover:!bg-[#F6F3EE]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="contained"
              className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
            >
              {submitting ? 'Enrolling...' : 'Enroll Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Member */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Profile: ${selectedMember?.name || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] focus:bg-white font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl hover:!bg-[#F6F3EE]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="contained"
              className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Member */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Member Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#1C1917] leading-relaxed">
            Are you sure you want to permanently remove patron{' '}
            <strong className="text-[#1C1917]">"{selectedMember?.name}"</strong> from{' '}
            <code>library_db.members</code>?
          </p>

          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              If this member has existing borrowing records in <code>transactions</code>, MySQL foreign key constraints will prevent deletion.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl hover:!bg-[#F6F3EE]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteSubmit}
              disabled={submitting}
              variant="contained"
              color="error"
              className="!font-semibold !rounded-xl"
            >
              {submitting ? 'Deleting...' : 'Delete Member'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Members;
