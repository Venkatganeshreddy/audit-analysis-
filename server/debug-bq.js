import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { BigQuery } from '@google-cloud/bigquery';

const env = globalThis.process?.env ?? {};

function getEnv(...keys) {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

const PROJECT_ID = getEnv('BQ_PROJECT_ID', 'BQPROJECTID') || 'kossip-helpers';
const DATASET = getEnv('BQ_DATASET', 'BQDATASET') || 'content_bases_metabase';
const TABLE = getEnv(
  'BQ_SEMESTER_TABLE',
  'BQSEMESTERTABLE',
  'BQ_TABLE',
  'BQTABLE',
) || 'all_users_question_attempt_details_for_question_set_units';
const credentialsFile = getEnv(
  'BQ_CREDENTIALS_FILE',
  'BQCREDENTIALSFILE',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GOOGLEAPPLICATIONCREDENTIALS',
);

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
  ...(credentialsFile
    ? {
        keyFilename: path.isAbsolute(credentialsFile)
          ? credentialsFile
          : path.resolve(process.cwd(), credentialsFile),
      }
    : {}),
});

async function debugTable() {
  const fullTable = `\`${PROJECT_ID}.${DATASET}.${TABLE}\``;
  console.log(`Checking table: ${fullTable}\n`);

  if (credentialsFile) {
    const resolved = path.isAbsolute(credentialsFile)
      ? credentialsFile
      : path.resolve(process.cwd(), credentialsFile);
    console.log(`Credentials file: ${resolved}`);
    console.log(`Credentials present: ${fs.existsSync(resolved) ? 'yes' : 'no'}\n`);
  }

  try {
    const [countResult] = await bigquery.query(`SELECT COUNT(*) AS total_rows FROM ${fullTable}`);
    console.log(`Total rows: ${countResult[0]?.total_rows ?? 0}\n`);

    const [schemaResult] = await bigquery.query(`
      SELECT column_name
      FROM \`${PROJECT_ID}.${DATASET}.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = '${TABLE}'
      ORDER BY ordinal_position
    `);
    console.log('Columns:');
    console.log(schemaResult.map((column) => `- ${column.column_name}`).join('\n'));

    const [dateResult] = await bigquery.query(`
      SELECT
        MIN(DATE(COALESCE(submission_datetime, question_start_datetime))) AS min_date,
        MAX(DATE(COALESCE(submission_datetime, question_start_datetime))) AS max_date
      FROM ${fullTable}
    `);
    console.log('\nDate range:');
    console.log(`${dateResult[0]?.min_date?.value || dateResult[0]?.min_date} to ${dateResult[0]?.max_date?.value || dateResult[0]?.max_date}`);
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

debugTable();
