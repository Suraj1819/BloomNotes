
// src/pages/vault/Vault.jsx

import { useRef, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { vaultApi } from '../../services/index.js';
import { api, ApiError } from '../../lib/apiClient.js';

import { Card, CardBody } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Dialog } from '../../components/ui/Dialog.jsx';
import {
  PageLoader,
  EmptyState,
  Spinner,
} from '../../components/ui/Spinner.jsx';

import { useConfirm } from '../../contexts/ConfirmContext.jsx';

import {
  Lock,
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
  Search,
  LayoutGrid,
  List as ListIcon,
  Check,
  AlertCircle,
  FileType,
  Calendar,
  HardDrive,
  Eye,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import {
  bytesToHuman,
  formatDate,
  formatDateTime,
  cn,
} from '../../lib/utils.js';

import lavenderBg from '../../../assets/background/lavender.png';

// --------------------------------------------------
// File type helpers
// --------------------------------------------------

const FILE_TYPES = {
  pdf: {
    exts: ['pdf'],
    icon: FileText,
    color: '#E53935',
    label: 'PDF Document',
    shortLabel: 'PDF',
  },
  doc: {
    exts: ['doc', 'docx'],
    icon: FileText,
    color: '#1976D2',
    label: 'Word Document',
    shortLabel: 'DOC',
  },
  sheet: {
    exts: ['xls', 'xlsx', 'csv'],
    icon: FileSpreadsheet,
    color: '#2E7D32',
    label: 'Spreadsheet',
    shortLabel: 'XLS',
  },
  slides: {
    exts: ['ppt', 'pptx'],
    icon: Presentation,
    color: '#E65100',
    label: 'Presentation',
    shortLabel: 'PPT',
  },
  image: {
    exts: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
    icon: FileImage,
    color: '#7B1FA2',
    label: 'Image',
    shortLabel: 'IMG',
  },
  text: {
    exts: ['txt', 'md', 'rtf'],
    icon: File,
    color: '#616161',
    label: 'Text File',
    shortLabel: 'TXT',
  },
  other: {
    exts: [],
    icon: File,
    color: '#757575',
    label: 'Other File',
    shortLabel: 'FILE',
  },
};

function getFileType(fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();

  for (const [key, def] of Object.entries(FILE_TYPES)) {
    if (def.exts.includes(ext)) {
      return { key, ...def };
    }
  }

  return { key: 'other', ...FILE_TYPES.other };
}

function getExtension(fileName = '') {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE';
}

function isImageFile(file) {
  return (
    getFileType(file?.file_name).key === 'image' ||
    file?.mime_type?.startsWith('image/')
  );
}

function isPdfFile(file) {
  return (
    file?.mime_type === 'application/pdf' ||
    getFileType(file?.file_name).key === 'pdf'
  );
}

function fileIcon(fileName, size = 18) {
  const type = getFileType(fileName);
  const Icon = type.icon;

  return <Icon size={size} style={{ color: type.color }} />;
}

// --------------------------------------------------
// Main Vault component
// --------------------------------------------------

export default function Vault() {
  const qc = useQueryClient();
  const confirm = useConfirm();

  const fileRef = useRef(null);
  const dropRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [view, setView] = useState('list');

  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [detailsFile, setDetailsFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch files

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['vault', { q: search }],
    queryFn: () =>
      vaultApi.list({
        q: search || undefined,
        limit: 200,
      }),
  });

  // Refresh

  const handleRefresh = async () => {
    try {
      await qc.invalidateQueries({ queryKey: ['vault'] });
      await refetch();
      toast.success('Vault refreshed successfully');
    } catch (error) {
      toast.error(error?.message || 'Could not refresh vault');
    }
  };

  // Filter files

  const files = useMemo(() => {
    const all = data?.items || [];

    if (activeFilter === 'all') return all;

    return all.filter(
      (file) => getFileType(file.file_name).key === activeFilter
    );
  }, [data, activeFilter]);

  // Filter counts

  const filterCounts = useMemo(() => {
    const counts = {
      all: 0,
      pdf: 0,
      doc: 0,
      sheet: 0,
      slides: 0,
      image: 0,
      text: 0,
      other: 0,
    };

    (data?.items || []).forEach((file) => {
      counts.all += 1;
      counts[getFileType(file.file_name).key] += 1;
    });

    return counts;
  }, [data]);

  // Storage size

  const totalSize = useMemo(
    () =>
      (data?.items || []).reduce(
        (sum, file) => sum + (Number(file.size_bytes) || 0),
        0
      ),
    [data]
  );

  // Upload files

  const uploadFiles = useCallback(async (fileList) => {
    const selectedFiles = Array.from(fileList || []);

    if (!selectedFiles.length) return;

    setUploading(true);

    const queueEntries = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      fileName: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      error: null,
    }));

    setUploadQueue((queue) => [...queue, ...queueEntries]);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const entry = queueEntries[i];

      setUploadQueue((queue) =>
        queue.map((item) =>
          item.id === entry.id
            ? { ...item, status: 'uploading' }
            : item
        )
      );

      const progressInterval = setInterval(() => {
        setUploadQueue((queue) =>
          queue.map((item) => {
            if (item.id !== entry.id) return item;

            return {
              ...item,
              progress: Math.min(item.progress + Math.random() * 20, 90),
            };
          })
        );
      }, 250);

      try {
        if (file.size > 25 * 1024 * 1024) {
          throw new Error('File exceeds 25 MB limit');
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', getFileType(file.name).label);

        await api.post('/vault/upload', fd);

        clearInterval(progressInterval);

        setUploadQueue((queue) =>
          queue.map((item) =>
            item.id === entry.id
              ? { ...item, progress: 100, status: 'done' }
              : item
          )
        );

        setTimeout(() => {
          setUploadQueue((queue) =>
            queue.filter((item) => item.id !== entry.id)
          );
        }, 1800);
      } catch (error) {
        clearInterval(progressInterval);

        const message =
          error instanceof ApiError
            ? error.message
            : error?.message || 'Upload failed';

        setUploadQueue((queue) =>
          queue.map((item) =>
            item.id === entry.id
              ? { ...item, status: 'error', error: message }
              : item
          )
        );
      }
    }

    await qc.invalidateQueries({ queryKey: ['vault'] });

    setUploading(false);

    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }, [qc]);

  const handleFileInput = (event) => {
    uploadFiles(event.target.files);
  };

  // Drag and drop

  const onDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();

    if (
      event.relatedTarget &&
      dropRef.current?.contains(event.relatedTarget)
    ) {
      return;
    }

    setDragOver(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    if (event.dataTransfer?.files?.length) {
      uploadFiles(event.dataTransfer.files);
    }
  };

  // Download

  const download = async (file) => {
    if (!file?.id) return;

    try {
      toast.loading('Generating download link…', {
        id: 'vault-download',
      });

      const { url } = await vaultApi.download(file.id);

      if (!url) {
        throw new Error('Download URL was not returned');
      }

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.file_name;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      toast.success('Download started', {
        id: 'vault-download',
      });
    } catch (error) {
      toast.error(error?.message || 'Could not generate download link', {
        id: 'vault-download',
      });
    }
  };

  // Delete

  const remove = useMutation({
    mutationFn: (id) => vaultApi.remove(id),

    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['vault'] });
      toast.success('File deleted successfully');
      setDetailsFile(null);
      setPreviewFile(null);
    },

    onError: (error) => {
      toast.error(error?.message || 'Could not delete file');
    },
  });

  const handleRemove = async (file) => {
    if (!file || remove.isPending) return;

    const ok = await confirm({
      title: 'Delete file permanently?',
      description: `"${file.file_name}" (${bytesToHuman(file.size_bytes)}) will be permanently removed from your vault. This cannot be undone.`,
      confirmText: 'Delete permanently',
      danger: true,
    });

    if (ok) remove.mutate(file.id);
  };

  // Preview

  const openPreview = async (file) => {
    if (!file?.id || previewLoadingId) return;

    setPreviewLoadingId(file.id);

    try {
      const { url } = await vaultApi.download(file.id);

      if (!url) {
        throw new Error('Preview URL was not returned');
      }

      setPreviewFile({ ...file, url });
    } catch (error) {
      toast.error(error?.message || 'Could not load file preview');
    } finally {
      setPreviewLoadingId(null);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div
      ref={dropRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative isolate min-h-full overflow-hidden"
      
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${lavenderBg}")` }}
      />

      {/* Transparent overlay */}
      <div className="absolute inset-0 z-0 bg-white/20 dark:bg-black/20" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Drag overlay */}
        {dragOver && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#6240C8] bg-white/65 backdrop-blur-sm dark:bg-black/60">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-900">
                <Upload size={28} className="text-[#6240C8]" />
              </div>

              <p className="text-lg font-semibold text-[#10123D] dark:text-white">
                Drop files to upload
              </p>

              <p className="mt-1 text-sm text-[#51418F] dark:text-gray-300">
                PDF, DOCX, XLSX, PPTX, TXT and images
              </p>

              <p className="mt-1 text-xs text-[#81749D] dark:text-gray-400">
                Maximum 25 MB per file
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D8FF] bg-white/85 shadow-sm dark:border-white/10 dark:bg-gray-900/80">
                <Lock size={19} className="text-[#6240C8]" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider text-[#6240C8] dark:text-purple-300">
                Personal storage
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#10123D] dark:text-white sm:text-3xl">
              Private Vault
            </h1>

            <p className="mt-1 text-sm text-[#51418F] dark:text-gray-300">
              Keep your important documents and files securely organized.
            </p>

            <p className="mt-2 text-xs text-[#81749D] dark:text-gray-400">
              {(data?.items || []).length} files
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
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg,.csv,.md,.rtf"
              multiple
            />

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw
                size={15}
                className={isFetching ? 'animate-spin' : ''}
              />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Button
              onClick={() => fileRef.current?.click()}
              loading={uploading}
              disabled={uploading}
            >
              <Upload size={15} />
              Upload files
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={HardDrive}
            label="Total files"
            value={(data?.items || []).length}
          />

          <StatCard
            icon={FileType}
            label="Storage used"
            value={bytesToHuman(totalSize)}
          />

          <StatCard
            icon={FileImage}
            label="Images"
            value={filterCounts.image}
          />

          <StatCard
            icon={FileText}
            label="Documents"
            value={filterCounts.pdf + filterCounts.doc}
          />
        </div>

        {/* Search and view controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#81749D]"
            />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search files by name..."
              className="pl-10"
            />
          </div>

          <div className="flex w-fit items-center rounded-xl border border-[#E8D8FF] bg-white/75 p-1 dark:border-white/10 dark:bg-gray-900/75">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'rounded-lg p-2 transition-all',
                view === 'list'
                  ? 'bg-[#6240C8] text-white shadow-sm'
                  : 'text-[#81749D] hover:bg-[#F2EBFF] dark:hover:bg-white/10'
              )}
              aria-label="List view"
              title="List view"
            >
              <ListIcon size={17} />
            </button>

            <button
              type="button"
              onClick={() => setView('grid')}
              className={cn(
                'rounded-lg p-2 transition-all',
                view === 'grid'
                  ? 'bg-[#6240C8] text-white shadow-sm'
                  : 'text-[#81749D] hover:bg-[#F2EBFF] dark:hover:bg-white/10'
              )}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All', count: filterCounts.all },
            { id: 'pdf', label: 'PDFs', count: filterCounts.pdf },
            { id: 'doc', label: 'Documents', count: filterCounts.doc },
            { id: 'sheet', label: 'Sheets', count: filterCounts.sheet },
            { id: 'slides', label: 'Slides', count: filterCounts.slides },
            { id: 'image', label: 'Images', count: filterCounts.image },
            { id: 'text', label: 'Text', count: filterCounts.text },
            { id: 'other', label: 'Other', count: filterCounts.other },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                activeFilter === filter.id
                  ? 'border-[#6240C8] bg-[#6240C8] text-white shadow-sm'
                  : 'border-[#E8D8FF] bg-white/75 text-[#51418F] hover:border-[#BFA8EE] hover:bg-white dark:border-white/10 dark:bg-gray-900/75 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              {filter.label}

              <span
                className={cn(
                  'ml-1.5',
                  activeFilter === filter.id
                    ? 'text-white/80'
                    : 'text-[#9586B0] dark:text-gray-400'
                )}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Upload queue */}
        {uploadQueue.length > 0 && (
          <div className="mb-5 space-y-2">
            {uploadQueue.map((entry) => (
              <UploadProgressCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Files */}
        {files.length === 0 ? (
          <div className="rounded-[22px] border border-[#E8D8FF] bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/85">
            <EmptyState
              icon={Lock}
              title={search ? 'No matching files' : 'Vault is empty'}
              description={
                search
                  ? `No files match "${search}". Try a different search.`
                  : 'Drag and drop files here, or click Upload to add your first file.'
              }
              action={
                !search && (
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
                onPreview={() => openPreview(file)}
                onDetails={() => setDetailsFile(file)}
                onDownload={() => download(file)}
                onDelete={() => handleRemove(file)}
                previewLoading={previewLoadingId === file.id}
                deleting={remove.isPending && remove.variables === file.id}
                deleteDisabled={remove.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {files.map((file) => (
              <FileTile
                key={file.id}
                file={file}
                onPreview={() => openPreview(file)}
                onDetails={() => setDetailsFile(file)}
                onDownload={() => download(file)}
                onDelete={() => handleRemove(file)}
                previewLoading={previewLoadingId === file.id}
                deleting={remove.isPending && remove.variables === file.id}
                deleteDisabled={remove.isPending}
              />
            ))}
          </div>
        )}

        {/* Preview dialog */}
        <Dialog
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          title={previewFile?.file_name || 'File preview'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setPreviewFile(null)}>
                Close
              </Button>

              {previewFile && (
                <Button onClick={() => download(previewFile)}>
                  <Download size={14} />
                  Download
                </Button>
              )}
            </>
          }
        >
          {previewFile && (
            <div className="space-y-4">
              {isImageFile(previewFile) && (
                <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl2 border border-[#E8D8FF] bg-white/70 p-3 dark:border-white/10 dark:bg-gray-800 sm:min-h-[420px]">
                  <img
                    src={previewFile.url}
                    alt={previewFile.file_name}
                    className="max-h-[65vh] max-w-full rounded-lg object-contain"
                    onError={() => toast.error('Could not load image preview')}
                  />
                </div>
              )}

              {isPdfFile(previewFile) && (
                <div className="overflow-hidden rounded-xl2 border border-[#E8D8FF] dark:border-white/10">
                  <iframe
                    src={`${previewFile.url}#toolbar=1&navpanes=0`}
                    title={previewFile.file_name}
                    className="h-[65vh] min-h-[400px] w-full bg-white"
                  />
                </div>
              )}

              {!isImageFile(previewFile) && !isPdfFile(previewFile) && (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl2 border border-[#E8D8FF] bg-white/70 px-5 py-10 text-center dark:border-white/10 dark:bg-gray-800">
                  <div
                    className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-gray-900"
                    style={{
                      border: `1px solid ${getFileType(previewFile.file_name).color}30`,
                    }}
                  >
                    {fileIcon(previewFile.file_name, 44)}
                  </div>

                  <span
                    className="mb-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: getFileType(previewFile.file_name).color,
                      backgroundColor: `${getFileType(previewFile.file_name).color}12`,
                    }}
                  >
                    {getExtension(previewFile.file_name)} File
                  </span>

                  <h3 className="max-w-full break-all text-base font-semibold text-[#10123D] dark:text-white">
                    {previewFile.file_name}
                  </h3>

                  <p className="mt-2 max-w-sm text-sm text-[#81749D] dark:text-gray-400">
                    Preview rendering is not available for this file format yet.
                    Download the file to view its complete contents.
                  </p>

                  <Button
                    className="mt-5"
                    onClick={() => download(previewFile)}
                  >
                    <Download size={15} />
                    Download file
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E8D8FF] pt-3 text-xs text-[#81749D] dark:border-white/10 dark:text-gray-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{bytesToHuman(previewFile.size_bytes)}</span>
                  <span>·</span>
                  <span>{getFileType(previewFile.file_name).label}</span>
                </div>

                <span>Uploaded {formatDate(previewFile.created_at)}</span>
              </div>
            </div>
          )}
        </Dialog>

        {/* Details dialog */}
        <Dialog
          open={!!detailsFile}
          onClose={() => {
            if (!remove.isPending) setDetailsFile(null);
          }}
          title="File details"
          size="md"
          footer={
            <>
              <Button
                variant="ghost"
                disabled={remove.isPending}
                onClick={() => setDetailsFile(null)}
              >
                Close
              </Button>

              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => {
                  const file = detailsFile;
                  setDetailsFile(null);
                  openPreview(file);
                }}
              >
                <Eye size={14} />
                Preview
              </Button>

              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => detailsFile && download(detailsFile)}
              >
                <Download size={14} />
                Download
              </Button>

              <Button
                variant="danger"
                disabled={remove.isPending}
                onClick={() => detailsFile && handleRemove(detailsFile)}
              >
                {remove.isPending && remove.variables === detailsFile?.id ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}

                {remove.isPending && remove.variables === detailsFile?.id
                  ? 'Deleting...'
                  : 'Delete'}
              </Button>
            </>
          }
        >
          {detailsFile && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl2 border border-[#E8D8FF] bg-white/70 p-3 dark:border-white/10 dark:bg-gray-800">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl2 bg-white dark:bg-gray-900">
                  {fileIcon(detailsFile.file_name, 24)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-semibold text-[#10123D] dark:text-white">
                    {detailsFile.file_name}
                  </p>

                  <p className="mt-0.5 text-xs text-[#81749D] dark:text-gray-400">
                    {getFileType(detailsFile.file_name).label}
                  </p>
                </div>
              </div>

              <DetailRow
                icon={FileType}
                label="Type"
                value={detailsFile.mime_type}
              />

              <DetailRow
                icon={HardDrive}
                label="Size"
                value={bytesToHuman(detailsFile.size_bytes)}
              />

              {detailsFile.category && (
                <DetailRow
                  icon={FileText}
                  label="Category"
                  value={detailsFile.category}
                />
              )}

              <DetailRow
                icon={Calendar}
                label="Uploaded"
                value={formatDateTime(detailsFile.created_at)}
              />

              <DetailRow
                icon={Calendar}
                label="Updated"
                value={formatDateTime(detailsFile.updated_at)}
              />
            </div>
          )}
        </Dialog>
      </main>
    </div>
  );
}

// --------------------------------------------------
// Stat card
// --------------------------------------------------

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-[#E8D8FF] bg-white/85 p-4 shadow-[0_4px_18px_rgba(98,64,200,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(98,64,200,0.12)] dark:border-white/10 dark:bg-gray-900/85">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F2EBFF] text-[#6240C8] dark:bg-purple-500/15 dark:text-purple-300">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-[#81749D] dark:text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-lg font-semibold text-[#10123D] dark:text-white">
          {value}
        </p>
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
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl2 bg-[#F2EBFF] dark:bg-purple-500/15">
            {isError ? (
              <AlertCircle size={16} className="text-red-500" />
            ) : isDone ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Spinner size={14} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-text-main">
                {entry.fileName}
              </p>

              <span className="ml-2 whitespace-nowrap text-xs text-text-muted">
                {isError
                  ? 'Failed'
                  : isDone
                    ? 'Done'
                    : `${Math.round(entry.progress)}%`}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE2FA] dark:bg-white/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isError
                    ? 'bg-red-500'
                    : isDone
                      ? 'bg-green-500'
                      : 'bg-[#6240C8]'
                )}
                style={{
                  width: `${isError || isDone ? 100 : entry.progress}%`,
                }}
              />
            </div>

            {isError && (
              <p className="mt-1 text-xs text-red-500">{entry.error}</p>
            )}

            {!isError && !isDone && (
              <p className="mt-1 text-xs text-text-muted">
                {bytesToHuman(entry.size)}
              </p>
            )}
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

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['vault-cover', file.id],
    queryFn: () => vaultApi.download(file.id),
    enabled: imageFile,
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  const type = getFileType(file.file_name);
  const Icon = type.icon;

  if (imageFile && data?.url && !isError) {
    return (
      <img
        src={data.url}
        alt={file.file_name}
        loading="lazy"
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F7F3FF] dark:bg-gray-800',
        className
      )}
    >
      {isLoading && imageFile ? (
        <Spinner size={20} />
      ) : (
        <>
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-900"
            style={{ border: `1px solid ${type.color}25` }}
          >
            <Icon size={28} style={{ color: type.color }} />
          </div>

          <span
            className="rounded-md px-2 py-1 text-[9px] font-bold tracking-wider"
            style={{
              color: type.color,
              backgroundColor: `${type.color}12`,
            }}
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
  file,
  onPreview,
  onDetails,
  onDownload,
  onDelete,
  previewLoading,
  deleting,
  deleteDisabled,
}) {
  const type = getFileType(file.file_name);

  return (
    <Card className="group transition-all duration-200 hover:border-[#CBB8F2] hover:shadow-[0_6px_22px_rgba(98,64,200,0.10)]">
      <CardBody className="flex items-center gap-3 py-3 sm:gap-4">
        <button
          type="button"
          onClick={onPreview}
          disabled={previewLoading}
          className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl2 border border-[#E8D8FF] bg-[#F7F3FF] transition-all hover:border-[#BFA8EE] dark:border-white/10 dark:bg-gray-800"
          aria-label="Preview file"
          title="Preview file"
        >
          <FileCover file={file} />
        </button>

        <button
          type="button"
          onClick={onDetails}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          <p className="truncate text-sm font-medium text-[#10123D] dark:text-white">
            {file.file_name}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#81749D] dark:text-gray-400">
            <span>{type.shortLabel}</span>
            <span>·</span>
            <span>{bytesToHuman(file.size_bytes)}</span>
            <span>·</span>
            <span>{formatDate(file.created_at)}</span>

            {file.category && (
              <>
                <span>·</span>
                <span className="rounded-full bg-[#F2EBFF] px-2 py-0.5 text-[#6240C8] dark:bg-purple-500/15 dark:text-purple-300">
                  {file.category}
                </span>
              </>
            )}
          </div>
        </button>

        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreview}
            disabled={previewLoading}
            aria-label="Preview"
            title="Preview"
          >
            {previewLoading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDetails}
            aria-label="Details"
            title="Details"
          >
            <ChevronRight size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onDownload}
            aria-label="Download"
            title="Download"
          >
            <Download size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disabled={deleteDisabled}
            onClick={onDelete}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            aria-label="Delete"
            title="Delete"
          >
            {deleting ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
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
  file,
  onPreview,
  onDetails,
  onDownload,
  onDelete,
  previewLoading,
  deleting,
  deleteDisabled,
}) {
  const type = getFileType(file.file_name);

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBB8F2] hover:shadow-[0_8px_24px_rgba(98,64,200,0.12)]">
      <button
        type="button"
        onClick={onPreview}
        disabled={previewLoading}
        className="relative block aspect-square w-full overflow-hidden bg-[#F7F3FF] dark:bg-gray-800"
        aria-label="Open file preview"
      >
        <FileCover file={file} />

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {previewLoading ? (
            <LoaderCircle size={24} className="animate-spin text-white" />
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg">
              <Eye size={15} />
              Preview
            </div>
          )}
        </div>
      </button>

      <CardBody className="p-3">
        <button
          type="button"
          onClick={onDetails}
          className="w-full truncate text-left text-xs font-medium text-[#10123D] hover:text-[#6240C8] dark:text-white"
          title={file.file_name}
        >
          {file.file_name}
        </button>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#81749D] dark:text-gray-400">
            {bytesToHuman(file.size_bytes)}
          </span>

          <span
            className="truncate text-[10px] font-medium"
            style={{ color: type.color }}
          >
            {type.shortLabel}
          </span>
        </div>
      </CardBody>

      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDetails();
          }}
          className="rounded-lg bg-white/95 p-1.5 text-slate-800 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-gray-900/95 dark:text-white"
          aria-label="File details"
          title="Details"
        >
          <ExternalLink size={13} />
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDownload();
          }}
          className="rounded-lg bg-white/95 p-1.5 text-slate-800 shadow-sm backdrop-blur transition-colors hover:bg-white dark:bg-gray-900/95 dark:text-white"
          aria-label="Download"
          title="Download"
        >
          <Download size={13} />
        </button>

        <button
          type="button"
          disabled={deleteDisabled}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="rounded-lg bg-white/95 p-1.5 text-red-500 shadow-sm backdrop-blur transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900/95"
          aria-label="Delete"
          title="Delete"
        >
          {deleting ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </Card>
  );
}

// --------------------------------------------------
// File detail row
// --------------------------------------------------

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#EDE2FA] py-2.5 last:border-0 dark:border-white/10">
      <Icon size={14} className="flex-shrink-0 text-[#81749D] dark:text-gray-400" />

      <span className="w-24 flex-shrink-0 text-xs text-[#81749D] dark:text-gray-400">
        {label}
      </span>

      <span className="min-w-0 flex-1 break-all text-sm text-[#10123D] dark:text-white">
        {value || '—'}
      </span>
    </div>
  );
}
