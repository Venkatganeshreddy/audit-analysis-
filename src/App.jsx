import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from './context/ThemeContext';
import { parseSemesterCSV } from './utils/parseSemesterCSV';
import { parseAssessmentCSV } from './utils/parseAssessmentCSV';
import { applyFilters } from './utils/filters';
import { calculateSeriesData } from './utils/calculations';
import AnimatedView from './components/ui/AnimatedView';
import ScrollToTop from './components/ui/ScrollToTop';
import NavButtons from './components/ui/NavButtons';
import UploadScreen from './components/UploadScreen';
import AnalysisSelector from './components/AnalysisSelector';
import SeriesOverview from './components/SeriesOverview';
import SeriesDetail from './components/SeriesDetail';
import UniversityDetail from './components/UniversityDetail';
import AgentSidebar from './components/AgentSidebar';

export default function App() {
  const { isDark } = useTheme();

  // ─── State ───
  const [rawSemesterData, setRawSemesterData] = useState(null);
  const [rawAssessmentData, setRawAssessmentData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [view, setView] = useState('upload');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [semester, setSemester] = useState('Semester 1');
  const [batch, setBatch] = useState('NIAT 25');
  const [filters, setFilters] = useState(null);
  const [agentOpen, setAgentOpen] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  // ─── Computed data ───
  const data = useMemo(() => {
    if (!rawSemesterData) return null;
    if (!filters) return rawSemesterData;
    return applyFilters(rawSemesterData, filters, 'semester');
  }, [rawSemesterData, filters]);

  const assessmentData = useMemo(() => {
    if (!rawAssessmentData) return null;
    if (!filters) return rawAssessmentData;
    return applyFilters(rawAssessmentData, filters, 'assessment');
  }, [rawAssessmentData, filters]);

  const seriesData = useMemo(
    () => data ? calculateSeriesData(data, assessmentData, analysisType, semester) : null,
    [data, assessmentData, analysisType, semester]
  );

  // ─── Smooth view transition ───
  const switchView = useCallback((fn) => {
    setTransitioning(true);
    setTimeout(() => {
      fn();
      setTransitioning(false);
    }, 120);
  }, []);

  // ─── Handlers ───
  const handleLoad = (semText, semName, assText, assName, selectedSemester, selectedBatch, filterConfig) => {
    const parsed = parseSemesterCSV(semText);
    if (parsed.length) {
      setRawSemesterData(parsed);
      setFileName(semName);
      setSemester(selectedSemester);
      setBatch(selectedBatch);
      setFilters(filterConfig);
      setView('select-analysis');
      if (assText) {
        const assParsed = parseAssessmentCSV(assText);
        if (assParsed.length) setRawAssessmentData(assParsed);
      }
    } else {
      alert('Could not parse semester CSV.');
    }
  };

  const handleBigQueryLoad = useCallback((semesterData, assessmentData, selectedSemester, selectedBatch, filterConfig) => {
    if (semesterData && semesterData.length) {
      setRawSemesterData(semesterData);
      setFileName('BigQuery');
      setSemester(selectedSemester);
      setBatch(selectedBatch);
      setFilters(filterConfig);
      setView('select-analysis');
      if (assessmentData?.length) setRawAssessmentData(assessmentData);
    } else {
      alert('No summary data returned from BigQuery.');
    }
  }, []);

  const handleReset = () => {
    setRawSemesterData(null);
    setRawAssessmentData(null);
    setFileName('');
    setView('upload');
    setSelectedSeries(null);
    setSelectedUniversity(null);
    setAnalysisType(null);
    setSemester('Semester 1');
    setBatch('NIAT 25');
    setFilters(null);
    setAgentOpen(true);
  };

  // ─── Upload screen ───
  if (view === 'upload' || !rawSemesterData) {
    return <UploadScreen onFilesLoad={handleLoad} onBigQueryLoad={handleBigQueryLoad} />;
  }

  // ─── Loading transition overlay ───
  if (transitioning) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Loading view…</p>
        </div>
      </div>
    );
  }

  // ─── Analysis selector ───
  if (view === 'select-analysis') {
    return (
      <AnalysisSelector
        semester={semester}
        batch={batch}
        onSelectDesign={() => switchView(() => { setAnalysisType('design'); setView('overview'); })}
        onSelectDelivery={() => switchView(() => { setAnalysisType('delivered'); setView('overview'); })}
        onBack={handleReset}
      />
    );
  }

  // ─── Series overview ───
  if (view === 'overview') {
    return (
      <div>
        <NavButtons
          onSwitchView={() => switchView(() => setView('select-analysis'))}
          onReset={handleReset}
        />
        <SeriesOverview
          seriesData={seriesData}
          onSelectSeries={(s) => switchView(() => { setSelectedSeries(s); setView('series'); })}
          analysisType={analysisType}
          semester={semester}
          batch={batch}
          filters={filters}
        />
        <AgentSidebar
          seriesData={seriesData}
          data={data}
          assessmentData={assessmentData}
          semester={semester}
          isOpen={agentOpen}
          onToggle={() => setAgentOpen(!agentOpen)}
        />
      </div>
    );
  }

  // ─── Series detail ───
  if (view === 'series' && selectedSeries) {
    return (
      <div>
        <NavButtons
          onSwitchView={() => switchView(() => setView('select-analysis'))}
          onReset={handleReset}
        />
        <SeriesDetail
          seriesName={selectedSeries}
          seriesData={seriesData}
          onBack={() => switchView(() => setView('overview'))}
          onSelectUniversity={(u) => switchView(() => { setSelectedUniversity(u); setView('university'); })}
          analysisType={analysisType}
          semester={semester}
        />
        <AgentSidebar
          seriesData={seriesData}
          data={data}
          assessmentData={assessmentData}
          semester={semester}
          isOpen={agentOpen}
          onToggle={() => setAgentOpen(!agentOpen)}
        />
      </div>
    );
  }

  // ─── University detail ───
  if (view === 'university' && selectedUniversity) {
    return (
      <div>
        <NavButtons
          onSwitchView={() => switchView(() => setView('select-analysis'))}
          onReset={handleReset}
        />
        <UniversityDetail
          data={data}
          assessmentData={assessmentData}
          selectedInstitute={selectedUniversity}
          onBack={() => switchView(() => setView('series'))}
          onReset={handleReset}
          semester={semester}
        />
        <AgentSidebar
          seriesData={seriesData}
          data={data}
          assessmentData={assessmentData}
          semester={semester}
          isOpen={agentOpen}
          onToggle={() => setAgentOpen(!agentOpen)}
        />
      </div>
    );
  }

  return null;
}
