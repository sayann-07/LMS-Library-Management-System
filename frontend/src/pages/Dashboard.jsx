import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  LinearProgress
} from '@mui/material';
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  Database,
  PlusCircle,
  Plus,
  UserPlus,
  ArrowUpRight,
  Clock,
  ArrowRight,
  Calendar
} from 'lucide-react';
import api from '../services/api';

// Date formatting helper: "2026-11-07T18:30:00.000Z" -> "07 Nov 2026"
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

const Dashboard = () => {
  const [stats, setStats] = useState({
    booksCount: 0,
    totalCopies: 0,
    availableCopies: 0,
    membersCount: 0,
    activeIssuesCount: 0,
    totalTransactions: 0,
    overdueCount: 0,
    backendOnline: false,
    loading: true
  });

  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [healthRes, booksRes, membersRes, txRes] =
          await Promise.allSettled([
            api.get('/health'),
            api.get('/books'),
            api.get('/members'),
            api.get('/transactions')
          ]);

        const books =
          booksRes.status === 'fulfilled' ? booksRes.value.data.data || [] : [];
        const members =
          membersRes.status === 'fulfilled'
            ? membersRes.value.data.data || []
            : [];
        const transactions =
          txRes.status === 'fulfilled' ? txRes.value.data.data || [] : [];

        const todayStr = new Date().toISOString().split('T')[0];
        const activeIssues = transactions.filter((t) => t.status === 'Issued');
        const overdue = activeIssues.filter((t) => t.due_date < todayStr);

        const totalCopiesSum = books.reduce((sum, b) => sum + (b.total_copies || 0), 0);
        const availCopiesSum = books.reduce((sum, b) => sum + (b.available_copies || 0), 0);

        setStats({
          backendOnline: healthRes.status === 'fulfilled',
          booksCount: books.length,
          totalCopies: totalCopiesSum,
          availableCopies: availCopiesSum,
          membersCount: members.length,
          activeIssuesCount: activeIssues.length,
          totalTransactions: transactions.length,
          overdueCount: overdue.length,
          loading: false
        });

        setRecentTransactions(transactions.slice(0, 6));
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  const stockPercentage =
    stats.totalCopies > 0
      ? Math.round((stats.availableCopies / stats.totalCopies) * 100)
      : 0;

  const metricCards = [
    {
      title: 'Catalog Titles',
      value: stats.booksCount,
      subtext: `${stats.availableCopies} of ${stats.totalCopies} copies in stock (${stockPercentage}%)`,
      link: '/books',
      icon: BookOpen,
      iconColor: '#B87B28',
      progress: stockPercentage
    },
    {
      title: 'Registered Members',
      value: stats.membersCount,
      subtext: 'Patrons active in library_db',
      link: '/members',
      icon: Users,
      iconColor: '#059669',
    },
    {
      title: 'Issued Books',
      value: stats.activeIssuesCount,
      subtext: stats.overdueCount > 0 ? `${stats.overdueCount} book(s) currently overdue` : 'All issued books within due date',
      link: '/transactions',
      icon: ArrowLeftRight,
      iconColor: stats.overdueCount > 0 ? '#DC2626' : '#2563EB',
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h4" component="h1" className="font-serif font-bold text-[#1C1917] tracking-tight">
            System Overview
          </Typography>
          <Typography variant="body2" className="text-[#4D473E] mt-1">
            Real-time catalog metrics and circulation transactions from <code>library_db</code>.
          </Typography>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            component={Link}
            to="/transactions"
            variant="contained"
            aria-label="Issue a book to a member"
            startIcon={<PlusCircle className="w-4 h-4" />}
            className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
          >
            Issue Book
          </Button>
          <Button
            component={Link}
            to="/books"
            variant="outlined"
            aria-label="Add a new catalog book"
            startIcon={<Plus className="w-4 h-4" />}
            className="!rounded-xl !border-[#E8DFC8] !text-[#1C1917] hover:!border-[#8C5914] hover:!bg-white"
          >
            Add Book
          </Button>
          <Button
            component={Link}
            to="/members"
            variant="outlined"
            aria-label="Add a new library member"
            startIcon={<UserPlus className="w-4 h-4" />}
            className="!rounded-xl !border-[#E8DFC8] !text-[#1C1917] hover:!border-[#8C5914] hover:!bg-white"
          >
            Add Member
          </Button>
        </div>
      </div>

      {/* Backend Status Notification Card */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between transition-all bg-white shadow-sm ${
          stats.backendOnline ? 'border-[#047857]/30' : 'border-[#B45309]/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              stats.backendOnline ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#FFFBEB] text-[#B45309]'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <Typography variant="subtitle2" className="font-bold text-[#1C1917]">
              {stats.backendOnline
                ? 'Relational Database Connected & Online'
                : 'Backend Server Connection Pending'}
            </Typography>
            <Typography variant="caption" className="text-[#4D473E]">
              {stats.backendOnline
                ? 'Target: MySQL 8.0 on localhost:3306 (database: library_db)'
                : 'Ensure backend server is running on port 5000'}
            </Typography>
          </div>
        </div>
        <Chip
          label={stats.backendOnline ? 'MySQL 8.0 • Connected' : 'Disconnected'}
          size="small"
          className={`!font-bold !text-[11px] !tracking-wider ${
            stats.backendOnline
              ? '!bg-[#ECFDF5] !text-[#047857] !border !border-[#A7F3D0]'
              : '!bg-[#FEF2F2] !text-[#B91C1C] !border !border-[#FECACA]'
          }`}
        />
      </div>

      {/* 3 Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
            >
              <Card
                component={Link}
                to={card.link}
                aria-label={`View ${card.title} records and details`}
                className="h-full block no-underline !bg-white !border-[#E8DFC8] hover:!border-[#8C5914] hover:!shadow-md relative overflow-hidden group cursor-pointer transition-all"
              >
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Typography
                        variant="caption"
                        className="!font-bold !uppercase !tracking-widest !text-[#524C42]"
                      >
                        {card.title}
                      </Typography>
                      <div
                        className="p-2.5 rounded-xl border border-[#E8DFC8] bg-[#FAF8F5] group-hover:scale-105 transition-transform"
                        style={{ color: card.iconColor }}
                        aria-hidden="true"
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>

                    <Typography
                      variant="h3"
                      component="p"
                      className="!font-serif !font-bold !text-[#1C1917] !mb-1"
                    >
                      {stats.loading ? '...' : card.value}
                    </Typography>

                    <Typography variant="body2" className="text-[#4D473E] text-xs">
                      {card.subtext}
                    </Typography>

                    {card.progress !== undefined && (
                      <Box className="mt-4" aria-hidden="true">
                        <LinearProgress
                          variant="determinate"
                          value={card.progress}
                          aria-hidden="true"
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#F6F3EE',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#8C5914',
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#E8DFC8] flex items-center justify-between text-xs font-semibold text-[#8C5914] group-hover:text-[#653E0B]">
                    <span>View Records</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* TRANSACTION HISTORY SECTION (Crisp, Perfectly Formatted) */}
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
                  Transaction History
                </Typography>
                <span className="text-[11px] font-semibold text-[#524C42] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#E8DFC8]">
                  {recentTransactions.length} recent
                </span>
              </div>
              <p className="text-[11px] text-[#4D473E] mt-0.5">
                Real-time circulation and borrowing records from <code>library_db.transactions</code>
              </p>
            </div>
          </div>

          <Button
            component={Link}
            to="/transactions"
            size="small"
            aria-label="View complete transaction circulation history"
            endIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="!text-xs !font-bold !text-[#8C5914] hover:!text-[#653E0B] !capitalize !px-3 !py-1.5 !rounded-lg hover:!bg-[#F3ECE0]/50"
          >
            View Full History
          </Button>
        </div>

        {/* Content Body */}
        {recentTransactions.length === 0 ? (
          <div className="py-12 px-6 text-center text-[#4D473E]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F5] border border-[#E8DFC8] flex items-center justify-center text-[#524C42] mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="font-serif font-bold text-[#1C1917] text-sm">No transactions recorded yet</p>
            <p className="text-xs text-[#524C42] mt-1 mb-4">Issue a book from the catalog to start recording circulation.</p>
            <Button
              component={Link}
              to="/transactions"
              variant="contained"
              size="small"
              aria-label="Issue first book to initiate circulation records"
              startIcon={<PlusCircle className="w-4 h-4" />}
              className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0] !text-xs !px-4 !py-2"
            >
              Issue First Book
            </Button>
          </div>
        ) : (
          <>
            {/* Tablet & Desktop View */}
            <div className="hidden sm:block">
              <TableContainer aria-label="Recent circulation records">
                <Table className="w-full" aria-label="Recent library transactions table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#FAF8F5' }}>
                      <TableCell component="th" scope="col" sx={{ width: '60px', py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          <span className="sr-only">Transaction </span>#
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Book Title
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
                      <TableCell component="th" scope="col" align="center" sx={{ width: '100px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Status
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions.map((tx) => {
                      const today = new Date().toISOString().split('T')[0];
                      const cleanDue = String(tx.due_date || '').split('T')[0];
                      const isOverdue = tx.status === 'Issued' && cleanDue < today;

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

                          {/* Book Title */}
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
                              <div aria-hidden="true" className="w-7 h-7 rounded-full bg-[#B87B28]/15 border border-[#B87B28]/30 text-[#8C5914] text-xs font-bold flex items-center justify-center font-serif flex-shrink-0">
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
                              <Calendar aria-hidden="true" className={`w-3.5 h-3.5 flex-shrink-0 ${isOverdue ? 'text-[#B91C1C]' : 'text-[#524C42]'}`} />
                              <span
                                className={
                                  isOverdue
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
                            ) : isOverdue ? (
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* Mobile View (< sm) */}
            <div className="block sm:hidden divide-y divide-[#E8DFC8]">
              {recentTransactions.map((tx) => {
                const today = new Date().toISOString().split('T')[0];
                const cleanDue = String(tx.due_date || '').split('T')[0];
                const isOverdue = tx.status === 'Issued' && cleanDue < today;

                return (
                  <div key={tx.transaction_id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#524C42] bg-[#F6F3EE] px-1.5 py-0.5 rounded border border-[#E8DFC8]">
                          #{tx.transaction_id}
                        </span>
                        <h3 className="font-serif font-bold text-[#1C1917] text-sm mt-1 leading-snug">
                          {tx.book_title}
                        </h3>
                      </div>
                      <Chip
                        label={tx.status === 'Returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}
                        size="small"
                        className={
                          tx.status === 'Returned'
                            ? '!bg-[#ECFDF5] !text-[#047857] !border !border-[#A7F3D0] !text-[10px] !font-bold'
                            : isOverdue
                            ? '!bg-[#FEF2F2] !text-[#B91C1C] !border !border-[#FECACA] !text-[10px] !font-bold'
                            : '!bg-[#FFFBEB] !text-[#8C5914] !border !border-[#FDE68A] !text-[10px] !font-bold'
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#E8DFC8]/70 text-xs">
                      <div className="w-6 h-6 rounded-full bg-[#B87B28]/15 text-[#8C5914] text-[10px] font-bold flex items-center justify-center">
                        {tx.member_name?.charAt(0) || 'M'}
                      </div>
                      <span className="font-semibold text-[#1C1917] truncate">{tx.member_name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8]/60">
                        <span className="text-[10px] font-bold text-[#524C42] uppercase block">Issued</span>
                        <span className="font-mono text-[#57534E] text-[11px]">{formatDate(tx.issue_date)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E8DFC8]/60">
                        <span className="text-[10px] font-bold text-[#524C42] uppercase block">Due</span>
                        <span className={`font-mono text-[11px] ${isOverdue ? 'text-[#B91C1C] font-bold' : 'text-[#57534E]'}`}>
                          {formatDate(tx.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
