// src/pages/vault/Vault.jsx
import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vaultApi } from '../../services/index.js';
import { api } from '../../lib/apiClient.js';

import { Card, CardBody } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import { PageLoader, EmptyState, Spinner } from '../../components/ui/Spinner.jsx';

import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import {
  Lock, Upload, Download, Trash2, FileText, File, FileImage, FileSpreadsheet,
  Presentation, Search, LayoutGrid, List as ListIcon, Check, AlertCircle,
  FileType, Calendar, HardDrive, Eye, ChevronRight, ChevronLeft, LoaderCircle,
  RefreshCw, ExternalLink, Pencil, Save, X, FolderOpen, FilePlus2, ShieldCheck,
  Clock3, Tag, FileCheck2, CloudUpload, ArrowUpDown, ListChecks,
} from 'lucide-react';

import { bytesToHuman, formatDate, formatDateTime, cn } from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/favv.png';

// --------------------------------------------------
// Constants
// --------------------------------------------------

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPT =
  '.pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg,.csv,.md,.rtf';

const CATEGORIES = [
  'Images', 'Videos', 'Audio & Music', 'PDF Documents', 'Word Documents',
  'Spreadsheets', 'CSV & Data Files', 'Presentations', 'Text & Markdown',
  'Archives & Compressed Files', 'Code & Development', 'Design & Creative Files',
  'E-books & Reading', 'Education & Study', 'Teaching Materials',
  'Assignments & Projects', 'Certificates', 'Identity & Personal Documents',
  'Finance & Bills', 'Work & Office', 'Business', 'Research & References',
  'Health & Records', 'Travel & Tickets', 'Photos & Memories', 'Notes & Ideas',
  'Important', 'Personal', 'General', 'Other',
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'name-desc', label: 'Name Z–A' },
  { id: 'size-desc', label: 'Largest first' },
  { id: 'size-asc', label: 'Smallest first' },
];

const FILE_TYPES = {
  pdf:    { exts: ['pdf'], icon: FileText, color: '#D45B72', label: 'PDF Document', shortLabel: 'PDF' },
  doc:    { exts: ['doc', 'docx'], icon: FileText, color: '#4F83CC', label: 'Word Document', shortLabel: 'DOC' },
  sheet:  { exts: ['xls', 'xlsx', 'csv'], icon: FileSpreadsheet, color: '#269B78', label: 'Spreadsheet', shortLabel: 'XLS' },
  slides: { exts: ['ppt', 'pptx'], icon: Presentation, color: '#D68A42', label: 'Presentation', shortLabel: 'PPT' },
  image:  { exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], icon: FileImage, color: '#9270C9', label: 'Image', shortLabel: 'IMG' },
  text:   { exts: ['txt', 'md', 'rtf'], icon: File, color: '#718096', label: 'Text File', shortLabel: 'TXT' },
  other:  { exts: [], icon: File, color: '#84909D', label: 'Other File', shortLabel: 'FILE' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'doc', label: 'Documents' },
  { id: 'sheet', label: 'Sheets' },
  { id: 'slides', label: 'Slides' },
  { id: 'image', label: 'Images' },
  { id: 'text', label: 'Text' },
  { id: 'other', label: 'Other' },
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getFileType(fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  for (const [key, def] of Object.entries(FILE_TYPES)) {
    if (def.exts.includes(ext)) return { key, ...def };
  }
  return { key: 'other', ...FILE_TYPES.other };
}

function getExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
}

function isImageFile(file) {
  return getFileType(file?.file_name).key === 'image' || file?.mime_type?.startsWith('image/');
}

function isPdfFile(file) {
  return file?.mime_type === 'application/pdf' || getFileType(file?.file_name).key === 'pdf';
}

function fileIcon(fileName, size = 18) {
  const type = getFileType(fileName);
  const Icon = type.icon;
  return <Icon size={size} style={{ color: type.color }} />;
}

function extractUpdatedFile(response) {
  let result = response;
  for (let i = 0; i < 3; i += 1) {
    if (!result || typeof result !== 'object') break;
    if (result.id || result.file_name) return result;
    result = result.data || result.item || result.file || result.entry || result.result;
  }
  return result && typeof result === 'object' ? result : {};
}

function dedupeFiles(list) {
  return list.filter(
    (file, index, array) =>
      array.findIndex(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified
      ) === index
  );
}

function sortFiles(list, sort) {
  const copy = [...list];
  const time = (f) => new Date(f.created_at || 0).getTime();
  const size = (f) => Number(f.size_bytes) || 0;
  const name = (f) => (f.file_name || '').toLowerCase();

  switch (sort) {
    case 'oldest': return copy.sort((a, b) => time(a) - time(b));
    case 'name-asc': return copy.sort((a, b) => name(a).localeCompare(name(b)));
    case 'name-desc': return copy.sort((a, b) => name(b).localeCompare(name(a)));
    case 'size-desc': return copy.sort((a, b) => size(b) - size(a));
    case 'size-asc': return copy.sort((a, b) => size(a) - size(b));
    default: return copy.sort((a, b) => time(b) - time(a));
  }
}

const inputClass =
  'w-full rounded-xl border border-[#E8D5DC] bg-white/75 px-3.5 py-2.5 text-sm text-[#30232B] outline-none transition focus:border-[#A65F75] focus:ring-2 focus:ring-[#A65F75]/10 dark:border-white/10 dark:bg-[#211A22] dark:text-white';

const selectClass =
  'rounded-xl border border-[#E8D5DC] bg-white/80 px-3 py-2.5 text-xs font-medium text-[#66515B] shadow-sm outline-none transition focus:border-[#A65F75] focus:ring-2 focus:ring-[#A65F75]/10 dark:border-white/10 dark:bg-[#2A222D] dark:text-[#D6C8CE]';

const labelClass = 'mb-1.5 block text-xs font-semibold text-[#66515B] dark:text-[#D6C8CE]';

const panelClass =
  'rounded-2xl border border-[#E8D5DC] bg-white/75 dark:border-white/10 dark:bg-[#211A22]';

const mutedText = 'text-[#897780] dark:text-[#B8A7AF]';

// --------------------------------------------------
// Main component
// --------------------------------------------------

export default function Vault() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const fileRef = useRef(null);
  const addFilesRef = useRef(null);
  const dropRef = useRef(null);
  const searchWrapRef = useRef(null);
  const dragDepth = useRef(0);

  // Upload
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadPreviewIndex, setUploadPreviewIndex] = useState(0);
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState([]);

  // Listing
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');
  const [dragOver, setDragOver] = useState(false);

  // Selection (bulk actions)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  // Preview and details
  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [detailsFile, setDetailsFile] = useState(null);

  // Editing
  const [editing, setEditing] = useState(false);
  const [editCategory, setEditCategory] = useState('General');
  const [editDescription, setEditDescription] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // Local previews for files before upload (created and revoked in an effect).
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setUploadPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const activeUploadFile = selectedFiles[uploadPreviewIndex] || selectedFiles[0] || null;
  const activeUploadUrl = uploadPreviewUrls[uploadPreviewIndex] || uploadPreviewUrls[0] || null;

  // --------------------------------------------------
  // Query: load once, search / filter / sort locally.
  // (Keeping search out of the query key stops the whole page
  //  from flashing the loader and losing input focus on every keystroke.)
  // --------------------------------------------------

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['vault'],
    queryFn: () => vaultApi.list({ limit: 200 }),
  });

  const allFiles = useMemo(() => data?.items || [], [data]);

  const existingNames = useMemo(
    () => new Set(allFiles.map((f) => (f.file_name || '').toLowerCase())),
    [allFiles]
  );

  const categoriesInUse = useMemo(() => {
    const set = new Set();
    allFiles.forEach((f) => set.add(f.category || 'Uncategorized'));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allFiles]);

  const files = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = allFiles.filter((file) => {
      if (activeFilter !== 'all' && getFileType(file.file_name).key !== activeFilter) return false;
      if (categoryFilter !== 'all' && (file.category || 'Uncategorized') !== categoryFilter) return false;
      if (!q) return true;
      return [file.file_name, file.category, file.description].some((value) =>
        String(value || '').toLowerCase().includes(q)
      );
    });

    return sortFiles(filtered, sort);
  }, [allFiles, activeFilter, categoryFilter, search, sort]);

  const filterCounts = useMemo(() => {
    const counts = { all: 0, pdf: 0, doc: 0, sheet: 0, slides: 0, image: 0, text: 0, other: 0 };
    allFiles.forEach((file) => {
      counts.all += 1;
      counts[getFileType(file.file_name).key] += 1;
    });
    return counts;
  }, [allFiles]);

  const totalSize = useMemo(
    () => allFiles.reduce((sum, file) => sum + (Number(file.size_bytes) || 0), 0),
    [allFiles]
  );

  const typeBreakdown = useMemo(() => {
    const sizes = {};
    allFiles.forEach((file) => {
      const key = getFileType(file.file_name).key;
      sizes[key] = (sizes[key] || 0) + (Number(file.size_bytes) || 0);
    });
    return Object.entries(sizes)
      .map(([key, bytes]) => ({ key, bytes, ...FILE_TYPES[key] }))
      .sort((a, b) => b.bytes - a.bytes);
  }, [allFiles]);

  const hasActiveFilters =
    Boolean(search.trim()) || activeFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setActiveFilter('all');
    setCategoryFilter('all');
  };

  // --------------------------------------------------
  // Selection
  // --------------------------------------------------

  const selectedList = useMemo(
    () => allFiles.filter((file) => selectedIds.has(file.id)),
    [allFiles, selectedIds]
  );
  const selectedBytes = selectedList.reduce((sum, f) => sum + (Number(f.size_bytes) || 0), 0);
  const selectionActive = selectedIds.size > 0;
  const allVisibleSelected = files.length > 0 && files.every((f) => selectedIds.has(f.id));

  const toggleSelect = useCallback((id) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) files.forEach((f) => next.delete(f.id));
      else files.forEach((f) => next.add(f.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // --------------------------------------------------
  // Refresh
  // --------------------------------------------------

  const handleRefresh = async () => {
    try {
      await qc.invalidateQueries({ queryKey: ['vault'] });
      await refetch();
      toast.success('Vault refreshed');
    } catch (error) {
      toast.error(error?.message || 'Could not refresh vault');
    }
  };

  // --------------------------------------------------
  // Keyboard shortcut: "/" focuses search
  // --------------------------------------------------

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target?.isContentEditable) return;
      event.preventDefault();
      searchWrapRef.current?.querySelector('input')?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --------------------------------------------------
  // Upload selection
  // --------------------------------------------------

  const openUploadDialog = (incomingFiles = []) => {
    const incoming = Array.from(incomingFiles || []);
    if (!incoming.length) return;

    setSelectedFiles(dedupeFiles(incoming));
    setUploadPreviewIndex(0);
    setUploadCategory('General');
    setUploadDescription('');
    setUploadDialogOpen(true);

    if (fileRef.current) fileRef.current.value = '';
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((previous) => previous.filter((_, i) => i !== index));
    setUploadPreviewIndex((current) => {
      if (index < current) return current - 1;
      if (index === current) return Math.max(0, current - 1);
      return current;
    });
  };

  const addMoreFiles = (event) => {
    const incoming = Array.from(event.target.files || []);
    setSelectedFiles((previous) => dedupeFiles([...previous, ...incoming]));
    event.target.value = '';
  };

  const closeUploadDialog = useCallback(() => {
    if (uploading) return;
    setUploadDialogOpen(false);
    setSelectedFiles([]);
    setUploadDescription('');
  }, [uploading]);

  // --------------------------------------------------
  // Upload execution
  // --------------------------------------------------

  const uploadFiles = useCallback(async () => {
    if (!selectedFiles.length || uploading) return;

    const oversized = selectedFiles.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversized.length) {
      toast.error(`${oversized.length} file(s) exceed the 25 MB limit`);
      return;
    }

    setUploading(true);

    const queueEntries = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      fileName: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      error: null,
    }));

    setUploadQueue((previous) => [...previous, ...queueEntries]);

    const patchEntry = (id, patch) =>
      setUploadQueue((previous) =>
        previous.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );

    let successCount = 0;

    for (let i = 0; i < selectedFiles.length; i += 1) {
      const file = selectedFiles[i];
      const entry = queueEntries[i];

      patchEntry(entry.id, { status: 'uploading', progress: 8 });

      // Smooth, capped progress while the request is in flight.
      const ticker = setInterval(() => {
        setUploadQueue((previous) =>
          previous.map((item) =>
            item.id === entry.id && item.status === 'uploading'
              ? { ...item, progress: Math.min(item.progress + Math.random() * 12, 90) }
              : item
          )
        );
      }, 300);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadCategory);
        formData.append('description', uploadDescription.trim());

        await api.post('/vault/upload', formData);

        successCount += 1;
        patchEntry(entry.id, { progress: 100, status: 'done' });

        setTimeout(() => {
          setUploadQueue((previous) => previous.filter((item) => item.id !== entry.id));
        }, 3000);
      } catch (error) {
        patchEntry(entry.id, { status: 'error', error: error?.message || 'Upload failed' });
      } finally {
        clearInterval(ticker);
      }
    }

    await qc.invalidateQueries({ queryKey: ['vault'] });
    setUploading(false);

    if (successCount === selectedFiles.length) {
      toast.success(`${successCount} file(s) uploaded successfully`);
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadDescription('');
    } else if (successCount > 0) {
      toast.warning(`${successCount} of ${selectedFiles.length} files uploaded`);
      setUploadDialogOpen(false);
      setSelectedFiles([]);
    } else {
      toast.error('No files could be uploaded');
    }

    if (fileRef.current) fileRef.current.value = '';
  }, [selectedFiles, uploading, uploadCategory, uploadDescription, qc]);

  // --------------------------------------------------
  // Drag and drop (depth counter prevents flicker over child elements)
  // --------------------------------------------------

  const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

  const onDragEnter = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };

  const onDragOver = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
  };

  const onDragLeave = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };

  const onDrop = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    if (event.dataTransfer?.files?.length) openUploadDialog(event.dataTransfer.files);
  };

  // --------------------------------------------------
  // Download
  // --------------------------------------------------

  const triggerDownload = async (file) => {
    const { url } = await vaultApi.download(file.id);
    if (!url) throw new Error('Download URL was not returned');

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.file_name;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const download = async (file) => {
    if (!file?.id) return;
    try {
      toast.loading('Preparing download...', { id: 'vault-download' });
      await triggerDownload(file);
      toast.success('Download started', { id: 'vault-download' });
    } catch (error) {
      toast.error(error?.message || 'Download failed', { id: 'vault-download' });
    }
  };

  // --------------------------------------------------
  // Delete
  // --------------------------------------------------

  const remove = useMutation({
    mutationFn: (id) => vaultApi.remove(id),
    onSuccess: async (_result, id) => {
      await qc.invalidateQueries({ queryKey: ['vault'] });
      toast.success('File deleted successfully');
      setDetailsFile((current) => (current?.id === id ? null : current));
      setPreviewFile((current) => (current?.id === id ? null : current));
      setSelectedIds((previous) => {
        if (!previous.has(id)) return previous;
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    },
    onError: (error) => toast.error(error?.message || 'Could not delete file'),
  });

  const handleRemove = async (file) => {
    if (!file?.id || remove.isPending || bulkBusy) return;
    try {
      const ok = await confirm({
        title: 'Delete file permanently?',
        description: `"${file.file_name}" (${bytesToHuman(file.size_bytes)}) will be permanently removed from your vault. This action cannot be undone.`,
        confirmText: 'Delete permanently',
        cancelText: 'Cancel',
        danger: true,
      });
      if (ok) remove.mutate(file.id);
    } catch (error) {
      toast.error(error?.message || 'Could not open delete confirmation');
    }
  };

  // --------------------------------------------------
  // Bulk actions
  // --------------------------------------------------

  const bulkDownload = async () => {
    if (!selectedList.length || bulkBusy) return;
    setBulkBusy(true);
    let ok = 0;

    for (const file of selectedList) {
      try {
        await triggerDownload(file);
        ok += 1;
        // Small gap so the browser does not block back-to-back downloads.
        await new Promise((resolve) => setTimeout(resolve, 450));
      } catch {
        /* counted below */
      }
    }

    setBulkBusy(false);
    if (ok === selectedList.length) toast.success(`${ok} download(s) started`);
    else if (ok > 0) toast.warning(`${ok} of ${selectedList.length} downloads started`);
    else toast.error('Downloads failed');
  };

  const bulkDelete = async () => {
    if (!selectedList.length || bulkBusy) return;

    const ok = await confirm({
      title: `Delete ${selectedList.length} file${selectedList.length > 1 ? 's' : ''} permanently?`,
      description: `${selectedList.length} selected file(s) (${bytesToHuman(selectedBytes)}) will be permanently removed from your vault. This action cannot be undone.`,
      confirmText: 'Delete permanently',
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;

    setBulkBusy(true);
    const results = await Promise.allSettled(selectedList.map((file) => vaultApi.remove(file.id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeededIds = selectedList
      .filter((_, i) => results[i].status === 'fulfilled')
      .map((f) => f.id);

    await qc.invalidateQueries({ queryKey: ['vault'] });

    setSelectedIds((previous) => {
      const next = new Set(previous);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });
    setDetailsFile((current) => (current && succeededIds.includes(current.id) ? null : current));
    setPreviewFile((current) => (current && succeededIds.includes(current.id) ? null : current));
    setBulkBusy(false);

    if (!failed) toast.success(`${succeededIds.length} file(s) deleted`);
    else toast.warning(`${succeededIds.length} deleted, ${failed} failed`);
  };

  // --------------------------------------------------
  // Preview (with previous / next navigation)
  // --------------------------------------------------

  const openPreview = useCallback(
    async (file) => {
      if (!file?.id || previewLoadingId) return;
      setPreviewLoadingId(file.id);

      try {
        const result = await vaultApi.download(file.id);
        if (!result?.url) throw new Error('Preview URL was not returned');
        setPreviewFile({ ...file, url: result.url });
        setEditing(false);
      } catch (error) {
        toast.error(error?.message || 'Could not load preview');
      } finally {
        setPreviewLoadingId(null);
      }
    },
    [previewLoadingId]
  );

  const previewIndex = previewFile ? files.findIndex((f) => f.id === previewFile.id) : -1;

  const stepPreview = useCallback(
    (direction) => {
      if (previewIndex < 0) return;
      const next = files[previewIndex + direction];
      if (next) openPreview(next);
    },
    [files, previewIndex, openPreview]
  );

  useEffect(() => {
    if (!previewFile || editing) return undefined;
    const onKey = (event) => {
      if (event.key === 'ArrowLeft') stepPreview(-1);
      if (event.key === 'ArrowRight') stepPreview(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewFile, editing, stepPreview]);

  // --------------------------------------------------
  // Details + editing
  // --------------------------------------------------

  const openDetails = (file) => {
    setDetailsFile(file);
    setPreviewFile(null);
    setEditing(false);
  };

  const startEditing = (file) => {
    if (!file) return;
    setEditCategory(file.category || 'General');
    setEditDescription(file.description || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    const file = previewFile || detailsFile;
    if (!file) return;
    setEditCategory(file.category || 'General');
    setEditDescription(file.description || '');
    setEditing(false);
  };

  const saveDetails = async () => {
    const file = previewFile || detailsFile;
    if (!file?.id || savingDetails) return;

    if (editDescription.length > 2000) {
      toast.error('Description cannot exceed 2000 characters');
      return;
    }

    setSavingDetails(true);

    try {
      const response = await api.patch(`/vault/${file.id}`, {
        category: editCategory,
        description: editDescription.trim() || null,
      });

      const updated = extractUpdatedFile(response);
      const merged = {
        ...file,
        ...updated,
        category: updated.category ?? editCategory,
        description:
          updated.description !== undefined ? updated.description : editDescription.trim() || null,
      };

      setPreviewFile((previous) => (previous?.id === file.id ? merged : previous));
      setDetailsFile((previous) => (previous?.id === file.id ? merged : previous));
      setEditing(false);

      await qc.invalidateQueries({ queryKey: ['vault'] });
      toast.success('File details updated');
    } catch (error) {
      toast.error(error?.message || 'Could not save file details');
    } finally {
      setSavingDetails(false);
    }
  };

  useEffect(() => {
    const file = previewFile || detailsFile;
    if (file && !editing) {
      setEditCategory(file.category || 'General');
      setEditDescription(file.description || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewFile?.id, detailsFile?.id]);

  const deletingDetails = Boolean(
    detailsFile?.id && remove.isPending && remove.variables === detailsFile.id
  );

  // Only block the page on the very first load.
  if (isLoading && !data) return <PageLoader />;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div
      ref={dropRef}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative isolate min-h-full"
    >
      {/* Background: FIXED to the viewport so it never scrolls with the page */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${lavenderBg}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-white/35 to-[#F5E8ED]/45 dark:bg-[#17131A]/70 dark:bg-none" />
      </div>

      {/* Drag overlay: also fixed, so it always covers the visible screen */}
      {dragOver && (
        <div className="pointer-events-none fixed inset-3 z-50 flex items-center justify-center rounded-3xl border-2 border-dashed border-[#A65F75] bg-white/80 backdrop-blur-md dark:bg-black/70">
          <div className="text-center">
            <CloudUpload size={42} className="mx-auto mb-4 text-[#A65F75]" />
            <p className="text-lg font-bold text-[#30232B] dark:text-white">Drop files to upload</p>
            <p className={cn('mt-1 text-sm', mutedText)}>Maximum 25 MB per file</p>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-5 rounded-[26px] border border-white/70 bg-white/55 p-5 shadow-[0_12px_40px_rgba(80,45,60,0.07)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-[#211A22]/65 sm:p-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDBFC9]/70 bg-gradient-to-br from-white to-[#F5E7EC] shadow-sm dark:border-white/10 dark:from-[#382733] dark:to-[#2A202B]">
                <Lock size={19} className="text-[#A65F75]" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A65F75] dark:text-[#D9A8B7]">
                Personal storage
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#30232B] dark:text-white sm:text-3xl">
              Private Vault
            </h1>
            <p className="mt-1 text-sm text-[#66515B] dark:text-[#D6C8CE]">
              Keep your important documents and files securely organized.
            </p>

            <p className={cn('mt-3 inline-flex flex-wrap items-center rounded-full border border-[#E8D5DC]/80 bg-white/55 px-3 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.04]', mutedText)}>
              {allFiles.length} files
              <span className="mx-2">·</span>
              {bytesToHuman(totalSize)} used
              <span className="mx-2">·</span>
              Private storage
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(event) => openUploadDialog(event.target.files)}
              accept={ACCEPT}
              multiple
            />

            <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
              <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload size={15} />
              Upload files
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard icon={HardDrive} label="Total files" value={allFiles.length} />
          <StatCard icon={FileType} label="Storage used" value={bytesToHuman(totalSize)} />
          <StatCard icon={FileImage} label="Images" value={filterCounts.image} />
          <StatCard icon={FileText} label="Documents" value={filterCounts.pdf + filterCounts.doc} />
        </div>

        {/* Storage breakdown */}
        {allFiles.length > 0 && (
          <StorageBreakdown
            breakdown={typeBreakdown}
            totalSize={totalSize}
            activeFilter={activeFilter}
            onPick={(key) => setActiveFilter((current) => (current === key ? 'all' : key))}
          />
        )}

        {/* Search, sort, category, view */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/45 p-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#211A22]/45 lg:flex-row lg:items-center">
          <div ref={searchWrapRef} className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#897780]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, category or description…  ( / )"
              className="pl-10 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#897780] transition hover:bg-[#F4E9ED] dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Sort files</span>
              <ArrowUpDown size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A65F75]" />
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={cn(selectClass, 'pl-8')}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Filter by category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={cn(selectClass, 'max-w-[190px]')}
              >
                <option value="all">All categories</option>
                {categoriesInUse.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center rounded-xl border border-[#E8D5DC] bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-[#2A222D]">
              {[
                { id: 'list', icon: ListIcon, label: 'List view' },
                { id: 'grid', icon: LayoutGrid, label: 'Grid view' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-label={label}
                  className={cn(
                    'rounded-lg p-2 transition-all',
                    view === id
                      ? 'bg-gradient-to-br from-[#B66D83] to-[#925168] text-white shadow-md'
                      : 'text-[#897780] hover:bg-[#F4E9ED] dark:hover:bg-white/10'
                  )}
                >
                  <Icon size={17} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Type filters */}
        <div className="mb-3 flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                activeFilter === filter.id
                  ? 'border-[#A65F75] bg-[#A65F75] text-white shadow-sm'
                  : 'border-[#E8D5DC] bg-white/70 text-[#66515B] shadow-sm hover:border-[#CFA7B5] dark:border-white/[0.10] dark:bg-[#241D27]/70 dark:text-[#D6C8CE]'
              )}
            >
              {filter.label}
              <span className="ml-1.5 opacity-70">{filterCounts[filter.id]}</span>
            </button>
          ))}
        </div>

        {/* Result summary */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className={mutedText}>
            Showing <span className="font-semibold text-[#30232B] dark:text-white">{files.length}</span> of {allFiles.length} files
            {hasActiveFilters && ' (filtered)'}
          </p>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="font-semibold text-[#A65F75] hover:underline">
                Clear filters
              </button>
            )}
            {files.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="inline-flex items-center gap-1.5 font-semibold text-[#A65F75] hover:underline"
              >
                <ListChecks size={13} />
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectionActive && (
          <div className="sticky top-3 z-20 mb-4 flex flex-col gap-3 rounded-2xl border border-[#D9B7C1] bg-white/90 p-3 shadow-[0_14px_36px_rgba(166,95,117,0.16)] backdrop-blur-xl dark:border-white/15 dark:bg-[#241D27]/95 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4E9ED] text-[#A65F75] dark:bg-[#A65F75]/15">
                <ListChecks size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#30232B] dark:text-white">
                  {selectedIds.size} selected
                </p>
                <p className={cn('text-[11px]', mutedText)}>{bytesToHuman(selectedBytes)} total</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={clearSelection} disabled={bulkBusy}>
                <X size={14} />
                Clear
              </Button>
              <Button variant="outline" onClick={bulkDownload} disabled={bulkBusy} loading={bulkBusy}>
                <Download size={14} />
                Download
              </Button>
              <Button variant="danger" onClick={bulkDelete} disabled={bulkBusy}>
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Upload queue */}
        {uploadQueue.length > 0 && (
          <div className="mb-5 grid gap-2 md:grid-cols-2">
            {uploadQueue.map((entry) => (
              <UploadProgressCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Files */}
        {files.length === 0 ? (
          <div className="rounded-[26px] border border-white/75 bg-white/70 p-7 shadow-[0_12px_36px_rgba(80,45,60,0.07)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-[#241D27]/75 sm:p-10">
            <EmptyState
              icon={Lock}
              title={hasActiveFilters ? 'No matching files' : 'Vault is empty'}
              description={
                hasActiveFilters
                  ? 'No files match your current search or filters.'
                  : 'Drag and drop files here, or click Upload to add your first file.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                ) : (
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload size={14} />
                    Upload files
                  </Button>
                )
              }
            />
          </div>
        ) : view === 'list' ? (
          <div className="space-y-2">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                selectionActive={selectionActive}
                onToggleSelect={() => toggleSelect(file.id)}
                onPreview={() => openPreview(file)}
                onDetails={() => openDetails(file)}
                onDownload={() => download(file)}
                onDelete={() => handleRemove(file)}
                previewLoading={previewLoadingId === file.id}
                deleting={remove.isPending && remove.variables === file.id}
                deleteDisabled={remove.isPending || bulkBusy}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <FileTile
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                selectionActive={selectionActive}
                onToggleSelect={() => toggleSelect(file.id)}
                onPreview={() => openPreview(file)}
                onDetails={() => openDetails(file)}
                onDownload={() => download(file)}
                onDelete={() => handleRemove(file)}
                previewLoading={previewLoadingId === file.id}
                deleting={remove.isPending && remove.variables === file.id}
                deleteDisabled={remove.isPending || bulkBusy}
              />
            ))}
          </div>
        )}

        {/* ==================================================
            UPLOAD DIALOG
        ================================================== */}
        <Dialog
          open={uploadDialogOpen}
          onClose={closeUploadDialog}
          title="Upload to Private Vault"
          size="2xl"
          footer={
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className={cn('flex items-center gap-2 text-xs', mutedText)}>
                <ShieldCheck size={15} className="text-[#A65F75]" />
                <span>
                  {selectedFiles.length} selected · {bytesToHuman(selectedFiles.reduce((s, f) => s + f.size, 0))} · 25 MB max per file
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={closeUploadDialog} disabled={uploading}>Cancel</Button>
                <Button
                  onClick={uploadFiles}
                  disabled={!selectedFiles.length || uploading || selectedFiles.some((f) => f.size > MAX_FILE_SIZE)}
                  loading={uploading}
                >
                  <CloudUpload size={16} />
                  {uploading
                    ? 'Uploading files...'
                    : `Upload ${selectedFiles.length || ''} ${selectedFiles.length === 1 ? 'file' : 'files'}`}
                </Button>
              </div>
            </div>
          }
        >
          <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            <section className="min-w-0 space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-[#E8D5DC] bg-gradient-to-br from-[#FFF9FB] via-[#FBF1F5] to-[#F5E7ED] p-4 dark:border-white/10 dark:from-[#382733] dark:via-[#30232F] dark:to-[#241D27] sm:p-5">
                <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#D9A8B7]/20 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.06]">
                    <CloudUpload size={23} className="text-[#A65F75]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#30232B] dark:text-white">Add documents to your vault</h3>
                    <p className={cn('mt-1 text-xs leading-5', mutedText)}>
                      Select, preview and organize your files before securely uploading them.
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn(panelClass, 'p-4 sm:p-5')}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#30232B] dark:text-white">Selected files</h3>
                    <p className={cn('mt-1 text-[11px]', mutedText)}>Choose a file to see its preview</p>
                  </div>
                  <span className="rounded-full bg-[#F5E9EE] px-2.5 py-1 text-[10px] font-bold text-[#A65F75] dark:bg-[#A65F75]/15">
                    {selectedFiles.length} files
                  </span>
                </div>

                <input ref={addFilesRef} type="file" className="hidden" multiple accept={ACCEPT} onChange={addMoreFiles} />

                <div className="max-h-[270px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                  {selectedFiles.map((file, index) => {
                    const selected = index === uploadPreviewIndex;
                    const tooLarge = file.size > MAX_FILE_SIZE;
                    const duplicate = existingNames.has(file.name.toLowerCase());

                    return (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className={cn(
                          'flex min-w-0 items-center gap-3 rounded-xl border p-2.5 transition-all',
                          selected
                            ? 'border-[#B8758D] bg-[#FBF1F5] shadow-sm dark:border-[#B8758D]/70 dark:bg-[#A65F75]/10'
                            : 'border-[#E8D5DC] bg-white/70 hover:border-[#D5AAB8] dark:border-white/10 dark:bg-white/[0.025]'
                        )}
                      >
                        <button type="button" onClick={() => setUploadPreviewIndex(index)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5E9EE] dark:bg-[#A65F75]/15">
                            {getFileType(file.name).key === 'image' && uploadPreviewUrls[index]
                              ? <img src={uploadPreviewUrls[index]} alt="" className="h-full w-full object-cover" />
                              : fileIcon(file.name, 20)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#30232B] dark:text-white">{file.name}</p>
                            <p className={cn('mt-1 text-[10px]', mutedText)}>{bytesToHuman(file.size)} · {getExtension(file.name)}</p>
                            {tooLarge && <p className="mt-1 text-[10px] font-semibold text-red-500">Exceeds 25 MB limit</p>}
                            {!tooLarge && duplicate && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                <AlertCircle size={10} />
                                A file with this name is already in your vault
                              </p>
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          disabled={uploading}
                          aria-label={`Remove ${file.name}`}
                          className="shrink-0 rounded-lg p-2 text-[#897780] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-500/10"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => addFilesRef.current?.click()}
                  disabled={uploading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#CFA7B5] bg-[#FBF5F7] px-4 py-3 text-xs font-bold text-[#A65F75] transition hover:border-[#A65F75] hover:bg-[#F8EDF1] disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.025] dark:hover:bg-white/[0.06]"
                >
                  <FilePlus2 size={15} />
                  Add more files
                </button>
              </div>

              <Panel
                icon={FolderOpen}
                title="Organize files"
                subtitle="These details will be applied to all selected files"
              >
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Category</label>
                    <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} disabled={uploading} className={inputClass}>
                      {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className={cn(labelClass, 'mb-0')}>Description</label>
                      <span className={cn('text-[10px]', mutedText)}>{uploadDescription.length}/2000</span>
                    </div>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      disabled={uploading}
                      placeholder="Add context or notes about these files..."
                      className={cn(inputClass, 'resize-none')}
                    />
                  </div>
                </div>
              </Panel>
            </section>

            <section className={cn('flex min-w-0 flex-col overflow-hidden shadow-sm', panelClass)}>
              <div className="flex items-center justify-between gap-3 border-b border-[#E8D5DC] px-4 py-3 dark:border-white/10 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                  <Eye size={16} className="shrink-0 text-[#A65F75]" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#30232B] dark:text-white">File preview</h3>
                    <p className={cn('mt-0.5 text-[10px]', mutedText)}>Local preview · Not uploaded yet</p>
                  </div>
                </div>
                {activeUploadFile && (
                  <span className="shrink-0 rounded-lg bg-[#F5E9EE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#A65F75] dark:bg-[#A65F75]/15">
                    {getExtension(activeUploadFile.name)}
                  </span>
                )}
              </div>

              <div className="flex min-h-[340px] flex-1 items-center justify-center bg-[#F2EDF0] p-3 dark:bg-[#17131A] sm:min-h-[480px] sm:p-4">
                {!activeUploadFile ? (
                  <div className="px-6 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-white/[0.05]">
                      <Eye size={30} className="text-[#B58A99]" />
                    </div>
                    <p className="text-sm font-bold text-[#30232B] dark:text-white">Preview will appear here</p>
                    <p className={cn('mt-2 text-xs leading-5', mutedText)}>Select a file from the list to inspect it before uploading.</p>
                  </div>
                ) : isImageFile({ file_name: activeUploadFile.name, mime_type: activeUploadFile.type }) ? (
                  <img src={activeUploadUrl} alt={activeUploadFile.name} className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-lg" />
                ) : isPdfFile({ file_name: activeUploadFile.name, mime_type: activeUploadFile.type }) ? (
                  <iframe src={`${activeUploadUrl}#toolbar=1&navpanes=0`} title={`Preview ${activeUploadFile.name}`} className="h-[65vh] min-h-[340px] w-full rounded-xl border border-[#DED5DA] bg-white shadow-md" />
                ) : (
                  <NoPreview fileName={activeUploadFile.name} message="A visual preview is not available for this format. You can still upload and download the original file." />
                )}
              </div>

              {activeUploadFile && (
                <div className="border-t border-[#E8D5DC] bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02] sm:px-5">
                  <p className="truncate text-xs font-bold text-[#30232B] dark:text-white">{activeUploadFile.name}</p>
                  <div className={cn('mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px]', mutedText)}>
                    <span>{bytesToHuman(activeUploadFile.size)}</span>
                    <span>{activeUploadFile.type || getFileType(activeUploadFile.name).label}</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        </Dialog>

        {/* ==================================================
            PREVIEW DIALOG
        ================================================== */}
        <Dialog
          open={!!previewFile}
          onClose={() => {
            if (!savingDetails) {
              setPreviewFile(null);
              setEditing(false);
            }
          }}
          title="File preview"
          size="2xl"
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setPreviewFile(null);
                  setEditing(false);
                }}
                disabled={savingDetails}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Button variant="outline" onClick={cancelEditing} disabled={savingDetails}>Cancel</Button>
                    <Button onClick={saveDetails} disabled={savingDetails} loading={savingDetails}>
                      <Save size={14} />
                      Save changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => startEditing(previewFile)}>
                      <Pencil size={14} />
                      Edit details
                    </Button>
                    <Button onClick={() => download(previewFile)}>
                      <Download size={14} />
                      Download
                    </Button>
                  </>
                )}
              </div>
            </div>
          }
        >
          {previewFile && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(310px,0.85fr)]">
              <section className={cn('min-w-0 overflow-hidden rounded-xl', panelClass, 'bg-white/65')}>
                <div className="flex items-center justify-between gap-2 border-b border-[#E8D5DC] px-3.5 py-2.5 dark:border-white/10">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-[#30232B] dark:text-white">
                    <Eye size={15} className="shrink-0 text-[#A65F75]" />
                    Document preview
                  </span>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {previewIndex >= 0 && files.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => stepPreview(-1)}
                          disabled={previewIndex <= 0 || !!previewLoadingId || editing}
                          aria-label="Previous file"
                          className="rounded-md p-1 text-[#A65F75] transition hover:bg-[#F4E9ED] disabled:opacity-30 dark:hover:bg-white/10"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className={cn('min-w-[44px] text-center text-[10px] font-semibold tabular-nums', mutedText)}>
                          {previewIndex + 1} / {files.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => stepPreview(1)}
                          disabled={previewIndex >= files.length - 1 || !!previewLoadingId || editing}
                          aria-label="Next file"
                          className="rounded-md p-1 text-[#A65F75] transition hover:bg-[#F4E9ED] disabled:opacity-30 dark:hover:bg-white/10"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                    <span className="rounded-md bg-[#F4E9ED] px-2 py-1 text-[9px] font-bold text-[#A65F75] dark:bg-[#A65F75]/15">
                      {getExtension(previewFile.file_name)}
                    </span>
                  </div>
                </div>

                <div className="relative flex min-h-[420px] items-center justify-center bg-[#F1ECEF] p-3 dark:bg-[#17131A] sm:p-4">
                  {previewLoadingId && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px] dark:bg-black/40">
                      <LoaderCircle size={26} className="animate-spin text-[#A65F75]" />
                    </div>
                  )}

                  {isImageFile(previewFile) && (
                    <img
                      src={previewFile.url}
                      alt={previewFile.file_name}
                      className="max-h-[72vh] max-w-full rounded-xl object-contain"
                      onError={() => toast.error('Could not load image preview')}
                    />
                  )}

                  {isPdfFile(previewFile) && (
                    <iframe
                      src={`${previewFile.url}#toolbar=1&navpanes=0`}
                      title={previewFile.file_name}
                      className="h-[72vh] min-h-[420px] w-full rounded-xl border border-[#DED5DA] bg-white shadow-md"
                    />
                  )}

                  {!isImageFile(previewFile) && !isPdfFile(previewFile) && (
                    <NoPreview fileName={previewFile.file_name} message="Preview is unavailable for this format. Download the file to view its contents." />
                  )}
                </div>

                {files.length > 1 && (
                  <p className={cn('border-t border-[#E8D5DC] px-3.5 py-2 text-center text-[10px] dark:border-white/10', mutedText)}>
                    Tip: use the ← and → keys to move between files
                  </p>
                )}
              </section>

              <section className="min-w-0 space-y-3">
                <div className={cn('rounded-xl p-3', panelClass, 'bg-white/65')}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5E9EE] dark:bg-[#A65F75]/15">
                      {fileIcon(previewFile.file_name, 21)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-xs font-bold leading-5 text-[#30232B] dark:text-white">{previewFile.file_name}</p>
                      <p className={cn('mt-1 text-[10px]', mutedText)}>{getFileType(previewFile.file_name).label}</p>
                    </div>
                  </div>
                </div>

                <div className={cn('rounded-xl p-3', panelClass, 'bg-white/65')}>
                  <div className="mb-2 flex items-center gap-2 border-b border-[#E8D5DC] pb-2 dark:border-white/10">
                    <FileCheck2 size={14} className="text-[#A65F75]" />
                    <h3 className="text-xs font-bold text-[#30232B] dark:text-white">File information</h3>
                  </div>
                  <CompactDetail icon={FileType} label="Type" value={previewFile.mime_type || getFileType(previewFile.file_name).label} />
                  <CompactDetail icon={HardDrive} label="Size" value={bytesToHuman(previewFile.size_bytes)} />
                  <CompactDetail icon={Calendar} label="Uploaded" value={formatDate(previewFile.created_at)} />
                  <CompactDetail icon={Clock3} label="Updated" value={formatDate(previewFile.updated_at)} />
                </div>

                <div className={cn('rounded-xl p-3', panelClass, 'bg-white/65')}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-[#30232B] dark:text-white">
                      <Tag size={14} className="text-[#A65F75]" />
                      Organization
                    </h3>
                    {!editing && (
                      <button type="button" onClick={() => startEditing(previewFile)} className="flex items-center gap-1 text-[10px] font-bold text-[#A65F75] hover:underline">
                        <Pencil size={11} />
                        Edit
                      </button>
                    )}
                  </div>

                  <OrganizationFields
                    editing={editing}
                    category={editing ? editCategory : previewFile.category}
                    description={editing ? editDescription : previewFile.description}
                    onCategory={setEditCategory}
                    onDescription={setEditDescription}
                    compact
                  />
                </div>
              </section>
            </div>
          )}
        </Dialog>

        {/* ==================================================
            DETAILS DIALOG
        ================================================== */}
        <Dialog
          open={!!detailsFile}
          onClose={() => {
            if (!savingDetails && !deletingDetails) {
              setDetailsFile(null);
              setEditing(false);
            }
          }}
          title="File details"
          size="lg"
          footer={
            <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="ghost"
                disabled={savingDetails || deletingDetails}
                onClick={() => {
                  setDetailsFile(null);
                  setEditing(false);
                }}
              >
                Close
              </Button>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {editing ? (
                  <>
                    <Button variant="outline" onClick={cancelEditing} disabled={savingDetails || deletingDetails}>Cancel</Button>
                    <Button onClick={saveDetails} disabled={savingDetails || deletingDetails} loading={savingDetails}>
                      <Save size={14} />
                      Save changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      disabled={deletingDetails}
                      onClick={() => {
                        const file = detailsFile;
                        setDetailsFile(null);
                        openPreview(file);
                      }}
                    >
                      <Eye size={14} />
                      Preview
                    </Button>
                    <Button variant="outline" onClick={() => download(detailsFile)} disabled={deletingDetails}>
                      <Download size={14} />
                      Download
                    </Button>
                    <Button onClick={() => startEditing(detailsFile)} disabled={deletingDetails}>
                      <Pencil size={14} />
                      Edit details
                    </Button>
                    <Button variant="danger" disabled={deletingDetails} onClick={() => handleRemove(detailsFile)}>
                      {deletingDetails ? (
                        <>
                          <LoaderCircle size={14} className="animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Delete file
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          }
        >
          {detailsFile && (
            <div className="space-y-5">
              <section className="relative overflow-hidden rounded-2xl border border-[#E8D5DC] bg-gradient-to-br from-[#FFF9FB] via-[#F9EEF3] to-[#F0E2E9] p-5 dark:border-white/10 dark:from-[#382733] dark:via-[#30232F] dark:to-[#241D27] sm:p-6">
                <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#D9A8B7]/20 blur-3xl" />

                <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/85 shadow-lg dark:border-white/10 dark:bg-white/[0.06]"
                    style={{ boxShadow: `0 8px 28px ${getFileType(detailsFile.file_name).color}18` }}
                  >
                    {fileIcon(detailsFile.file_name, 38)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#DDBFC9] bg-white/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#A65F75] dark:border-white/10 dark:bg-white/[0.06] dark:text-[#E2B6C5]">
                        {getExtension(detailsFile.file_name)} FILE
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <ShieldCheck size={11} />
                        Private storage
                      </span>
                    </div>

                    <h3 className="break-all text-base font-bold leading-6 text-[#30232B] dark:text-white sm:text-lg">{detailsFile.file_name}</h3>
                    <p className={cn('mt-1 text-xs', mutedText)}>{getFileType(detailsFile.file_name).label}</p>
                    <p className={cn('mt-2 flex items-center gap-1.5 text-[10px]', mutedText)}>
                      <Calendar size={12} />
                      Added {formatDate(detailsFile.created_at)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { icon: HardDrive, label: 'File size', value: bytesToHuman(detailsFile.size_bytes), cls: '' },
                  { icon: FileType, label: 'Format', value: getExtension(detailsFile.file_name), cls: '' },
                  { icon: Lock, label: 'Storage', value: 'Private Vault', cls: 'col-span-2 sm:col-span-1' },
                ].map(({ icon: Icon, label, value, cls }) => (
                  <div key={label} className={cn('rounded-xl p-3', panelClass, cls)}>
                    <div className="mb-2 flex items-center gap-2 text-[#A65F75]">
                      <Icon size={15} />
                      <span className="text-[10px] font-semibold">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-[#30232B] dark:text-white">{value}</p>
                  </div>
                ))}
              </section>

              <Panel icon={FileCheck2} title="File information" subtitle="Technical details and timestamps">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <MetadataItem label="File name" value={detailsFile.file_name} />
                  <MetadataItem label="MIME type" value={detailsFile.mime_type || getFileType(detailsFile.file_name).label} />
                  <MetadataItem label="Uploaded on" value={formatDateTime(detailsFile.created_at)} />
                  <MetadataItem label="Last modified" value={formatDateTime(detailsFile.updated_at)} />
                </div>
              </Panel>

              <Panel
                icon={FolderOpen}
                title="Organization"
                subtitle="Manage your file information"
                action={
                  !editing && (
                    <button
                      type="button"
                      onClick={() => startEditing(detailsFile)}
                      disabled={deletingDetails}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8D5DC] bg-white/80 px-3 py-2 text-[10px] font-bold text-[#A65F75] transition hover:border-[#B8758D] hover:bg-[#F9EEF3] disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                  )
                }
              >
                <OrganizationFields
                  editing={editing}
                  category={editing ? editCategory : detailsFile.category}
                  description={editing ? editDescription : detailsFile.description}
                  onCategory={setEditCategory}
                  onDescription={setEditDescription}
                />
              </Panel>
            </div>
          )}
        </Dialog>
      </main>
    </div>
  );
}

// --------------------------------------------------
// Small shared pieces
// --------------------------------------------------

function Panel({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className={cn(panelClass, 'p-4 sm:p-5')}>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E8D5DC] pb-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5E9EE] dark:bg-[#A65F75]/15">
            <Icon size={15} className="text-[#A65F75]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#30232B] dark:text-white">{title}</h3>
            {subtitle && <p className={cn('mt-0.5 text-[10px]', mutedText)}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function OrganizationFields({ editing, category, description, onCategory, onDescription, compact = false }) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <label className={labelClass}>Category</label>
        {editing ? (
          <select value={category || 'General'} onChange={(e) => onCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        ) : (
          <div className="flex min-h-10 items-center gap-2 rounded-xl border border-[#E8D5DC] bg-[#F9F3F5] px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.035]">
            <Tag size={13} className="text-[#A65F75]" />
            <span className="text-xs font-semibold text-[#66515B] dark:text-[#E2B6C5]">{category || 'Uncategorized'}</span>
          </div>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className={cn(labelClass, 'mb-0')}>Description</label>
          {editing && <span className={cn('text-[10px]', mutedText)}>{(description || '').length}/2000</span>}
        </div>

        {editing ? (
          <textarea
            value={description || ''}
            onChange={(e) => onDescription(e.target.value)}
            rows={compact ? 3 : 4}
            maxLength={2000}
            placeholder="Write something about this file..."
            className={cn(inputClass, 'resize-none leading-5')}
          />
        ) : (
          <div className="min-h-[60px] whitespace-pre-wrap break-words rounded-xl border border-[#E8D5DC] bg-[#F9F3F5] px-3.5 py-3 text-xs leading-6 text-[#66515B] dark:border-white/10 dark:bg-white/[0.035] dark:text-[#D6C8CE]">
            {description || 'No description added yet.'}
          </div>
        )}
      </div>
    </div>
  );
}

function NoPreview({ fileName, message }) {
  return (
    <div className="max-w-sm px-5 py-8 text-center">
      <div
        className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-md dark:bg-[#302632]"
        style={{ border: `1px solid ${getFileType(fileName).color}35` }}
      >
        {fileIcon(fileName, 43)}
      </div>
      <span className="rounded-full bg-[#F4E9ED] px-3 py-1.5 text-[10px] font-bold uppercase text-[#A65F75] dark:bg-[#A65F75]/15">
        {getExtension(fileName)} FILE
      </span>
      <h4 className="mt-4 break-all text-sm font-bold text-[#30232B] dark:text-white">{fileName}</h4>
      <p className={cn('mt-2 text-xs leading-5', mutedText)}>{message}</p>
    </div>
  );
}

function SelectBox({ selected, onToggle, className }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={selected ? 'Deselect file' : 'Select file'}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all',
        selected
          ? 'border-[#A65F75] bg-[#A65F75] text-white shadow-md'
          : 'border-[#CFA7B5] bg-white/95 text-transparent hover:border-[#A65F75] dark:border-white/25 dark:bg-[#241B22]/95',
        className
      )}
    >
      <Check size={14} strokeWidth={3} />
    </button>
  );
}

// --------------------------------------------------
// Stat card + storage breakdown
// --------------------------------------------------

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/75 bg-white/65 p-4 shadow-[0_8px_28px_rgba(80,45,60,0.06)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#D9B7C1] hover:shadow-[0_14px_32px_rgba(166,95,117,0.12)] dark:border-white/[0.09] dark:bg-[#241D27]/75 sm:p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F8EDF1] to-[#EEDBE3] text-[#A65F75] shadow-sm dark:from-[#49303E] dark:to-[#382735] dark:text-[#E2B6C5]">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-xs font-medium', mutedText)}>{label}</p>
        <p className="mt-1 truncate text-lg font-bold tracking-tight text-[#30232B] dark:text-white sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

function StorageBreakdown({ breakdown, totalSize, activeFilter, onPick }) {
  if (!totalSize) return null;

  return (
    <div className="mb-4 rounded-2xl border border-white/70 bg-white/55 p-4 shadow-[0_8px_28px_rgba(80,45,60,0.05)] backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#241D27]/70">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[#30232B] dark:text-white">Storage breakdown</h3>
        <span className={cn('text-[10px]', mutedText)}>{bytesToHuman(totalSize)} used · click a type to filter</span>
      </div>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#EADDE2] dark:bg-white/10">
        {breakdown.map((item) => (
          <button
            key={item.key}
            type="button"
            title={`${item.shortLabel}: ${bytesToHuman(item.bytes)}`}
            aria-label={`${item.label}: ${bytesToHuman(item.bytes)}`}
            onClick={() => onPick(item.key)}
            className={cn('h-full transition-opacity', activeFilter !== 'all' && activeFilter !== item.key && 'opacity-35')}
            style={{ width: `${(item.bytes / totalSize) * 100}%`, backgroundColor: item.color }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {breakdown.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onPick(item.key)}
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-medium text-[#66515B] transition-opacity dark:text-[#D6C8CE]',
              activeFilter !== 'all' && activeFilter !== item.key && 'opacity-50'
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.shortLabel}
            <span className={mutedText}>
              {bytesToHuman(item.bytes)} · {Math.round((item.bytes / totalSize) * 100)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------
// Upload progress card
// --------------------------------------------------

function UploadProgressCard({ entry }) {
  const isError = entry.status === 'error';
  const isDone = entry.status === 'done';

  return (
    <Card>
      <CardBody className="py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4E9ED] dark:bg-[#A65F75]/15">
            {isError ? <AlertCircle size={16} className="text-red-500" /> : isDone ? <Check size={16} className="text-green-500" /> : <Spinner size={14} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-text-main">{entry.fileName}</p>
              <span className="whitespace-nowrap text-xs text-text-muted">
                {isError ? 'Failed' : isDone ? 'Done' : `${Math.round(entry.progress)}%`}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[#EADDE2] dark:bg-white/10">
              <div
                className={cn('h-full rounded-full transition-all duration-300', isError ? 'bg-red-500' : isDone ? 'bg-green-500' : 'bg-[#A65F75]')}
                style={{ width: `${isError || isDone ? 100 : entry.progress}%` }}
              />
            </div>

            {isError && <p className="mt-1 text-xs text-red-500">{entry.error}</p>}
            {!isError && !isDone && <p className="mt-1 text-xs text-text-muted">{bytesToHuman(entry.size)}</p>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// --------------------------------------------------
// File cover
// --------------------------------------------------

function FileCover({ file, className = '' }) {
  const imageFile = isImageFile(file);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vault-cover', file.id],
    queryFn: () => vaultApi.download(file.id),
    enabled: imageFile,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  const type = getFileType(file.file_name);
  const Icon = type.icon;

  if (imageFile && data?.url && !isError) {
    return <img src={data.url} alt={file.file_name} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
  }

  return (
    <div className={cn('flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F8F1F3]/80 dark:bg-[#211A22]', className)}>
      {isLoading && imageFile ? (
        <Spinner size={20} />
      ) : (
        <>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-sm dark:bg-[#211A22]"
            style={{ border: `1px solid ${type.color}25` }}
          >
            <Icon size={22} style={{ color: type.color }} />
          </div>
          <span
            className="rounded-md px-2 py-0.5 text-[8px] font-bold tracking-wider"
            style={{ color: type.color, backgroundColor: `${type.color}12` }}
          >
            {getExtension(file.file_name)}
          </span>
        </>
      )}
    </div>
  );
}

// --------------------------------------------------
// File row
// --------------------------------------------------

function FileRow({
  file, selected, selectionActive, onToggleSelect, onPreview, onDetails,
  onDownload, onDelete, previewLoading, deleting, deleteDisabled,
}) {
  const type = getFileType(file.file_name);

  return (
    <Card
      className={cn(
        'group overflow-hidden border bg-white/75 shadow-[0_5px_20px_rgba(80,45,60,0.045)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D9B7C1] hover:shadow-[0_12px_28px_rgba(166,95,117,0.11)] dark:bg-[#241D27]/80',
        selected ? 'border-[#A65F75] ring-2 ring-[#A65F75]/20' : 'border-white/70 dark:border-white/[0.09]'
      )}
    >
      <CardBody className="flex items-center gap-3 py-3 sm:gap-4">
        <SelectBox
          selected={selected}
          onToggle={onToggleSelect}
          className={cn('shrink-0', !selectionActive && !selected && 'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100')}
        />

        <button
          type="button"
          onClick={onPreview}
          disabled={previewLoading}
          className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#E8D5DC] bg-gradient-to-br from-[#F8F1F3] to-[#EDE0E6] dark:border-white/[0.10] dark:from-[#2D2430] dark:to-[#241B22]"
          aria-label="Preview file"
        >
          <FileCover file={file} />
        </button>

        <button type="button" onClick={onDetails} className="min-w-0 flex-1 cursor-pointer text-left">
          <p className="truncate text-sm font-medium text-[#30232B] dark:text-white">{file.file_name}</p>

          <div className={cn('mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs', mutedText)}>
            <span>{type.shortLabel}</span>
            <span>·</span>
            <span>{bytesToHuman(file.size_bytes)}</span>
            <span>·</span>
            <span>{formatDate(file.created_at)}</span>
            {file.category && (
              <>
                <span>·</span>
                <span className="rounded-full bg-[#F4E9ED] px-2 py-0.5 text-[#A65F75] dark:bg-[#A65F75]/15 dark:text-[#D9A8B7]">{file.category}</span>
              </>
            )}
          </div>

          {file.description && (
            <p className={cn('mt-1 line-clamp-1 text-[11px]', mutedText)}>{file.description}</p>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPreview} disabled={previewLoading} aria-label="Preview">
            {previewLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Eye size={14} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDetails} aria-label="Details">
            <ChevronRight size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDownload} aria-label="Download">
            <Download size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={deleteDisabled}
            onClick={onDelete}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            aria-label={deleting ? 'Deleting file' : 'Delete file'}
            title={deleting ? 'Deleting...' : 'Delete file'}
          >
            {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={14} />}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// --------------------------------------------------
// File tile
// --------------------------------------------------

function FileTile({
  file, selected, selectionActive, onToggleSelect, onPreview, onDetails,
  onDownload, onDelete, previewLoading, deleting, deleteDisabled,
}) {
  const type = getFileType(file.file_name);

  const actionBtn =
    'rounded-lg border border-white/80 bg-white/95 p-1.5 text-slate-700 shadow-md dark:border-white/10 dark:bg-[#241B22]/95 dark:text-slate-100';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border bg-white/80 shadow-[0_6px_22px_rgba(80,45,60,0.055)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#D9B7C1] hover:shadow-[0_16px_34px_rgba(166,95,117,0.14)] dark:bg-[#241D27]/85',
        selected ? 'border-[#A65F75] ring-2 ring-[#A65F75]/25' : 'border-white/75 dark:border-white/[0.09]'
      )}
    >
      <button
        type="button"
        onClick={selectionActive ? onToggleSelect : onPreview}
        disabled={previewLoading && !selectionActive}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#F8F1F3] to-[#EDE0E6] dark:from-[#2D2430] dark:to-[#211A22] sm:aspect-square"
        aria-label={selectionActive ? 'Toggle selection' : 'Open file preview'}
      >
        <FileCover file={file} />

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {previewLoading ? (
            <LoaderCircle size={24} className="animate-spin text-white" />
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg">
              {selectionActive ? <Check size={15} /> : <Eye size={15} />}
              {selectionActive ? (selected ? 'Deselect' : 'Select') : 'Preview'}
            </div>
          )}
        </div>
      </button>

      <SelectBox
        selected={selected}
        onToggle={onToggleSelect}
        className={cn('absolute left-2 top-2 z-10', !selectionActive && !selected && 'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100')}
      />

      <CardBody className="p-3">
        <button
          type="button"
          onClick={onDetails}
          className="w-full truncate text-left text-xs font-medium text-[#30232B] hover:text-[#A65F75] dark:text-white"
          title={file.file_name}
        >
          {file.file_name}
        </button>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className={cn('text-[10px]', mutedText)}>{bytesToHuman(file.size_bytes)}</span>
          <span className="truncate text-[10px] font-medium" style={{ color: type.color }}>{type.shortLabel}</span>
        </div>

        {file.category && (
          <p className={cn('mt-2 truncate text-[10px]', mutedText)}>
            <Tag size={10} className="mr-1 inline" />
            {file.category}
          </p>
        )}
      </CardBody>

      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onDetails(); }}
          className={actionBtn}
          aria-label="File details"
        >
          <ExternalLink size={13} />
        </button>

        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onDownload(); }}
          className={actionBtn}
          aria-label="Download"
        >
          <Download size={13} />
        </button>

        <button
          type="button"
          disabled={deleteDisabled}
          onClick={(event) => { event.stopPropagation(); onDelete(); }}
          className={cn(actionBtn, 'border-red-100 text-red-600 disabled:opacity-50 dark:border-red-400/20 dark:text-red-400')}
          aria-label={deleting ? 'Deleting file' : 'Delete file'}
          title={deleting ? 'Deleting...' : 'Delete file'}
        >
          {deleting ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </Card>
  );
}

// --------------------------------------------------
// Detail rows
// --------------------------------------------------

function CompactDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 border-b border-[#EADDE2] py-2 last:border-0 dark:border-white/[0.08]">
      <Icon size={12} className="mt-0.5 shrink-0 text-[#A65F75]" />
      <span className={cn('w-[66px] shrink-0 text-[10px]', mutedText)}>{label}</span>
      <span className="min-w-0 flex-1 break-words text-[11px] font-medium leading-4 text-[#30232B] dark:text-white">{value || '—'}</span>
    </div>
  );
}

function MetadataItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#A58B93] dark:text-[#AFA0A7]">{label}</p>
      <p className="break-words text-xs font-semibold leading-5 text-[#30232B] dark:text-white">{value || '—'}</p>
    </div>
  );
}