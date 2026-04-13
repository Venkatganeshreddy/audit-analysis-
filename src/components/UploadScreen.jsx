import { useState, useMemo, useEffect, useRef } from 'react';
import AnimatedView from './ui/AnimatedView';
import { parseSemesterCSV } from '../utils/parseSemesterCSV';
import { parseAssessmentCSV } from '../utils/parseAssessmentCSV';
import { extractFilterOptions } from '../utils/filters';
import { addRipple } from '../utils/ripple';
import { useBigQuery } from '../hooks/useBigQuery';

export default function UploadScreen({ onFilesLoad, onBigQueryLoad }) {
  const [isDragging, setIsDragging] = useState(false);
  const [semesterFile, setSemesterFile] = useState(null);
  const [assessmentFile, setAssessmentFile] = useState(null);
  const [semesterData, setSemesterData] = useState(null);
  const [assessmentRawData, setAssessmentRawData] = useState(null);
  const [activeUpload, setActiveUpload] = useState('semester');
  const [selectedSemester, setSelectedSemester] = useState('Semester 1');
  const [selectedBatch, setSelectedBatch] = useState('NIAT 25');
  const [dynamicBatch, setDynamicBatch] = useState('');
  const [dynamicSemester, setDynamicSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [parsedSemData, setParsedSemData] = useState(null);
  const [parsedAssData, setParsedAssData] = useState(null);
  const [dataSource, setDataSource] = useState('csv'); // 'csv' | 'bigquery'
  const fileInputRef = useRef(null);

  const { loading: bqLoading, error: bqError, connected, connectionInfo, testConnection, fetchData } = useBigQuery();

  const filterOptions = useMemo(
    () => parsedSemData ? extractFilterOptions(parsedSemData, parsedAssData) : null,
    [parsedSemData, parsedAssData]
  );

  const processFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (activeUpload === 'semester') {
        setSemesterFile(file.name);
        setSemesterData(text);
        setParsedSemData(parseSemesterCSV(text));
      } else {
        setAssessmentFile(file.name);
        setAssessmentRawData(text);
        setParsedAssData(parseAssessmentCSV(text));
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (filterOptions?.batches?.length && !dynamicBatch) setDynamicBatch(filterOptions.batches[0]);
    if (filterOptions?.semesters?.length && !dynamicSemester) setDynamicSemester(filterOptions.semesters[0]);
    if (filterOptions?.minDate && !startDate) setStartDate(filterOptions.minDate);
    if (filterOptions?.maxDate && !endDate) setEndDate(filterOptions.maxDate);
  }, [filterOptions]);

  const handleProceed = () => {
    if (!semesterData) return;
    const hasColumns = filterOptions?.hasDataColumns;
    onFilesLoad(
      semesterData,
      semesterFile,
      assessmentRawData,
      assessmentFile,
      hasColumns?.semester ? dynamicSemester : selectedSemester,
      hasColumns?.batch ? dynamicBatch : selectedBatch,
      {
        batch: hasColumns?.batch ? dynamicBatch : null,
        semester: hasColumns?.semester ? dynamicSemester : null,
        startDate: hasColumns?.date ? startDate : null,
        endDate: hasColumns?.date ? endDate : null,
        hasDataColumns: hasColumns || { batch: false, semester: false, date: false },
      }
    );
  };

  const hasDataColumns = filterOptions?.hasDataColumns;

  return (
    <AnimatedView>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <div className="text-center mb-8 animate-fade-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mb-5 shadow-2xl shadow-indigo-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">NIAT Analytics</h1>
            <p className="text-indigo-300 text-sm mb-1">Audit &amp; Analysis Report Dashboard</p>
            <p className="text-indigo-400/60 text-xs mb-6">Powered by AI Intelligence Agent 🤖</p>

            {/* Batch + Semester selectors */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              {hasDataColumns?.batch && filterOptions.batches.length > 0 ? (
                <select
                  value={dynamicBatch}
                  onChange={(e) => setDynamicBatch(e.target.value)}
                  className="styled-select-dark w-full sm:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer backdrop-blur-sm transition-colors hover:bg-white/15 min-h-[44px]"
                >
                  {filterOptions.batches.map(b => (
                    <option key={b} value={b} className="text-gray-900">{b}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="styled-select-dark w-full sm:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer backdrop-blur-sm transition-colors hover:bg-white/15 min-h-[44px]"
                >
                  <option value="NIAT 24" className="text-gray-900">NIAT 24</option>
                  <option value="NIAT 25" className="text-gray-900">NIAT 25</option>
                  <option value="NIAT 26" className="text-gray-900">NIAT 26</option>
                </select>
              )}
              <span className="text-white/30 hidden sm:inline select-none">•</span>
              {hasDataColumns?.semester && filterOptions.semesters.length > 0 ? (
                <select
                  value={dynamicSemester}
                  onChange={(e) => setDynamicSemester(e.target.value)}
                  className="styled-select-dark w-full sm:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer backdrop-blur-sm transition-colors hover:bg-white/15 min-h-[44px]"
                >
                  {filterOptions.semesters.map(s => (
                    <option key={s} value={s} className="text-gray-900">{s}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="styled-select-dark w-full sm:w-auto bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer backdrop-blur-sm transition-colors hover:bg-white/15 min-h-[44px]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={`Semester ${n}`} className="text-gray-900">Semester {n}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Data Source Toggle */}
          <div className="flex gap-2 mb-5 bg-white/5 rounded-2xl p-1.5 backdrop-blur-sm border border-white/10">
            <button
              onClick={() => setDataSource('csv')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                dataSource === 'csv'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>CSV Upload</span>
              </div>
            </button>
            <button
              onClick={() => { setDataSource('bigquery'); testConnection(); }}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                dataSource === 'bigquery'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {connected === true && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                {connected === false && <span className="w-2 h-2 rounded-full bg-red-400" />}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>BigQuery</span>
              </div>
            </button>
          </div>

          {dataSource === 'bigquery' ? (
            <>
              {/* BigQuery UI */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                {/* Connection Status */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className={`w-3 h-3 rounded-full ${
                    connected === true ? 'bg-emerald-400 animate-pulse' :
                    connected === false ? 'bg-red-400' : 'bg-white/30'
                  }`} />
                  <span className={`text-sm font-medium ${
                    connected === true ? 'text-emerald-400' :
                    connected === false ? 'text-red-400' : 'text-white/50'
                  }`}>
                    {connected === true ? `Connected to ${connectionInfo?.projectId || 'BigQuery'}` :
                     connected === false ? 'Not connected — check server & credentials' :
                     'Checking connection...'}
                  </span>
                  <button onClick={testConnection} className="text-xs text-indigo-400 hover:text-indigo-300 underline">
                    Retry
                  </button>
                </div>

                {/* Error Display */}
                {bqError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    {bqError}
                  </div>
                )}

                {/* BigQuery Info */}
                {connected === true && connectionInfo && (
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-white/40 text-xs uppercase mb-1">Project</p>
                      <p className="text-white font-medium text-sm truncate">{connectionInfo.projectId}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-white/40 text-xs uppercase mb-1">Dataset</p>
                      <p className="text-white font-medium text-sm truncate">{connectionInfo.dataset}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-white/40 text-xs uppercase mb-1">Table</p>
                      <p className="text-white font-medium text-sm truncate">{connectionInfo.table || 'Configured via server'}</p>
                    </div>
                  </div>
                )}

                {/* Fetch Button */}
                <div className="text-center">
                  <button
                    onClick={async () => {
                      try {
                        const hasColumns = filterOptions?.hasDataColumns;
                        const filters = {
                          batch: hasColumns?.batch ? dynamicBatch : selectedBatch,
                          semester: hasColumns?.semester ? dynamicSemester : selectedSemester,
                          startDate: startDate || undefined,
                          endDate: endDate || undefined,
                        };
                        const { semesterData: semData, assessmentData: assData } = await fetchData(filters);
                        const selectedSem = hasColumns?.semester ? dynamicSemester : selectedSemester;
                        const selectedBat = hasColumns?.batch ? dynamicBatch : selectedBatch;
                        onBigQueryLoad(
                          semData,
                          assData,
                          selectedSem,
                          selectedBat,
                          { ...filters, hasDataColumns: hasColumns || { batch: false, semester: false, date: false } }
                        );
                      } catch (err) {
                        // error is already set in the hook
                      }
                    }}
                    disabled={!connected || bqLoading}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all text-sm ${
                      connected && !bqLoading
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {bqLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Fetching data...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                        Fetch from BigQuery
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* BigQuery status bar */}
              <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className={`flex items-center gap-2 text-sm ${connected === true ? 'text-emerald-400' : 'text-white/30'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected === true ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="truncate max-w-[180px]">Semester: {connected === true ? 'BigQuery' : 'Not connected'}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${connected === true ? 'text-emerald-400' : 'text-white/30'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connected === true ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="truncate max-w-[180px]">Assessment: {connected === true ? 'BigQuery' : 'Not connected'}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-medium px-4 py-2 rounded-xl ${
                    connected === true ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-white/30'
                  }`}>
                    {connected === true ? 'Ready to fetch' : connected === false ? 'Connection failed' : 'Connecting...'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Upload type tabs */}
              <div className="flex gap-2 mb-5 bg-white/5 rounded-2xl p-1.5 backdrop-blur-sm border border-white/10">
                <button
                  onClick={() => setActiveUpload('semester')}
                  onMouseDown={addRipple}
                  className={`ripple-btn touch-target flex-1 py-3 px-3 sm:px-4 rounded-xl font-medium transition-all ${
                    activeUpload === 'semester'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {semesterFile && (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-sm sm:text-base">Semester Report</span>
                    <span className="text-xs opacity-60 hidden sm:inline">(Required)</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveUpload('assessment')}
                  onMouseDown={addRipple}
                  className={`ripple-btn touch-target flex-1 py-3 px-3 sm:px-4 rounded-xl font-medium transition-all ${
                    activeUpload === 'assessment'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {assessmentFile && (
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-sm sm:text-base">Assessment Data</span>
                    <span className="text-xs opacity-60 hidden sm:inline">(Optional)</span>
                  </div>
                </button>
              </div>

              {/* Drop zone */}
              <div
                className={`relative bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]'
                    : 'border-white/20 hover:border-indigo-400/60 hover:bg-white/[0.08]'
                }`}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files[0]) processFile(e.target.files[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                  <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activeUpload === 'semester' ? 'Upload Semester Report CSV' : 'Upload Assessment CSV'}
                </h3>
                <p className="text-white/50 text-sm mb-4">
                  {activeUpload === 'semester'
                    ? 'Contains course, institute, section, session data'
                    : 'Contains university, section, course scores & participation'}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  onMouseDown={addRipple}
                  className="ripple-btn touch-target px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 text-sm"
                >
                  Select CSV File
                </button>
                {((activeUpload === 'semester' && semesterFile) || (activeUpload === 'assessment' && assessmentFile)) && (
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium border border-emerald-500/30 animate-fade-in">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate max-w-[200px] sm:max-w-none">
                      {activeUpload === 'semester' ? semesterFile : assessmentFile}
                    </span>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="mt-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <div className={`flex items-center gap-2 text-sm ${semesterFile ? 'text-emerald-400' : 'text-white/30'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${semesterFile ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="truncate max-w-[180px]">Semester: {semesterFile || 'Not uploaded'}</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${assessmentFile ? 'text-emerald-400' : 'text-white/30'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${assessmentFile ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <span className="truncate max-w-[180px]">Assessment: {assessmentFile || 'Not uploaded'}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleProceed}
                    onMouseDown={addRipple}
                    disabled={!semesterData}
                    className={`ripple-btn touch-target w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
                      semesterData
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/30'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Proceed →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatedView>
  );
}
