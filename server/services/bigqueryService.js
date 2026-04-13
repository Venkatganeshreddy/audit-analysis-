import fs from 'fs';
import path from 'path';
import { BigQuery } from '@google-cloud/bigquery';
import { transformSemesterRow, transformAssessmentRow } from './transformers.js';

const env = globalThis.process?.env ?? {};
const DEFAULT_PROJECT_ID = 'kossip-helpers';
const DEFAULT_DATASET = 'contentbasesmetabase';
const DEFAULT_SEMESTER_TABLE = 'allusersquestionattemptdetailsforquestionsetunits';
const DEFAULT_ASSESSMENT_TABLE = 'allusersquestionattemptdetailsforquestionsetunits';

function parseTableReference(tableRef, defaultTable) {
  const fallback = {
    projectId: env.BQPROJECTID || DEFAULT_PROJECT_ID,
    dataset: env.BQDATASET || DEFAULT_DATASET,
    table: defaultTable,
  };

  if (!tableRef?.trim()) return fallback;

  const parts = tableRef.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 3) return { projectId: parts[0], dataset: parts[1], table: parts[2] };
  if (parts.length === 2) return { projectId: env.BQPROJECTID || DEFAULT_PROJECT_ID, dataset: parts[0], table: parts[1] };

  throw new Error('Table reference must use dataset.table or project.dataset.table format');
}

function resolveBigQueryOptions() {
  const credentialsJson = env.BQCREDENTIALSJSON?.trim();
  if (credentialsJson) return { credentials: JSON.parse(credentialsJson) };

  const credentialsFile = env.BQCREDENTIALSFILE || env.GOOGLEAPPLICATIONCREDENTIALS;
  if (!credentialsFile) return {};

  const resolvedPath = path.isAbsolute(credentialsFile)
    ? credentialsFile
    : path.resolve(credentialsFile);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`BigQuery credentials file not found: ${resolvedPath}`);
  }

  return { keyFilename: resolvedPath };
}

const semesterTableRef = parseTableReference(env.BQSEMESTERTABLE || env.BQTABLE, DEFAULT_SEMESTER_TABLE);
const assessmentTableRef = parseTableReference(env.BQASSESSMENTTABLE || env.BQTABLE, DEFAULT_ASSESSMENT_TABLE);

const projectId = env.BQPROJECTID || semesterTableRef.projectId;
const dataset = env.BQDATASET || semesterTableRef.dataset;

const semesterTable = `${semesterTableRef.projectId}.${semesterTableRef.dataset}.${semesterTableRef.table}`;
const assessmentTable = `${assessmentTableRef.projectId}.${assessmentTableRef.dataset}.${assessmentTableRef.table}`;

const bigquery = new BigQuery({
  projectId,
  ...resolveBigQueryOptions(),
});

function buildDateFilter(filters = {}) {
  const conditions = ['1=1'];
  const params = {};

  if (filters.startDate) {
    conditions.push('DATE(COALESCE(submissiondatetime, questionstartdatetime)) >= @startDate');
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    conditions.push('DATE(COALESCE(submissiondatetime, questionstartdatetime)) <= @endDate');
    params.endDate = filters.endDate;
  }

  return { whereClause: conditions.join(' AND '), params };
}

function getSessionTypeExpression() {
  return `CASE
    WHEN REGEXP_CONTAINS(LOWER(questionsettitle), r'assignment') THEN 'EXAM'
    WHEN REGEXP_CONTAINS(LOWER(questionsettitle), r'session') THEN 'LECTURE'
    ELSE 'PRACTICE'
  END`;
}

export async function testConnection() {
  const [rows] = await bigquery.query(`SELECT 1 AS test FROM \`${semesterTable}\` LIMIT 1`);
  return {
    connected: true,
    projectId,
    dataset,
    semesterTable: semesterTableRef.table,
    assessmentTable: assessmentTableRef.table,
    sample: rows,
  };
}

export async function fetchSemesterData(filters = {}) {
  const { whereClause, params } = buildDateFilter(filters);
  const sessionTypeExpression = getSessionTypeExpression();

  const sql = `
    SELECT
      shorttext AS course,
      questionsettitle AS institute,
      questiontype AS section,
      ${sessionTypeExpression} AS sessiontype,
      COUNT(DISTINCT questionid) AS sessions,
      COUNT(DISTINCT userid) AS students,
      ROUND(100 * SAFE_DIVIDE(COUNTIF(submissiondatetime IS NOT NULL OR evaluationresult IS NOT NULL), COUNT(*)), 2) AS completion,
      ROUND(AVG(COALESCE(CAST(timespent AS FLOAT64), 0)), 2) AS avgtime,
      APPROX_QUANTILES(COALESCE(CAST(timespent AS FLOAT64), 0), 100)[OFFSET(80)] AS p80time,
      CAST(NULL AS STRING) AS batch,
      CAST(NULL AS STRING) AS semester,
      CAST(MAX(DATE(COALESCE(submissiondatetime, questionstartdatetime))) AS STRING) AS reportdate
    FROM \`${semesterTable}\`
    WHERE ${whereClause}
    GROUP BY course, institute, section, sessiontype
    ORDER BY institute, section, course
  `;

  const [rows] = await bigquery.query({ query: sql, params });
  return rows.map(transformSemesterRow);
}

export async function fetchAssessmentData(filters = {}) {
  const { whereClause, params } = buildDateFilter(filters);

  const sql = `
    SELECT
      questionsettitle AS university,
      questiontype AS section,
      questionsettitle AS coursecode,
      COUNT(DISTINCT userid) AS avgparticipation,
      ROUND(AVG(COALESCE(SAFE_DIVIDE(userscore, NULLIF(actualscore, 0)), 0)), 4) AS avgscore,
      CAST(NULL AS STRING) AS batch,
      CAST(NULL AS STRING) AS semester,
      CAST(MAX(DATE(COALESCE(submissiondatetime, questionstartdatetime))) AS STRING) AS reportdate
    FROM \`${assessmentTable}\`
    WHERE ${whereClause}
    GROUP BY university, section, coursecode
    ORDER BY university, section
  `;

  const [rows] = await bigquery.query({ query: sql, params });
  return rows.map(transformAssessmentRow);
}

export async function executeCustomQuery(sql, params = {}) {
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed');
  }
  const [rows] = await bigquery.query({ query: sql, params });
  return rows;
}

export async function listTables() {
  const [tables] = await bigquery.dataset(dataset).getTables();
  return tables.map((t) => ({
    id: t.id,
    metadata: t.metadata,
    type: t.metadata.type,
    numRows: t.metadata.numRows,
    numBytes: t.metadata.numBytes,
  }));
}
