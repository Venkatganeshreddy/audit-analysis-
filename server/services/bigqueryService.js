import { BigQuery } from '@google-cloud/bigquery';
import { transformSemesterRow, transformAssessmentRow } from './transformers.js';

const bigquery = new BigQuery({
  projectId: process.env.BQ_PROJECT_ID,
});

const dataset = process.env.BQ_DATASET;
const semesterTable = process.env.BQ_SEMESTER_TABLE;
const assessmentTable = process.env.BQ_ASSESSMENT_TABLE;

export async function testConnection() {
  const [rows] = await bigquery.query('SELECT 1 as test');
  return {
    connected: true,
    projectId: process.env.BQ_PROJECT_ID,
    dataset,
  };
}

export async function fetchSemesterData(filters = {}) {
  const conditions = ['1=1'];
  const params = {};

  if (filters.batch) {
    conditions.push('batch = @batch');
    params.batch = filters.batch;
  }
  if (filters.semester) {
    conditions.push('semester = @semester');
    params.semester = filters.semester;
  }
  if (filters.startDate) {
    conditions.push('report_date >= @startDate');
    params.startDate = filters.startDate;
  }
  if (filters.endDate) {
    conditions.push('report_date <= @endDate');
    params.endDate = filters.endDate;
  }

  const sql = `SELECT * FROM \`${process.env.BQ_PROJECT_ID}.${dataset}.${semesterTable}\` WHERE ${conditions.join(' AND ')}`;

  const [rows] = await bigquery.query({ query: sql, params });
  return rows.map(transformSemesterRow);
}

export async function fetchAssessmentData(filters = {}) {
  const conditions = ['1=1'];
  const params = {};

  if (filters.batch) {
    conditions.push('batch = @batch');
    params.batch = filters.batch;
  }
  if (filters.semester) {
    conditions.push('semester = @semester');
    params.semester = filters.semester;
  }
  if (filters.startDate) {
    conditions.push('report_date >= @startDate');
    params.startDate = filters.startDate;
  }
  if (filters.endDate) {
    conditions.push('report_date <= @endDate');
    params.endDate = filters.endDate;
  }

  const sql = `SELECT * FROM \`${process.env.BQ_PROJECT_ID}.${dataset}.${assessmentTable}\` WHERE ${conditions.join(' AND ')}`;

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
