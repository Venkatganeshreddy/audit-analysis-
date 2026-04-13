# NIAT Analytics

React + Vite dashboard with an Express BigQuery backend.

## BigQuery Setup

The backend is configured to read from a single BigQuery source table:

`kossip-helpers.content_bases_metabase.all_users_question_attempt_details_for_question_set_units`

Use the server env file to configure the connection:

```bash
cd server
cp .env.example .env
```

Expected server variables:

- `BQ_PROJECT_ID`: Google Cloud project id
- `BQ_TABLE`: BigQuery table in `dataset.table` or `project.dataset.table` format
- `GOOGLE_APPLICATION_CREDENTIALS`: path to the local service account JSON file

`server/service-account-key.json` is ignored by git and should stay local.

## Run Locally

Frontend:

```bash
npm ci
npm run dev
```

Backend:

```bash
cd server
npm ci
npm run dev
```

Frontend default URL: `http://localhost:5173`

Backend default URL: `http://localhost:3001`

## Backend Behavior

The configured BigQuery table stores question-attempt data, not semester-report rows. The backend now derives dashboard-friendly summary datasets from that raw table for the existing UI:

- `POST /api/bigquery/semester`: aggregated question-set summary rows
- `POST /api/bigquery/assessment`: aggregated assessment-style summary rows
- `GET /api/bigquery/status`: connection check plus active project, dataset, and table
- `POST /api/bigquery/query`: ad-hoc `SELECT` queries
- `GET /api/bigquery/tables`: tables in the configured dataset
