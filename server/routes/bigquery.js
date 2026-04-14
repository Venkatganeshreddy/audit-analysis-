import { Router } from 'express';
import {
  testConnection,
  fetchSemesterData,
  fetchAssessmentData,
  executeCustomQuery,
  listTables,
} from '../services/bigqueryService.js';

const router = Router();

// GET /api/bigquery/status — test BigQuery connection
router.get('/status', async (req, res) => {
  try {
    const result = await testConnection();
    res.json({
      connected: true,
      projectId: result.projectId,
      dataset: result.dataset,
      table: result.semesterTable,
      semesterTable: result.semesterTable,
      assessmentTable: result.assessmentTable,
      usersTable: result.usersTable,
      scheduleTable: result.scheduleTable,
    });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// POST /api/bigquery/semester — fetch semester report data
router.post('/semester', async (req, res) => {
  try {
    const { batch, semester, startDate, endDate, customQuery } = req.body;
    const filters = { batch, semester, startDate, endDate, customQuery };
    const rows = await fetchSemesterData(filters);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bigquery/assessment — fetch assessment data
router.post('/assessment', async (req, res) => {
  try {
    const { batch, semester, startDate, endDate, customQuery } = req.body;
    const filters = { batch, semester, startDate, endDate, customQuery };
    const rows = await fetchAssessmentData(filters);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bigquery/query — execute a custom/ad-hoc SELECT query (for the agent system)
router.post('/query', async (req, res) => {
  try {
    const { sql, params } = req.body;
    const rows = await executeCustomQuery(sql, params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bigquery/tables — list available tables in the dataset
router.get('/tables', async (req, res) => {
  try {
    const tables = await listTables();
    res.json({ success: true, tables });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
