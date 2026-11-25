import React, { useState } from 'react';
import { FileText, Database, Activity, Upload, RefreshCw, Search } from 'lucide-react';
import { Card, Button, Alert } from '../components';
import { useDocuments } from '../context';

const DashboardPage = () => {
  const {
    documents,
    processingStatus,
    loading,
    error,
    loadDocuments,
    loadProcessingStatus,
    uploadDocument,
    syncDocuments,
    reindexDocuments,
    clearError,
  } = useDocuments();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setActionMessage(null);
        const res = await uploadDocument(file);
        setActionMessage(res?.message || `Uploaded "${file.name}".`);
        event.target.value = '';
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  };

  const handleSync = async () => {
    try {
      setActionMessage(null);
      const res = await syncDocuments();
      setActionMessage(res?.message || 'Document sync completed.');
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleReindex = async () => {
    try {
      setActionMessage(null);
      const res = await reindexDocuments();
      setActionMessage(res?.message || 'All documents reindexed.');
    } catch (err) {
      console.error('Reindex failed:', err);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadDocuments(), loadProcessingStatus()]);
  };

  const getStatusInfo = () => {
    const { total_documents, processed_chunks } = processingStatus;
    if (total_documents > 0 && processed_chunks > 0) {
      return { type: 'success', text: 'System Ready (Vector Index Active)' };
    }
    if (total_documents > 0) {
      return { type: 'warning', text: 'Documents Present (Pending Vector Indexing)' };
    }
    return { type: 'info', text: 'No Documents Loaded' };
  };

  const statusInfo = getStatusInfo();
  const filteredDocs = documents.filter((doc) =>
    doc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Knowledge Base Dashboard
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Manage agricultural PDFs, monitor Pinecone indexing, and sync new advisories.
          </p>
        </div>

        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={clearError}>
          {error}
        </Alert>
      )}

      {actionMessage && (
        <Alert type="success" onClose={() => setActionMessage(null)}>
          {actionMessage}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <Card.Content className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/15 border border-emerald-400/25 rounded-2xl">
              <FileText className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Total Documents
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {processingStatus.total_documents}
              </p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/15 border border-sky-400/25 rounded-2xl">
              <Database className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Indexed Chunks
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {processingStatus.processed_chunks}
              </p>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/15 border border-amber-400/25 rounded-2xl">
              <Activity className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                RAG Pipeline
              </p>
              <p className="text-sm sm:text-base font-semibold text-white truncate mt-0.5">
                {statusInfo.text}
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* System Status Banner */}
      <Alert type={statusInfo.type}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{statusInfo.text}</span>
          <span className="text-xs opacity-85">
            {processingStatus.total_documents} document(s) •{' '}
            {processingStatus.processed_chunks} vector chunk(s)
          </span>
        </div>
      </Alert>

      {/* Document Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Upload & Sync Documents</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Alert type="info">
              Upload PDF, Word, Markdown, or Text documents to expand the Kerala farming knowledge base.
            </Alert>

            <div className="border-2 border-dashed border-emerald-500/35 hover:border-emerald-400/60 transition-colors rounded-2xl p-6 text-center bg-slate-950/40">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="document-upload"
                disabled={loading}
              />
              <label
                htmlFor="document-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-emerald-300" />
                </div>
                <span className="text-sm font-medium text-white">
                  Choose a document to upload
                </span>
                <span className="text-xs text-slate-400">
                  PDF, DOC, DOCX, TXT, MD supported
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleSync}
                variant="outline"
                disabled={loading}
                loading={loading}
              >
                Sync New Documents
              </Button>
              <Button
                onClick={handleReindex}
                variant="primary"
                disabled={loading}
                loading={loading}
              >
                Reindex All
              </Button>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Card.Title>Knowledge Base Files ({documents.length})</Card.Title>
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-emerald-500/25 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </Card.Header>
          <Card.Content>
            {filteredDocs.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredDocs.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-950/50 border border-emerald-500/15 rounded-xl hover:border-emerald-400/35 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-slate-100 truncate">{doc}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 flex-shrink-0">
                      KB File
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-slate-300">
                  {documents.length === 0
                    ? 'No documents in knowledge base'
                    : 'No matching documents'}
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
