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

  const inputCls = [
    'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition',
    'border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15',
    'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/15',
  ].join(' ');

  return (
    <AnimatedView>
      <div className="ui-shell min-h-screen px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto w-full max-w-5xl">
          <div className="hero-panel mb-6 rounded-3xl p-6 sm:p-8 animate-fade-slide-up">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">NIAT Analytics</p>
                <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Audit and delivery workspace</h1>
                <p className="max-w-2xl text-sm text-slate-100/80 sm:text-base">
                  Load semester and assessment data, then move into a cleaner analysis workflow for universities, series, and course performance.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="dashboard-chip border-white/16 bg-white/10 text-white">Professional reporting</span>
                  <span className="dashboard-chip border-white/16 bg-white/10 text-white">CSV and BigQuery</span>
                </div>
              </div>

              <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="panel-surface rounded-2xl p-3">
                  <p className="section-title">Batch</p>
                  {hasDataColumns?.batch && filterOptions?.batches?.length > 0 ? (
                    <select
                      value={dynamicBatch}
                      onChange={(e) => setDynamicBatch(e.target.value)}
                      className={`${inputCls} mt-2 styled-select`}
                    >
                      {filterOptions.batches.map((batch) => (
                        <option key={batch} value={batch} className="text-gray-900">{batch}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className={`${inputCls} mt-2 styled-select`}
                    >
                      <option value="NIAT 24" className="text-gray-900">NIAT 24</option>
                      <option value="NIAT 25" className="text-gray-900">NIAT 25</option>
                      <option value="NIAT 26" className="text-gray-900">NIAT 26</option>
                    </select>
                  )}
                </div>

                <div className="panel-surface rounded-2xl p-3">
                  <p className="section-title">Semester</p>
                  {hasDataColumns?.semester && filterOptions?.semesters?.length > 0 ? (
                    <select
                      value={dynamicSemester}
                      onChange={(e) => setDynamicSemester(e.target.value)}
                      className={`${inputCls} mt-2 styled-select`}
                    >
                      {filterOptions.semesters.map((sem) => (
                        <option key={sem} value={sem} className="text-gray-900">{sem}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className={`${inputCls} mt-2 styled-select`}
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
                <label className="panel-surface rounded-2xl p-3">
                  <span className="section-title">Start date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`${inputCls} mt-2`}
                  />
                </label>
                <label className="panel-surface rounded-2xl p-3">
                  <span className="section-title">End date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`${inputCls} mt-2`}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="panel-surface mb-5 flex gap-2 rounded-2xl p-1.5">
            <button
              onClick={() => setDataSource('csv')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                dataSource === 'csv'
                  ? 'dashboard-button-primary'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
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
                  ? 'dashboard-button-primary'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              BigQuery
            </button>
          </div>

          {dataSource === 'bigquery' ? (
            <div className="panel-surface rounded-3xl p-6">
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
                  className="dashboard-button-secondary rounded-lg px-3 py-1 text-xs transition"
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
                    <div className="panel-muted rounded-xl p-3">
                      <p className="section-title">Project</p>
                      <p className="mt-1 truncate text-sm text-slate-800 dark:text-white">{connectionInfo.projectId}</p>
                    </div>
                    <div className="panel-muted rounded-xl p-3">
                      <p className="section-title">Dataset</p>
                      <p className="mt-1 truncate text-sm text-slate-800 dark:text-white">{connectionInfo.dataset}</p>
                    </div>
                    <div className="panel-muted rounded-xl p-3">
                      <p className="section-title">Table</p>
                      <p className="mt-1 truncate text-sm text-slate-800 dark:text-white">{connectionInfo.table || 'Configured via server'}</p>
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
                    ? 'dashboard-button-primary'
                    : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {bqLoading ? 'Fetching data...' : 'Fetch from BigQuery'}
              </button>
            </div>
          ) : (
            <>
              <div className="panel-surface mb-4 flex gap-2 rounded-2xl p-1.5">
                <button
                  onClick={() => setActiveUpload('semester')}
                  onMouseDown={addRipple}
                  className={`ripple-btn touch-target flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeUpload === 'semester'
                      ? 'dashboard-button-secondary'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Semester Report
                </button>
                <button
                  onClick={() => setActiveUpload('assessment')}
                  onMouseDown={addRipple}
                  className={`ripple-btn touch-target flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    activeUpload === 'assessment'
                      ? 'dashboard-button-secondary'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Assessment Data
                </button>
              </div>

              <div
                className={`panel-surface rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-10 ${
                  isDragging
                    ? 'scale-[1.01] border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-slate-300 hover:border-blue-400 dark:border-slate-700 dark:hover:border-blue-500'
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

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg dark:bg-slate-700">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>

                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
                  {activeUpload === 'semester' ? 'Upload Semester CSV' : 'Upload Assessment CSV'}
                </h3>
                <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
                  Drag and drop a file here, or browse from your system.
                </p>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  onMouseDown={addRipple}
                  className="ripple-btn touch-target dashboard-button-primary rounded-xl px-6 py-2.5 text-sm font-semibold transition"
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

              <div className="panel-surface mt-4 rounded-2xl p-4">
                <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className={`rounded-lg px-3 py-2 text-sm ${semesterFile ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'panel-muted text-slate-500 dark:text-slate-400'}`}>
                    Semester: {semesterFile || 'Not uploaded'}
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm ${assessmentFile ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'panel-muted text-slate-500 dark:text-slate-400'}`}>
                    Assessment: {assessmentFile || 'Not uploaded'}
                  </div>
                </div>

                <button
                  onClick={handleProceed}
                  onMouseDown={addRipple}
                  disabled={!semesterData}
                  className={`ripple-btn touch-target w-full rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
                    semesterData
                      ? 'dashboard-button-primary'
                      : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
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
