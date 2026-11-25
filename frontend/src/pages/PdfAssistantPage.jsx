import React, { useEffect, useState } from 'react';
import { FileText, Upload, Search, Sparkles, Download } from 'lucide-react';
import { Card, Button, Alert, SpeakButton } from '../components';
import { agriService } from '../services';
import { useMode } from '../context';

const PdfAssistantPage = () => {
  const { appLanguage, t } = useMode();
  const [docsInfo, setDocsInfo] = useState({ documents: [], total_documents: 0, total_chunks: 0 });
  const [selectedFile, setSelectedFile] = useState('');
  const [question, setQuestion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [qaResult, setQaResult] = useState(null);
  const [summaryResult, setSummaryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const loadList = async () => {
    try {
      const res = await agriService.pdfList();
      setDocsInfo(res);
      if (res.documents?.length && !selectedFile) {
        setSelectedFile(res.documents[0].filename);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await agriService.pdfUpload(file);
      setMsg(res.message);
      await loadList();
      setSelectedFile(file.name);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agriService.pdfSummarize(selectedFile, appLanguage);
      setSummaryResult(res);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await agriService.pdfAsk(question, appLanguage);
      setQaResult(res);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = await agriService.pdfSearch(searchQuery);
    setSearchMatches(res.matches || []);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-500" />
          {t('PDF & Knowledge Base Assistant (Local FAISS RAG)', 'PDF दस्तावेज़ और ज्ञान सहायक')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t(
            'Upload crop manuals or government PDFs, search inside them, summarize in Hindi, ask questions, and export PDF reports.',
            'कृषि PDF अपलोड करें, हिंदी में सारांश पाएं, प्रश्न पूछें और रिपोर्ट डाउनलोड करें।'
          )}
        </p>
      </div>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      {msg && <Alert type="success" onClose={() => setMsg(null)}>{msg}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Document Selector */}
        <Card className="space-y-4">
          <Card.Header>
            <Card.Title>{t('Documents', 'दस्तावेज़')} ({docsInfo.total_documents})</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-3">
            <label className="cursor-pointer w-full py-3 px-4 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 flex items-center justify-center gap-2 text-sm font-medium bg-emerald-500/5">
              <Upload className="w-4 h-4 text-emerald-500" />
              {t('Upload PDF / TXT / DOCX', 'दस्तावेज़ अपलोड करें')}
              <input type="file" accept=".pdf,.txt,.md,.doc,.docx" className="hidden" onChange={handleUpload} disabled={loading} />
            </label>

            <div className="text-xs text-slate-500">
              Indexed Vectors (FAISS): <strong>{docsInfo.total_chunks}</strong> chunks
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {docsInfo.documents?.map((d) => (
                <button
                  key={d.filename}
                  type="button"
                  onClick={() => setSelectedFile(d.filename)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex justify-between items-center border ${
                    selectedFile === d.filename
                      ? 'bg-emerald-500/20 border-emerald-500/40 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-950/50 border-transparent'
                  }`}
                >
                  <span className="truncate pr-2">{d.filename}</span>
                  <span className="text-[10px] opacity-75 flex-shrink-0">
                    {d.indexed ? `${d.chunks} chunks` : `${d.size_kb} KB`}
                  </span>
                </button>
              ))}
            </div>

            <Button onClick={handleSummarize} loading={loading} disabled={!selectedFile} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              {t(`Summarize in ${appLanguage}`, `${appLanguage} में सारांश बनाएं`)}
            </Button>
          </Card.Content>
        </Card>

        {/* Q&A + Search + Summary Output */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <Card.Header>
              <Card.Title>{t('Ask Questions from Uploaded Documents', 'दस्तावेज़ों से प्रश्न पूछें')}</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-4">
              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('Ask anything from your PDFs...', 'PDF से जुड़ा कोई भी सवाल पूछें...')}
                />
                <Button type="submit" loading={loading}>Ask</Button>
              </form>

              {qaResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SpeakButton text={qaResult.answer} language={appLanguage} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        agriService.downloadPdfReport('AgroSathi AI — Document Q&A Report', [
                          { heading: 'Question', body: qaResult.question },
                          { heading: 'Answer', body: qaResult.answer },
                        ])
                      }
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Export PDF
                    </Button>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap">
                    {qaResult.answer}
                  </div>
                  {qaResult.sources?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-500">Retrieved Sources:</p>
                      {qaResult.sources.map((s, idx) => (
                        <div key={idx} className="text-xs p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <strong>{s.source}</strong>: {s.content.slice(0, 180)}...
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          {summaryResult && (
            <Card>
              <Card.Header className="flex items-center justify-between">
                <Card.Title>Summary: {summaryResult.filename}</Card.Title>
                <div className="flex gap-2">
                  <SpeakButton text={summaryResult.summary} language={appLanguage} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      agriService.downloadPdfReport(`Summary - ${summaryResult.filename}`, [
                        { heading: 'Document Summary', body: summaryResult.summary },
                      ])
                    }
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Download PDF
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs sm:text-sm whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {summaryResult.summary}
                </div>
              </Card.Content>
            </Card>
          )}

          <Card>
            <Card.Header>
              <Card.Title>{t('Semantic Search Inside Documents', 'दस्तावेज़ों में खोजें')}</Card.Title>
            </Card.Header>
            <Card.Content className="space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keyword or topic..."
                />
                <Button type="submit" variant="outline">
                  <Search className="w-4 h-4 mr-1" /> Search
                </Button>
              </form>
              {searchMatches.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950/60 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-300">{m.source}</span>
                  <p className="mt-1">{m.content}</p>
                </div>
              ))}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PdfAssistantPage;
