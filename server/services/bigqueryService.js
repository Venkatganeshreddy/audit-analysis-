import fs from 'fs';
import path from 'path';
import { BigQuery } from '@google-cloud/bigquery';
import { transformSemesterRow, transformAssessmentRow } from './transformers.js';
import { SEMESTER_DATES_BY_SEMESTER } from '../../src/constants/semesterDates.js';

const env = globalThis.process?.env ?? {};
const DEFAULT_PROJECT_ID = 'kossip-helpers';
const DEFAULT_DATASET = 'content_bases_metabase';
const DEFAULT_SEMESTER_TABLE = 'all_users_question_attempt_details_for_question_set_units';
const DEFAULT_ASSESSMENT_TABLE = 'all_users_question_attempt_details_for_question_set_units';
const DEFAULT_USERS_TABLE = 'niat_and_intensive_offline_users_details';
const DEFAULT_CONTENT_TABLE = 'content_all_products_unit_wise_content_hierarchy_details';

function getEnv(...keys) {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseTableReference(tableRef, defaultTable) {
  const fallback = {
    projectId: getEnv('BQ_PROJECT_ID', 'BQPROJECTID') || DEFAULT_PROJECT_ID,
    dataset: getEnv('BQ_DATASET', 'BQDATASET') || DEFAULT_DATASET,
    table: defaultTable,
  };

  if (!tableRef) return fallback;

  const parts = tableRef.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 3) {
    return { projectId: parts[0], dataset: parts[1], table: parts[2] };
  }
  if (parts.length === 2) {
    return {
      projectId: fallback.projectId,
      dataset: parts[0],
      table: parts[1],
    };
  }
  if (parts.length === 1) {
    return {
      projectId: fallback.projectId,
      dataset: fallback.dataset,
      table: parts[0],
    };
  }

  throw new Error('Table reference must use table, dataset.table, or project.dataset.table format');
}

function resolveBigQueryOptions() {
  const credentialsJson = getEnv('BQ_CREDENTIALS_JSON', 'BQCREDENTIALSJSON');
  if (credentialsJson) return { credentials: JSON.parse(credentialsJson) };

  const credentialsFile = getEnv(
    'BQ_CREDENTIALS_FILE',
    'BQCREDENTIALSFILE',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLEAPPLICATIONCREDENTIALS',
  );
  if (!credentialsFile) return {};

  const resolvedPath = path.isAbsolute(credentialsFile)
    ? credentialsFile
    : path.resolve(process.cwd(), credentialsFile);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`BigQuery credentials file not found: ${resolvedPath}`);
  }

  return { keyFilename: resolvedPath };
}

function formatTableReference({ projectId, dataset, table }) {
  return `\`${projectId}.${dataset}.${table}\``;
}

function toIsoDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

function shiftIsoDate(isoDate, yearDelta = 0) {
  if (!isoDate || yearDelta === 0) return isoDate;
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${String(year + yearDelta).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function shouldApplyBatchFilter(batch) {
  if (!batch?.trim()) return false;
  return !/^niat\s+\d+$/i.test(batch.trim());
}

function getBatchYearShift(batch) {
  const match = batch?.trim().match(/^niat\s+(\d{2})$/i);
  if (!match) return 0;
  return Number(match[1]) - 25;
}

function buildSemesterWindowClause(semester, batch, instituteExpr, dateExpr, params) {
  const windows = SEMESTER_DATES_BY_SEMESTER[semester];
  if (!windows) return '';
  const yearShift = getBatchYearShift(batch);

  const clauses = Object.entries(windows)
    .map(([instituteName, { start, end }], index) => {
      const startDate = shiftIsoDate(toIsoDate(start), yearShift);
      const endDate = shiftIsoDate(toIsoDate(end), yearShift);
      if (!startDate || !endDate) return null;

      const instituteKey = `semesterInstitute${index}`;
      const startKey = `semesterStart${index}`;
      const endKey = `semesterEnd${index}`;

      params[instituteKey] = instituteName.toLowerCase();
      params[startKey] = startDate;
      params[endKey] = endDate;

      return `(LOWER(${instituteExpr}) = @${instituteKey} AND ${dateExpr} BETWEEN @${startKey} AND @${endKey})`;
    })
    .filter(Boolean);

  return clauses.length ? `(${clauses.join(' OR ')})` : '';
}

function buildFilters(filters = {}, { attemptAlias = 'a', userAlias = 'u' } = {}) {
  const dateExpr = `DATE(COALESCE(${attemptAlias}.submission_datetime, ${attemptAlias}.question_start_datetime))`;
  const instituteExpr = `${userAlias}.institute_name`;
  const conditions = [
    `${userAlias}.user_id IS NOT NULL`,
    `TRIM(COALESCE(${instituteExpr}, '')) != ''`,
  ];
  const params = {};

  const semesterWindowClause = buildSemesterWindowClause(filters.semester, filters.batch, instituteExpr, dateExpr, params);
  if (semesterWindowClause) conditions.push(semesterWindowClause);

  if (filters.startDate) {
    conditions.push(`${dateExpr} >= @startDate`);
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    conditions.push(`${dateExpr} <= @endDate`);
    params.endDate = filters.endDate;
  }

  if (shouldApplyBatchFilter(filters.batch)) {
    conditions.push(`LOWER(COALESCE(${userAlias}.batch_name, '')) LIKE @batchPattern`);
    params.batchPattern = `%${filters.batch.trim().toLowerCase()}%`;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
    dateExpr,
  };
}

function getSessionTypeExpression(titleExpr = 'a.question_set_title') {
  return `CASE
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(${titleExpr}, '')), r'assignment|assessment|exam|quiz') THEN 'EXAM'
    WHEN REGEXP_CONTAINS(LOWER(COALESCE(${titleExpr}, '')), r'session|lecture') THEN 'LECTURE'
    ELSE 'PRACTICE'
  END`;
}

function getCourseExpression(attemptAlias = 'a') {
  return `COALESCE(
    NULLIF(TRIM(${attemptAlias}.question_set_title), ''),
    CONCAT('Question Set ', CAST(${attemptAlias}.question_set_id AS STRING))
  )`;
}

function getSectionExpression(userAlias = 'u') {
  return `COALESCE(NULLIF(TRIM(${userAlias}.section_name), ''), 'Unknown')`;
}

const semesterTableRef = parseTableReference(
  getEnv('BQ_SEMESTER_TABLE', 'BQSEMESTERTABLE', 'BQ_TABLE', 'BQTABLE'),
  DEFAULT_SEMESTER_TABLE,
);
const assessmentTableRef = parseTableReference(
  getEnv('BQ_ASSESSMENT_TABLE', 'BQASSESSMENTTABLE', 'BQ_TABLE', 'BQTABLE'),
  DEFAULT_ASSESSMENT_TABLE,
);
const usersTableRef = parseTableReference(
  getEnv('BQ_USERS_TABLE', 'BQUSERSTABLE'),
  DEFAULT_USERS_TABLE,
);
const contentTableRef = parseTableReference(
  getEnv('BQ_CONTENT_TABLE', 'BQCONTENTTABLE'),
  DEFAULT_CONTENT_TABLE,
);

const projectId = getEnv('BQ_PROJECT_ID', 'BQPROJECTID') || semesterTableRef.projectId;
const dataset = getEnv('BQ_DATASET', 'BQDATASET') || semesterTableRef.dataset;

const semesterTable = formatTableReference(semesterTableRef);
const assessmentTable = formatTableReference(assessmentTableRef);
const usersTable = formatTableReference(usersTableRef);
const contentTable = formatTableReference(contentTableRef);

const bigquery = new BigQuery({
  projectId,
  ...resolveBigQueryOptions(),
});

function buildUsersSubquery() {
  return `
    SELECT DISTINCT
      user_id,
      institute_name,
      section_name,
      batch_name
    FROM ${usersTable}
  `;
}

function buildContentSubquery() {
  return `
    SELECT
      unit_id,
      ARRAY_AGG(
        course_title IGNORE NULLS
        ORDER BY
          CASE
            WHEN LOWER(course_title) IN ('to be delete', 'niat practice page') THEN 1
            ELSE 0
          END,
          LENGTH(course_title),
          course_title
        LIMIT 1
      )[SAFE_OFFSET(0)] AS course_title
    FROM (
      SELECT DISTINCT
        unit_id,
        NULLIF(TRIM(course_title), '') AS course_title
      FROM ${contentTable}
    )
    GROUP BY unit_id
  `;
}

export async function testConnection() {
  await Promise.all([
    bigquery.query(`SELECT 1 AS test FROM ${semesterTable} LIMIT 1`),
    bigquery.query(`SELECT 1 AS test FROM ${usersTable} LIMIT 1`),
  ]);

  return {
    connected: true,
    projectId,
    dataset,
    semesterTable: semesterTableRef.table,
    assessmentTable: assessmentTableRef.table,
    usersTable: usersTableRef.table,
    contentTable: contentTableRef.table,
  };
}

export async function fetchSemesterData(filters = {}) {
  const { whereClause, params, dateExpr } = buildFilters(filters);
  const sessionTypeExpression = getSessionTypeExpression();
  const courseExpression = getCourseExpression();
  const sectionExpression = getSectionExpression();

  const sql = `
    WITH users AS (
      ${buildUsersSubquery()}
    ),
    content AS (
      ${buildContentSubquery()}
    )
    SELECT
      COALESCE(content.course_title, ${courseExpression}) AS course,
      u.institute_name AS institute,
      ${sectionExpression} AS section,
      ${sessionTypeExpression} AS session_type,
      COUNT(DISTINCT a.question_set_id) AS sessions,
      COUNT(DISTINCT a.user_id) AS students,
      ROUND(
        100 * SAFE_DIVIDE(
          COUNTIF(a.submission_datetime IS NOT NULL OR a.evaluation_result IS NOT NULL),
          COUNT(*)
        ),
        2
      ) AS completion,
      ROUND(AVG(COALESCE(CAST(a.time_spent AS FLOAT64), 0)), 2) AS avg_time,
      APPROX_QUANTILES(COALESCE(CAST(a.time_spent AS FLOAT64), 0), 100)[OFFSET(80)] AS p80_time,
      @selectedBatch AS batch,
      @selectedSemester AS semester,
      CAST(MAX(${dateExpr}) AS STRING) AS report_date
    FROM ${semesterTable} a
    JOIN users u USING (user_id)
    LEFT JOIN content ON CAST(a.question_set_id AS STRING) = content.unit_id
    WHERE ${whereClause}
    GROUP BY course, institute, section, session_type
    ORDER BY institute, section, course
  `;

  const [rows] = await bigquery.query({
    query: sql,
    params: {
      ...params,
      selectedBatch: filters.batch || '',
      selectedSemester: filters.semester || '',
    },
  });

  return rows.map(transformSemesterRow);
}

export async function fetchAssessmentData(filters = {}) {
  const { whereClause, params, dateExpr } = buildFilters(filters);
  const courseExpression = getCourseExpression();
  const sectionExpression = getSectionExpression();

  const sql = `
    WITH users AS (
      ${buildUsersSubquery()}
    ),
    content AS (
      ${buildContentSubquery()}
    )
    SELECT
      u.institute_name AS university,
      ${sectionExpression} AS section,
      COALESCE(content.course_title, ${courseExpression}) AS course_code,
      COUNT(DISTINCT IF(COALESCE(a.user_score, a.actual_score) IS NOT NULL, a.user_id, NULL)) AS avg_participation,
      ROUND(AVG(COALESCE(SAFE_DIVIDE(a.user_score, NULLIF(a.actual_score, 0)), 0)), 4) AS avg_score,
      @selectedBatch AS batch,
      @selectedSemester AS semester,
      CAST(MAX(${dateExpr}) AS STRING) AS report_date
    FROM ${assessmentTable} a
    JOIN users u USING (user_id)
    LEFT JOIN content ON CAST(a.question_set_id AS STRING) = content.unit_id
    WHERE ${whereClause}
      AND COALESCE(a.actual_score, 0) > 0
    GROUP BY university, section, course_code
    ORDER BY university, section, course_code
  `;

  const [rows] = await bigquery.query({
    query: sql,
    params: {
      ...params,
      selectedBatch: filters.batch || '',
      selectedSemester: filters.semester || '',
    },
  });

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
  return tables.map((table) => ({
    id: table.id,
    metadata: {
      type: table.metadata.type,
      numRows: table.metadata.numRows,
      numBytes: table.metadata.numBytes,
    },
  }));
}
