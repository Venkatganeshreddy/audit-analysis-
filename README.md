# NIAT Analytics

React + Vite dashboard with an Express BigQuery backend.

## BigQuery Setup

The backend reads from the configured BigQuery dataset and derives the dashboard from schedule, roster, content, and assessment tables.

Use the server env file to configure the connection:

```bash
cd server
cp .env.example .env
```

Expected server variables:

- `BQ_PROJECT_ID`: Google Cloud project id
- `BQ_TABLE`: BigQuery table in `dataset.table` or `project.dataset.table` format
- `BQ_SCHEDULE_TABLE`: offline section schedule table used for delivered-session counts
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

## Streamlit Deploy

This repo now includes a Streamlit entrypoint at `streamlit_app.py`.

Files used for Streamlit deployment:

- `streamlit_app.py`
- `requirements.txt`
- `.streamlit/secrets.toml.example`

On Streamlit Cloud:

1. Repository: `Venkatganeshreddy/audit-analysis-`
2. Branch: `main`
3. Main file path: `streamlit_app.py`
4. Copy the keys from `.streamlit/secrets.toml.example` into your app secrets
5. Paste your Google service account values inside the `[gcp_service_account]` block

Local Streamlit run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

## Backend Behavior

The backend derives dashboard-friendly summary datasets from multiple raw tables in the dataset:

- `POST /api/bigquery/semester`: section-schedule summary rows for delivered sessions and class size
- `POST /api/bigquery/assessment`: aggregated assessment-style summary rows
- `GET /api/bigquery/status`: connection check plus active project, dataset, and table
- `POST /api/bigquery/query`: ad-hoc `SELECT` queries
- `GET /api/bigquery/tables`: tables in the configured dataset
