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
  ArrowLeftRight,
  RefreshCw,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  AlertTriangle,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';

// Clean date formatting helper: converts "2026-11-07T18:30:00.000Z" -> "07 Nov 2026"
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

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ISSUED, OVERDUE, RETURNED
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Data for issuing
  const [availableBooks, setAvailableBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [issueFormData, setIssueFormData] = useState({
    book_id: '',
    member_id: '',
    due_date: getDefaultDueDate()
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data.data || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch transactions from server'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [booksRes, membersRes] = await Promise.all([
        api.get('/books'),
        api.get('/members')
      ]);

      const inStockBooks = (booksRes.data.data || []).filter(
        (b) => b.available_copies > 0
      );
      setAvailableBooks(inStockBooks);
      setMembers(membersRes.data.data || []);
    } catch (err) {
      console.error('Failed to load books or members for issuing', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenIssueModal = () => {
    fetchOptions();
    setIssueFormData({
      book_id: '',
      member_id: '',
      due_date: getDefaultDueDate()
    });
    setIsIssueModalOpen(true);
  };

  const handleOpenReturnModal = (tx) => {
    setSelectedTx(tx);
    setIsReturnModalOpen(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.post('/transactions/issue', {
        book_id: parseInt(issueFormData.book_id, 10),
        member_id: parseInt(issueFormData.member_id, 10),
        due_date: issueFormData.due_date
      });

      setFeedback({
        type: 'success',
        message: 'Book issued successfully! Inventory decremented.'
      });
      setIsIssueModalOpen(false);
      fetchTransactions();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to issue book.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!selectedTx) return;
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.put(`/transactions/return/${selectedTx.transaction_id}`);

      setFeedback({
        type: 'success',
        message: `Book "${selectedTx.book_title}" returned successfully! Stock restored.`
      });
      setIsReturnModalOpen(false);
      setSelectedTx(null);
      fetchTransactions();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to record return.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const isOverdue = (tx) => {
    if (tx.status !== 'Issued') return false;
    const cleanDue = String(tx.due_date || '').split('T')[0];
    return cleanDue < todayStr;
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.book_title?.toLowerCase().includes(search.toLowerCase()) ||
      tx.member_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.book_isbn?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ISSUED') return tx.status === 'Issued';
    if (statusFilter === 'RETURNED') return tx.status === 'Returned';
    if (statusFilter === 'OVERDUE') return isOverdue(tx);

    return true;
  });

  const activeIssuesCount = transactions.filter((t) => t.status === 'Issued').length;
  const overdueCount = transactions.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h4" component="h1" className="font-serif font-bold text-[#1C1917] tracking-tight">
            Book Circulation & Issues
          </Typography>
          <Typography variant="body2" className="text-[#4D473E] mt-1">
            Real-time book checkout records in <code>library_db.transactions</code>.
          </Typography>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchTransactions}
            disabled={loading}
            variant="outlined"
            aria-label="Refresh transactions list from database"
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            className="!rounded-xl !border-[#E8DFC8] !text-[#1C1917] hover:!border-[#8C5914] hover:!bg-white"
          >
            Refresh
          </Button>
          <Button
            onClick={handleOpenIssueModal}
            variant="contained"
            aria-label="Issue a book to a member"
            startIcon={<PlusCircle className="w-4 h-4" />}
            className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
          >
            Issue Book
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
            aria-label="Dismiss notification message"
            className="text-[11px] font-bold uppercase tracking-wider underline ml-4 hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Filter Tabs and Search Bar */}
      <Card className="!bg-white !border-[#E8DFC8] p-4 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#524C42] absolute left-3.5 top-3.5" />
            <input
              type="text"
              id="transactions-search-input"
              name="search"
              aria-label="Search transactions by book title or member name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search book title or member name..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#8C5914] focus:bg-white"
            />
          </div>

          {/* Status Tabs (Fully Responsive, wraps cleanly on mobile/tablet) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F6F3EE] rounded-xl border border-[#E8DFC8] text-xs w-full md:w-auto" role="tablist" aria-label="Transaction status filter">
            <button
              onClick={() => setStatusFilter('ALL')}
              aria-label="Filter all circulation transactions"
              aria-pressed={statusFilter === 'ALL'}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'ALL'
                  ? 'bg-[#1C1917] text-[#FAF6F0] font-semibold shadow-sm'
                  : 'text-[#4D473E] hover:text-[#1C1917]'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter('ISSUED')}
              aria-label="Filter currently issued books"
              aria-pressed={statusFilter === 'ISSUED'}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'ISSUED'
                  ? 'bg-[#8C5914] text-white font-semibold shadow-sm'
                  : 'text-[#4D473E] hover:text-[#1C1917]'
              }`}
            >
              Currently Issued ({activeIssuesCount})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              aria-label="Filter overdue book records"
              aria-pressed={statusFilter === 'OVERDUE'}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'OVERDUE'
                  ? 'bg-[#B91C1C] text-white font-semibold shadow-sm'
                  : 'text-[#4D473E] hover:text-[#1C1917]'
              }`}
            >
              Overdue ({overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('RETURNED')}
              aria-label="Filter returned books"
              aria-pressed={statusFilter === 'RETURNED'}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                statusFilter === 'RETURNED'
                  ? 'bg-[#047857] text-white font-semibold shadow-sm'
                  : 'text-[#4D473E] hover:text-[#1C1917]'
              }`}
            >
              Returned ({transactions.length - activeIssuesCount})
            </button>
          </div>
        </div>
      </Card>

      {/* Main Circulation Card */}
      <Card className="!bg-white !border-[#E8DFC8] shadow-sm overflow-hidden rounded-2xl">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E8DFC8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-[#E8DFC8] flex items-center justify-center text-[#8C5914] shadow-xs">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="subtitle1" component="h2" className="!font-serif !font-bold !text-[#1C1917] !text-base !leading-tight">
                  Book Circulation & Issue Log
                </Typography>
                <span className="text-[11px] font-semibold text-[#524C42] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#E8DFC8]">
                  {filteredTransactions.length} records
                </span>
              </div>
              <p className="text-[11px] text-[#4D473E] mt-0.5">
                Real-time tracking of book checkouts, renewals, and returned inventory in <code>library_db.transactions</code>
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {loading ? (
          <div className="py-12 text-center text-[#4D473E] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8C5914] mb-2" />
            Loading circulation records from database...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 px-6 text-center text-[#4D473E]">
            <p className="font-serif font-bold text-[#1C1917] text-sm">No transactions found.</p>
            <p className="text-xs text-[#524C42] mt-1 mb-4">
              {transactions.length === 0
                ? 'Click "Issue Book" above to record your first book checkout.'
                : 'No records match the active filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP & TABLET VIEW: Sleek 100% Fluid Table (No sliding needed!) */}
            <div className="hidden sm:block">
              <TableContainer aria-label="Circulation transaction records">
                <Table className="w-full" aria-label="Circulation transactions table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#FAF8F5' }}>
                      <TableCell component="th" scope="col" sx={{ width: '60px', py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          <span className="sr-only">Transaction </span>#
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Book Details
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Borrower Member
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ width: '130px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Issued On
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ width: '130px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Due Date
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" align="center" sx={{ width: '95px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Status
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" align="right" sx={{ width: '110px', py: 1.5, px: 3, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Action
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTransactions.map((tx) => {
                      const overdue = isOverdue(tx);
                      return (
                        <TableRow
                          key={tx.transaction_id}
                          hover
                          sx={{
                            '&:hover': { backgroundColor: '#FAF7F0 !important' },
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          {/* Transaction ID */}
                          <TableCell component="th" scope="row" aria-label={`Transaction #${tx.transaction_id}`} sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                            <span className="font-mono text-xs font-semibold text-[#524C42] bg-[#F6F3EE] px-1.5 py-0.5 rounded border border-[#E8DFC8]">
                              #{tx.transaction_id}
                            </span>
                          </TableCell>

                          {/* Book Details */}
                          <TableCell sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                            <div>
                              <p className="font-serif font-bold text-[#1C1917] text-sm leading-snug">
                                {tx.book_title}
                              </p>
                              {tx.book_isbn && (
                                <span className="text-[10px] text-[#524C42] font-mono mt-0.5 inline-block">
                                  ISBN: {tx.book_isbn}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Borrower Member */}
                          <TableCell sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                            <div className="flex items-center gap-2">
                              <div aria-hidden="true" className="w-7 h-7 rounded-full bg-[#B87B28]/15 border border-[#B87B28]/30 flex items-center justify-center text-[#8C5914] text-xs font-serif font-bold flex-shrink-0">
                                {tx.member_name?.charAt(0) || 'M'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1C1917] leading-tight truncate">
                                  {tx.member_name}
                                </p>
                                <p className="text-[11px] text-[#4D473E] truncate mt-0.5">
                                  {tx.member_email}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Issue Date */}
                          <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                            <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
                              <Calendar aria-hidden="true" className="w-3.5 h-3.5 text-[#524C42] flex-shrink-0" />
                              <span className="font-mono">{formatDate(tx.issue_date)}</span>
                            </div>
                          </TableCell>

                          {/* Due Date */}
                          <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                            <div className="flex items-center gap-1.5 text-xs">
                              <Calendar aria-hidden="true" className={`w-3.5 h-3.5 flex-shrink-0 ${overdue ? 'text-[#B91C1C]' : 'text-[#524C42]'}`} />
                              <span
                                className={
                                  overdue
                                    ? 'font-mono text-[#B91C1C] font-bold bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]'
                                    : 'font-mono text-[#57534E]'
                                }
                              >
                                {formatDate(tx.due_date)}
                              </span>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell align="center" sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                            {tx.status === 'Returned' ? (
                              <Chip
                                label="Returned"
                                size="small"
                                className="!bg-[#ECFDF5] !text-[#047857] !border !border-[#A7F3D0] !text-[11px] !font-bold"
                              />
                            ) : overdue ? (
                              <Chip
                                label="Overdue"
                                size="small"
                                className="!bg-[#FEF2F2] !text-[#B91C1C] !border !border-[#FECACA] !text-[11px] !font-bold"
                              />
                            ) : (
                              <Chip
                                label="Issued"
                                size="small"
                                className="!bg-[#FFFBEB] !text-[#8C5914] !border !border-[#FDE68A] !text-[11px] !font-bold"
                              />
                            )}
                          </TableCell>

                          {/* Action (Always visible on-screen, no sliding needed!) */}
                          <TableCell align="right" sx={{ py: 2, px: 3, borderBottom: '1px solid #F0EAE1' }}>
                            {tx.status === 'Issued' ? (
                              <Button
                                onClick={() => handleOpenReturnModal(tx)}
                                size="small"
                                variant="contained"
                                aria-label={`Return copy of ${tx.book_title} issued to ${tx.member_name}`}
                                startIcon={<RotateCcw className="w-3.5 h-3.5" />}
                                className="!text-xs !font-semibold !rounded-lg !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0] !py-1 !px-2.5 !shadow-xs"
                              >
                                Return
                              </Button>
                            ) : (
                              <span className="text-xs text-[#524C42] italic font-serif">
                                Completed
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* MOBILE VIEW (< sm): Clean, Touch-Optimized Cards (No horizontal sliding!) */}
            <div className="block sm:hidden divide-y divide-[#E8DFC8]">
              {filteredTransactions.map((tx) => {
                const overdue = isOverdue(tx);
                return (
                  <div key={tx.transaction_id} className="p-4 space-y-3 bg-white">
                    {/* Header Row: Title + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] font-mono text-[#524C42] font-semibold bg-[#F6F3EE] px-1.5 py-0.5 rounded border border-[#E8DFC8]">
                          #{tx.transaction_id}
                        </span>
                        <h3 className="font-serif font-bold text-[#1C1917] text-sm mt-1 leading-snug">
                          {tx.book_title}
                        </h3>
                        {tx.book_isbn && (
                          <span className="text-[10px] text-[#524C42] font-mono">
                            ISBN: {tx.book_isbn}
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {tx.status === 'Returned' ? (
                          <Chip
                            label="Returned"
                            size="small"
                            className="!bg-[#ECFDF5] !text-[#047857] !border !border-[#A7F3D0] !text-[10px] !font-bold"
                          />
                        ) : overdue ? (
                          <Chip
                            label="Overdue"
                            size="small"
                            className="!bg-[#FEF2F2] !text-[#B91C1C] !border !border-[#FECACA] !text-[10px] !font-bold"
                          />
                        ) : (
                          <Chip
                            label="Issued"
                            size="small"
                            className="!bg-[#FFFBEB] !text-[#8C5914] !border !border-[#FDE68A] !text-[10px] !font-bold"
                          />
                        )}
                      </div>
                    </div>

                    {/* Borrower Info */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#E8DFC8]/70">
                      <div className="w-6 h-6 rounded-full bg-[#B87B28]/15 border border-[#B87B28]/30 flex items-center justify-center text-[#8C5914] text-[10px] font-bold">
                        {tx.member_name?.charAt(0) || 'M'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1C1917] truncate leading-tight">
                          {tx.member_name}
                        </p>
                        <p className="text-[10px] text-[#4D473E] truncate">
                          {tx.member_email}
                        </p>
                      </div>
                    </div>

                    {/* Dates Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8]/60">
                        <span className="text-[10px] font-bold text-[#524C42] uppercase block">
                          Issued On
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 font-mono text-[#57534E]">
                          <Calendar className="w-3 h-3 text-[#524C42]" />
                          <span>{formatDate(tx.issue_date)}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8]/60">
                        <span className="text-[10px] font-bold text-[#524C42] uppercase block">
                          Due Date
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 font-mono">
                          <Calendar className={`w-3 h-3 ${overdue ? 'text-[#B91C1C]' : 'text-[#524C42]'}`} />
                          <span className={overdue ? 'text-[#B91C1C] font-bold' : 'text-[#57534E]'}>
                            {formatDate(tx.due_date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {tx.status === 'Issued' && (
                      <Button
                        onClick={() => handleOpenReturnModal(tx)}
                        fullWidth
                        variant="contained"
                        aria-label={`Return copy of ${tx.book_title} issued to ${tx.member_name}`}
                        startIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0] !py-2 !text-xs !shadow-sm"
                      >
                        Return This Book
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Modal: Issue Book */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        title="Issue Book to Member"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          {/* Select Book */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Select Book in Stock *
            </label>
            {loadingOptions ? (
              <p className="text-xs text-[#6A645A] py-2">Loading available books...</p>
            ) : availableBooks.length === 0 ? (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626]">
                No books currently have available copies in stock.
              </div>
            ) : (
              <select
                value={issueFormData.book_id}
                onChange={(e) =>
                  setIssueFormData({ ...issueFormData, book_id: e.target.value })
                }
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] focus:bg-white"
              >
                <option value="">-- Choose a Book --</option>
                {availableBooks.map((b) => (
                  <option key={b.book_id} value={b.book_id}>
                    "{b.title}" by {b.author} ({b.available_copies} available)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Select Member */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Select Borrower Member *
            </label>
            {loadingOptions ? (
              <p className="text-xs text-[#6A645A] py-2">Loading members...</p>
            ) : (
              <select
                value={issueFormData.member_id}
                onChange={(e) =>
                  setIssueFormData({ ...issueFormData, member_id: e.target.value })
                }
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] focus:bg-white"
              >
                <option value="">-- Choose a Member --</option>
                {members.map((m) => (
                  <option key={m.member_id} value={m.member_id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Due Date & Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6A645A] uppercase mb-1">
              Due Date *
            </label>
            <input
              type="date"
              min={todayStr}
              value={issueFormData.due_date}
              onChange={(e) =>
                setIssueFormData({ ...issueFormData, due_date: e.target.value })
              }
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] focus:bg-white font-mono"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[#6A645A]">Presets:</span>
              {[7, 14, 30].map((days) => {
                const presetDate = new Date();
                presetDate.setDate(presetDate.getDate() + days);
                const iso = presetDate.toISOString().split('T')[0];
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      setIssueFormData({ ...issueFormData, due_date: iso })
                    }
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                      issueFormData.due_date === iso
                        ? 'bg-[#B87B28]/15 border-[#B87B28] text-[#B87B28] font-bold'
                        : 'bg-[#FBF9F5] border-[#E8DFC8] text-[#6A645A] hover:text-[#1C1917]'
                    }`}
                  >
                    +{days} days
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl hover:!bg-[#F6F3EE]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || availableBooks.length === 0}
              variant="contained"
              className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
            >
              {submitting ? 'Issuing...' : 'Confirm Issue'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Process Return Confirmation */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Process Book Return"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#1C1917] leading-relaxed">
            Confirm check-in and inventory return for this volume:
          </p>

          <div className="p-4 bg-[#FBF9F5] rounded-xl border border-[#E8DFC8] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#6A645A]">Book Title:</span>
              <strong className="text-[#1C1917] text-right">{selectedTx?.book_title}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6A645A]">Borrower:</span>
              <strong className="text-[#1C1917]">{selectedTx?.member_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6A645A]">Issued On:</span>
              <span className="font-mono text-[#1C1917]">{formatDate(selectedTx?.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6A645A]">Due Date:</span>
              <span className="font-mono text-[#1C1917]">{formatDate(selectedTx?.due_date)}</span>
            </div>
          </div>

          {selectedTx && isOverdue(selectedTx) && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
              <span>
                <strong>Notice:</strong> This book was due on {formatDate(selectedTx.due_date)} and is being returned past the due date.
              </span>
            </div>
          )}

          <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs text-[#059669]">
            Processing return will increment <code>available_copies</code> by +1 in the books catalog.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsReturnModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl hover:!bg-[#F6F3EE]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReturnSubmit}
              disabled={submitting}
              variant="contained"
              className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
            >
              {submitting ? 'Processing...' : 'Mark as Returned'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Transactions;
