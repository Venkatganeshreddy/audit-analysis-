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
  const [dataSource, setDataSource] = useState('csv');
  const fileInputRef = useRef(null);

  const {
    loading: bqLoading,
    error: bqError,
    connected,
    connectionInfo,
    testConnection,
    fetchData,
  } = useBigQuery();

  const filterOptions = useMemo(
    () => (parsedSemData ? extractFilterOptions(parsedSemData, parsedAssData) : null),
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
  }, [filterOptions, dynamicBatch, dynamicSemester, startDate, endDate]);

  const hasDataColumns = filterOptions?.hasDataColumns;

  const selectedBatchValue = hasDataColumns?.batch ? dynamicBatch : selectedBatch;
  const selectedSemesterValue = hasDataColumns?.semester ? dynamicSemester : selectedSemester;

  const handleProceed = () => {
    if (!semesterData) return;

    onFilesLoad(
      semesterData,
      semesterFile,
      assessmentRawData,
      assessmentFile,
      selectedSemesterValue,
      selectedBatchValue,
      {
        batch: hasDataColumns?.batch ? dynamicBatch : null,
        semester: hasDataColumns?.semester ? dynamicSemester : null,
        startDate: hasDataColumns?.date ? startDate : null,
        endDate: hasDataColumns?.date ? endDate : null,
        hasDataColumns: hasDataColumns || { batch: false, semester: false, date: false },
      }
    );
  };

  const inputCls =
    'w-full rounded-xl border border-white/15 bg-slate-950/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-300/30';

  return (
    <AnimatedView>
      <div className="ui-shell relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl" />
          <div className="absolute -right-16 top-8 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <div className="hero-panel mb-6 rounded-3xl p-6 sm:p-8 animate-fade-slide-up">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">NIAT Analytics</p>
                <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Audit Dashboard</h1>
                <p className="text-sm text-slate-200">Upload CSV files or fetch directly from BigQuery.</p>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
                <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-300">Batch</p>
                  {hasDataColumns?.batch && filterOptions?.batches?.length > 0 ? (
                    <select
                      value={dynamicBatch}
                      onChange={(e) => setDynamicBatch(e.target.value)}
                      className={`${inputCls} mt-1 !py-2 styled-select-dark`}
                    >
                      {filterOptions.batches.map((batch) => (
                        <option key={batch} value={batch} className="text-gray-900">{batch}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className={`${inputCls} mt-1 !py-2 styled-select-dark`}
                    >
                      <option value="NIAT 24" className="text-gray-900">NIAT 24</option>
                      <option value="NIAT 25" className="text-gray-900">NIAT 25</option>
                      <option value="NIAT 26" className="text-gray-900">NIAT 26</option>
                    </select>
                  )}
                </div>

                <div className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-300">Semester</p>
                  {hasDataColumns?.semester && filterOptions?.semesters?.length > 0 ? (
                    <select
                      value={dynamicSemester}
                      onChange={(e) => setDynamicSemester(e.target.value)}
                      className={`${inputCls} mt-1 !py-2 styled-select-dark`}
                    >
                      {filterOptions.semesters.map((sem) => (
                        <option key={sem} value={sem} className="text-gray-900">{sem}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className={`${inputCls} mt-1 !py-2 styled-select-dark`}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={`Semester ${n}`} className="text-gray-900">Semester {n}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {hasDataColumns?.date && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-300">Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-300">End date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="mb-5 flex gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-1.5 backdrop-blur-sm">
            <button
              onClick={() => setDataSource('csv')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                dataSource === 'csv'
                  ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-700/35'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              CSV Upload
            </button>
            <button
              onClick={() => {
                setDataSource('bigquery');
                testConnection();
              }}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                dataSource === 'bigquery'
                  ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-lg shadow-teal-700/35'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              BigQuery
            </button>
          </div>

          {dataSource === 'bigquery' ? (
            <div className="rounded-3xl border border-white/10 bg-slate-900/45 p-6 backdrop-blur-sm">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    connected === true
                      ? 'bg-emerald-400'
                      : connected === false
                        ? 'bg-red-400'
                        : 'bg-slate-400'
                  }`}
                />
                <p
                  className={`text-sm ${
                    connected === true
                      ? 'text-emerald-300'
                      : connected === false
                        ? 'text-red-300'
                        : 'text-slate-300'
                  }`}
                >
                  {connected === true
                    ? `Connected to ${connectionInfo?.projectId || 'BigQuery'}`
                    : connected === false
                      ? 'Not connected. Check server or credentials.'
                      : 'Checking connection...'}
                </p>
                <button
                  onClick={testConnection}
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  Retry
                </button>
              </div>

              {bqError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-sm text-red-200">
                  {bqError}
                </div>
              )}

              {connected === true && connectionInfo && (
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Project</p>
                    <p className="mt-1 truncate text-sm text-white">{connectionInfo.projectId}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Dataset</p>
                    <p className="mt-1 truncate text-sm text-white">{connectionInfo.dataset}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Table</p>
                    <p className="mt-1 truncate text-sm text-white">{connectionInfo.table || 'Configured via server'}</p>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  try {
                    const filters = {
                      batch: selectedBatchValue,
                      semester: selectedSemesterValue,
                      startDate: startDate || undefined,
                      endDate: endDate || undefined,
                    };

                    const { semesterData: semData, assessmentData: assData } = await fetchData(filters);

                    onBigQueryLoad(semData, assData, selectedSemesterValue, selectedBatchValue, {
                      ...filters,
                      hasDataColumns: hasDataColumns || { batch: false, semester: false, date: false },
                    });
                  } catch (err) {
                    // error is handled by hook state
                  }
                }}
                disabled={!connected || bqLoading}
                className={`w-full rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  connected && !bqLoading
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/40 hover:brightness-110'
                    : 'cursor-not-allowed bg-white/10 text-slate-500'
                }`}
              >
                {bqLoading ? 'Fetching data...' : 'Fetch from BigQuery'}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-1.5 backdrop-blur-sm">
                <button
                  onClick={() => setActiveUpload('semester')}
                  onMouseDown={addRipple}
                  className={`ripple-btn touch-target flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeUpload === 'semester'
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Semester Report
                </button>
                <button
                  onClick={() => setActiveUpload('assessment')}
                  onMouseDown={addRipple}
                  className={`ripple-btn touch-target flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeUpload === 'assessment'
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Assessment Data
                </button>
              </div>

              <div
                className={`rounded-3xl border-2 border-dashed bg-slate-900/45 p-8 text-center backdrop-blur-sm transition sm:p-10 ${
                  isDragging
                    ? 'scale-[1.01] border-teal-300 bg-teal-400/10'
                    : 'border-white/20 hover:border-teal-300/60 hover:bg-slate-900/60'
                }`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
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
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) processFile(e.target.files[0]);
                    e.target.value = '';
                  }}
                />

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-sky-600 shadow-lg shadow-slate-900/40">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                  {activeUpload === 'semester' ? 'Upload Semester CSV' : 'Upload Assessment CSV'}
                </h3>
                <p className="mb-5 text-sm text-slate-300">
                  Drag and drop here, or click to choose a file.
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  onMouseDown={addRipple}
                  className="ripple-btn touch-target rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/40 transition hover:brightness-110"
                >
                  Select CSV File
                </button>

                {((activeUpload === 'semester' && semesterFile) ||
                  (activeUpload === 'assessment' && assessmentFile)) && (
                  <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-200">
                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{activeUpload === 'semester' ? semesterFile : assessmentFile}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/45 p-4 backdrop-blur-sm">
                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className={`rounded-lg px-3 py-2 text-sm ${semesterFile ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-slate-400'}`}>
                    Semester: {semesterFile || 'Not uploaded'}
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm ${assessmentFile ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-slate-400'}`}>
                    Assessment: {assessmentFile || 'Not uploaded'}
                  </div>
                </div>

                <button
                  onClick={handleProceed}
                  onMouseDown={addRipple}
                  disabled={!semesterData}
                  className={`ripple-btn touch-target w-full rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
                    semesterData
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-slate-900/40 hover:brightness-110'
                      : 'cursor-not-allowed bg-white/10 text-slate-500'
                  }`}
                >
                  Proceed to Analysis
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AnimatedView>
  );
}
