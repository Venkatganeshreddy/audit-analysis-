import 'dotenv/config';
import fs from 'fs';

const env = globalThis.process?.env ?? {};
const getValue = (preferred, legacy) => env[preferred] || env[legacy] || '(not set)';

console.log('=== BigQuery Environment Variables ===\n');
console.log('BQ_PROJECT_ID:', getValue('BQ_PROJECT_ID', 'BQPROJECTID'));
console.log('BQ_DATASET:', getValue('BQ_DATASET', 'BQDATASET'));
console.log('BQ_TABLE:', getValue('BQ_TABLE', 'BQTABLE'));
console.log('BQ_SEMESTER_TABLE:', getValue('BQ_SEMESTER_TABLE', 'BQSEMESTERTABLE'));
console.log('BQ_ASSESSMENT_TABLE:', getValue('BQ_ASSESSMENT_TABLE', 'BQASSESSMENTTABLE'));
console.log('BQ_USERS_TABLE:', getValue('BQ_USERS_TABLE', 'BQUSERSTABLE'));
console.log('GOOGLE_APPLICATION_CREDENTIALS:', getValue('GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLEAPPLICATIONCREDENTIALS'));
console.log('\n=== File Check ===');
const credentialsFile = env.GOOGLE_APPLICATION_CREDENTIALS || env.GOOGLEAPPLICATIONCREDENTIALS;
if (credentialsFile) {
  const exists = fs.existsSync(credentialsFile);
  console.log('Credentials file exists:', exists);
}
