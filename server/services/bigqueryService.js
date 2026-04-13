import fs from 'fs';
import path from 'path';
import { BigQuery } from '@google-cloud/bigquery';
import { transformSemesterRow, transformAssessmentRow } from './transformers.js';

const env = globalThis.process?.env ?? {};
const DEFAULT_PROJECT_ID = 'kossip-helpers';
const DEFAULT_DATASET = 'content_bases_metabase';
const DEFAULT_TABLE = 'all_users_question_attempt_details_for_question_set_units';

function parseTableReference(tableRef) {
  const fallback = {
    projectId: env.BQ_PROJECT_ID || DEFAULT_PROJECT_ID,
    dataset: env.BQ_DATASET || DEFAULT_DATASET,
    table: env.BQ_SEMESTER_TABLE || env.BQ_ASSESSMENT_TABLE || DEFAULT_TABLE,
  };

  if (!tableRef?.trim()) return fallback;

  const parts = tableRef.split('.').map(part => part.trim()).filter(Boolean);
  if (parts.length === 3) {
    return { projectId: parts[0], dataset: parts[1], table: parts[2] };
  }
  if (parts.length === 2) {
    return {
      projectId: env.BQ_PROJECT_ID || DEFAULT_PROJECT_ID,
      dataset: parts[0],
      table: parts[1],
    };
  }

  throw new Error('BQ_TABLE must use dataset.table or project.dataset.table format');
}

function resolveBigQueryOptions() {
  const credentialsJson = env.BQ_CREDENTIALS_JSON?.trim();
  if (credentialsJson) {
    return { credentials: JSON.parse(credentialsJson) };
  }

  const credentialsFile = env.BQ_CREDENTIALS_FILE || env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsFile) return {};

  const resolvedPath = path.isAbsolute(credentialsFile)
    ? credentialsFile
    : path.resolve(credentialsFile);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`BigQuery credentials file not found: ${resolvedPath}`);
  }

  return { keyFilename: resolvedPath };
}

const tableRef = parseTableReference(env.BQ_TABLE);
const projectId = env.BQ_PROJECT_ID || tableRef.projectId;
const dataset = env.BQ_DATASET || tableRef.dataset;
const table = env.BQ_TABLE_NAME || tableRef.table;
const fullyQualifiedTable = `\`${projectId}.${dataset}.${table}\``;

const bigquery = new BigQuery({
  projectId,
  ...resolveBigQueryOptions(),
});

function buildDateFilter(filters = {}) {
  const conditions = ['1=1'];
  const params = {};

  if (filters.startDate) {
    conditions.push('DATE(COALESCE(submission_datetime, question_start_datetime)) >= @startDate');
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    conditions.push('DATE(COALESCE(submission_datetime, question_start_datetime)) <= @endDate');
    params.endDate = filters.endDate;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
}

function getSessionTypeExpression() {
  return `
    CASE
      WHEN REGEXP_CONTAINS(LOWER(question_set_title), r'assignment') THEN 'EXAM'
      WHEN REGEXP_CONTAINS(LOWER(question_set_title), r'session') THEN 'LECTURE'
      ELSE 'PRACTICE'
    END
  `;
}

export async function testConnection() {
  await bigquery.query(`SELECT 1 AS test FROM ${fullyQualifiedTable} LIMIT 1`);
  return {
    connected: true,
    projectId,
    dataset,
    table,
  };
}

export async function fetchSemesterData(filters = {}) {
  const { whereClause, params } = buildDateFilter(filters);
  const sessionTypeExpression = getSessionTypeExpression();
  const sql = `
    SELECT
      short_text AS course,
      question_set_title AS institute,
      question_type AS section,
      ${sessionTypeExpression} AS session_type,
      COUNT(DISTINCT question_id) AS sessions,
      COUNT(DISTINCT user_id) AS students,
      ROUND(100 * SAFE_DIVIDE(
        COUNTIF(submission_datetime IS NOT NULL OR evaluation_result IS NOT NULL),
        COUNT(*)
      ), 2) AS completion,
      ROUND(AVG(COALESCE(CAST(time_spent AS FLOAT64), 0)), 2) AS avg_time,
      APPROX_QUANTILES(COALESCE(CAST(time_spent AS FLOAT64), 0), 100)[OFFSET(80)] AS p80_time,
      CAST(NULL AS STRING) AS batch,
      CAST(NULL AS STRING) AS semester,
      CAST(MAX(DATE(COALESCE(submission_datetime, question_start_datetime))) AS STRING) AS report_date
    FROM ${fullyQualifiedTable}
    WHERE ${whereClause}
    GROUP BY course, institute, section, session_type
    ORDER BY institute, section, course
  `;

  const [rows] = await bigquery.query({ query: sql, params });
  return rows.map(transformSemesterRow);
}

export async function fetchAssessmentData(filters = {}) {
  const { whereClause, params } = buildDateFilter(filters);
  const sql = `
    SELECT
      question_set_title AS university,
      question_type AS section,
      question_set_title AS course_code,
      COUNT(DISTINCT user_id) AS avg_participation,
      ROUND(AVG(COALESCE(SAFE_DIVIDE(user_score, NULLIF(actual_score, 0)), 0)), 4) AS avg_score,
      CAST(NULL AS STRING) AS batch,
      CAST(NULL AS STRING) AS semester,
      CAST(MAX(DATE(COALESCE(submission_datetime, question_start_datetime))) AS STRING) AS report_date
    FROM ${fullyQualifiedTable}
    WHERE ${whereClause}
    GROUP BY university, section, course_code
    ORDER BY university, section
  `;

  const [rows] = await bigquery.query({ query: sql, params });
  return rows.map(transformAssessmentRow);
}

export async function executeCustomQuery(sql, params = {}) {
  // Safety: only allow SELECT queries
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed');
  }
  const [rows] = await bigquery.query({ query: sql, params });
  return rows;
}

export async function listTables() {
  const [tables] = await bigquery.dataset(dataset).getTables();
  return tables.map(t => ({
    id: t.id,
    metadata: {
      type: t.metadata.type,
      numRows: t.metadata.numRows,
      numBytes: t.metadata.numBytes,
    },
  }));
}
