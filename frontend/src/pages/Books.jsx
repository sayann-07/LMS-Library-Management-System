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
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/common/Modal';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    total_copies: 1,
    available_copies: 1
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.get('/books', { params });
      setBooks(response.data.data || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to fetch books from database'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const categories = Array.from(
    new Set(books.map((b) => b.category).filter(Boolean))
  );

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: '',
      total_copies: 1,
      available_copies: 1
    });
    setSelectedBook(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || '',
      total_copies: book.total_copies,
      available_copies: book.available_copies
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (book) => {
    setSelectedBook(book);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'total_copies' || name === 'available_copies'
          ? Math.max(0, parseInt(value, 10) || 0)
          : value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const response = await api.post('/books', {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || null,
        category: formData.category || null,
        total_copies: formData.total_copies
      });

      setFeedback({
        type: 'success',
        message: `Book "${response.data.data.title}" cataloged successfully!`
      });
      setIsAddModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to add book. Check ISBN uniqueness.'
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
      await api.put(`/books/${selectedBook.book_id}`, formData);

      setFeedback({
        type: 'success',
        message: `Book "${formData.title}" updated successfully!`
      });
      setIsEditModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update book.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.delete(`/books/${selectedBook.book_id}`);

      setFeedback({
        type: 'success',
        message: `Book "${selectedBook.title}" deleted successfully!`
      });
      setIsDeleteModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.message ||
          'Cannot delete book. MySQL foreign keys restrict deleting books with loan history.'
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
            Books Catalog
          </Typography>
          <Typography variant="body2" className="text-[#4D473E] mt-1">
            Archival repository records in <code>library_db.books</code>.
          </Typography>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchBooks}
            disabled={loading}
            variant="outlined"
            aria-label="Refresh books list from database"
            startIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            className="!rounded-xl !border-[#E8DFC8] !text-[#1C1917] hover:!border-[#8C5914] hover:!bg-white"
          >
            Refresh
          </Button>
          <Button
            onClick={handleOpenAddModal}
            variant="contained"
            color="primary"
            aria-label="Add a new catalog book"
            startIcon={<Plus className="w-4 h-4" />}
            className="!font-semibold !rounded-xl !bg-[#1C1917] hover:!bg-[#292524] !text-[#FAF6F0]"
          >
            Add Book
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
            aria-label="Dismiss message banner"
            className="text-[11px] font-bold uppercase tracking-wider underline ml-4 hover:opacity-80 cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <Card className="!bg-white !border-[#E8DFC8] p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#524C42] absolute left-3.5 top-3.5" />
            <input
              type="text"
              id="books-search-input"
              name="search"
              aria-label="Search catalog books by title, author, or ISBN"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#8C5914] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="books-category-select" className="flex items-center gap-2 text-xs font-semibold text-[#4D473E] cursor-pointer">
              <Filter className="w-3.5 h-3.5 text-[#8C5914]" />
              <span>Category:</span>
            </label>
            <select
              id="books-category-select"
              name="category"
              aria-label="Filter catalog books by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 text-xs border border-[#E8DFC8] rounded-xl bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:border-[#8C5914]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Books Table */}
      <Card className="!bg-white !border-[#E8DFC8] shadow-sm overflow-hidden rounded-2xl">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E8DFC8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FDFBF7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] border border-[#E8DFC8] flex items-center justify-center text-[#8C5914] shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Typography variant="subtitle1" component="h2" className="!font-serif !font-bold !text-[#1C1917] !text-base !leading-tight">
                  Book Catalog & Inventory
                </Typography>
                <span className="text-[11px] font-semibold text-[#524C42] bg-[#F3ECE0] px-2 py-0.5 rounded-full border border-[#E8DFC8]">
                  {books.length} titles
                </span>
              </div>
              <p className="text-[11px] text-[#4D473E] mt-0.5">
                Archival repository records and live stock availability in <code>library_db.books</code>
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {loading ? (
          <div className="py-12 text-center text-[#4D473E] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8C5914] mb-2" />
            Loading catalog records from database...
          </div>
        ) : books.length === 0 ? (
          <div className="py-12 px-6 text-center text-[#4D473E]">
            <p className="font-serif font-bold text-[#1C1917] text-sm">No books found in catalog.</p>
            <p className="text-xs text-[#524C42] mt-1 mb-4">Click "Add Book" above to catalog a new volume.</p>
          </div>
        ) : (
          <>
            {/* Tablet & Desktop View */}
            <div className="hidden sm:block">
              <TableContainer aria-label="Books catalog inventory records">
                <Table className="w-full" aria-label="Books table">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#FAF8F5' }}>
                      <TableCell component="th" scope="col" sx={{ width: '60px', py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          <span className="sr-only">Book </span>#
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Title & ISBN
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ py: 1.5, px: 2.5, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Author
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" sx={{ width: '120px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Category
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" align="center" sx={{ width: '90px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          Copies
                        </span>
                      </TableCell>
                      <TableCell component="th" scope="col" align="center" sx={{ width: '120px', py: 1.5, px: 2, borderBottom: '1px solid #E8DFC8' }}>
                        <span className="text-[11px] font-bold text-[#4D473E] uppercase tracking-wider">
                          In Stock
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
                    {books.map((book) => (
                      <TableRow
                        key={book.book_id}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: '#FAF7F0 !important' },
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <TableCell component="th" scope="row" aria-label={`Book #${book.book_id}`} sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                          <span className="font-mono text-xs font-semibold text-[#524C42] bg-[#F6F3EE] px-1.5 py-0.5 rounded border border-[#E8DFC8]">
                            #{book.book_id}
                          </span>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                          <div>
                            <p className="font-serif font-bold text-[#1C1917] text-sm leading-snug">
                              {book.title}
                            </p>
                            {book.isbn && (
                              <span className="text-[10px] text-[#524C42] font-mono mt-0.5 inline-block">
                                ISBN: {book.isbn}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2.5, borderBottom: '1px solid #F0EAE1' }}>
                          <span className="text-xs font-medium text-[#4D473E]">
                            {book.author}
                          </span>
                        </TableCell>

                        <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                          <Chip
                            label={book.category || 'General'}
                            size="small"
                            className="!bg-[#F6F3EE] !border !border-[#E8DFC8] !text-[#1C1917] !text-[11px] !font-medium"
                          />
                        </TableCell>

                        <TableCell align="center" sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                          <span className="font-semibold text-xs text-[#1C1917]">
                            {book.total_copies}
                          </span>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 2, px: 2, borderBottom: '1px solid #F0EAE1' }}>
                          <Chip
                            label={`${book.available_copies} available`}
                            size="small"
                            className={
                              book.available_copies > 0
                                ? '!bg-[#ECFDF5] !text-[#047857] !font-bold !text-[11px] !border !border-[#A7F3D0]'
                                : '!bg-[#FEF2F2] !text-[#B91C1C] !font-bold !text-[11px] !border !border-[#FECACA]'
                            }
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ py: 2, px: 3, borderBottom: '1px solid #F0EAE1' }}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(book)}
                              aria-label={`Edit book ${book.title}`}
                              className="p-1.5 rounded-lg text-[#4D473E] hover:text-[#8C5914] hover:bg-[#F6F3EE] transition-colors cursor-pointer"
                              title="Edit Book"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(book)}
                              aria-label={`Delete book ${book.title}`}
                              className="p-1.5 rounded-lg text-[#4D473E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Delete Book"
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

            {/* Mobile View (< sm): Clean, Touch-Optimized Cards */}
            <div className="block sm:hidden divide-y divide-[#E8DFC8]">
              {books.map((book) => (
                <div key={book.book_id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#524C42] bg-[#F6F3EE] px-1.5 py-0.5 rounded border border-[#E8DFC8]">
                        #{book.book_id}
                      </span>
                      <h3 className="font-serif font-bold text-[#1C1917] text-sm mt-1 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#4D473E] mt-0.5">by {book.author}</p>
                      {book.isbn && (
                        <span className="text-[10px] text-[#524C42] font-mono block mt-0.5">
                          ISBN: {book.isbn}
                        </span>
                      )}
                    </div>
                    <Chip
                      label={book.category || 'General'}
                      size="small"
                      className="!bg-[#F6F3EE] !border !border-[#E8DFC8] !text-[#1C1917] !text-[10px]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E8DFC8]/70 text-xs">
                    <span className="text-[#4D473E]">Total: <strong className="text-[#1C1917]">{book.total_copies}</strong></span>
                    <Chip
                      label={`${book.available_copies} available`}
                      size="small"
                      className={
                        book.available_copies > 0
                          ? '!bg-[#ECFDF5] !text-[#047857] !font-bold !text-[10px] !border !border-[#A7F3D0]'
                          : '!bg-[#FEF2F2] !text-[#B91C1C] !font-bold !text-[10px] !border !border-[#FECACA]'
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      onClick={() => handleOpenEditModal(book)}
                      size="small"
                      variant="outlined"
                      aria-label={`Edit book ${book.title}`}
                      startIcon={<Edit className="w-3.5 h-3.5" />}
                      className="!text-xs !rounded-lg !border-[#E8DFC8] !text-[#1C1917] !py-1 !px-3"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleOpenDeleteModal(book)}
                      size="small"
                      variant="outlined"
                      color="error"
                      aria-label={`Delete book ${book.title}`}
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

      {/* Modal: Add Book */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catalog New Volume"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label htmlFor="add-book-title" className="block text-[11px] font-bold text-[#4D473E] uppercase mb-1">
              Title *
            </label>
            <input
              type="text"
              id="add-book-title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g. Introduction to Algorithms"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#8C5914]"
            />
          </div>

          <div>
            <label htmlFor="add-book-author" className="block text-[11px] font-bold text-[#4D473E] uppercase mb-1">
              Author *
            </label>
            <input
              type="text"
              id="add-book-author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
              placeholder="e.g. Thomas H. Cormen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#8C5914]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-book-isbn" className="block text-[11px] font-bold text-[#4D473E] uppercase mb-1">
                ISBN
              </label>
              <input
                type="text"
                id="add-book-isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder="e.g. ISBN007"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g. Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
              Total Copies
            </label>
            <input
              type="number"
              name="total_copies"
              min="1"
              value={formData.total_copies}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
            />
            <p className="text-[11px] text-[#6A645A] mt-1">
              Available copies will be initialized to match this count.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="contained"
              className="!font-semibold !rounded-xl !bg-[#1C1917] !text-[#FAF6F0]"
            >
              {submitting ? 'Saving...' : 'Catalog Book'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Book */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Book (ID: #${selectedBook?.book_id})`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
              Author *
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
                ISBN
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
                Total Copies
              </label>
              <input
                type="number"
                name="total_copies"
                min="0"
                value={formData.total_copies}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6A645A] uppercase mb-1">
                Available Copies
              </label>
              <input
                type="number"
                name="available_copies"
                min="0"
                value={formData.available_copies}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F5] border border-[#E8DFC8] text-[#1C1917] text-sm focus:outline-none focus:border-[#B87B28]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              variant="contained"
              className="!font-semibold !rounded-xl !bg-[#1C1917] !text-[#FAF6F0]"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Book Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Book Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#1C1917] leading-relaxed">
            Are you sure you want to permanently remove{' '}
            <strong className="text-[#B87B28]">"{selectedBook?.title}"</strong>{' '}
            by {selectedBook?.author}?
          </p>
          <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
            <strong>Referential Integrity Rule:</strong> If this book has borrowing records in <code>transactions</code>, MySQL foreign key constraints will prevent deletion.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]">
            <Button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              variant="outlined"
              className="!border-[#E8DFC8] !text-[#1C1917] !rounded-xl"
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
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Books;
