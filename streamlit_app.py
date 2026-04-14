import json
import os
import re
from datetime import datetime

import pandas as pd
import streamlit as st
from google.cloud import bigquery
from google.oauth2 import service_account


DEFAULT_PROJECT_ID = "kossip-helpers"
DEFAULT_DATASET = "content_bases_metabase"
DEFAULT_SEMESTER_TABLE = "all_users_question_attempt_details_for_question_set_units"
DEFAULT_ASSESSMENT_TABLE = "all_users_question_attempt_details_for_question_set_units"
DEFAULT_USERS_TABLE = "niat_and_intensive_offline_users_details"
DEFAULT_CONTENT_TABLE = "content_all_products_unit_wise_content_hierarchy_details"
DEFAULT_SCHEDULE_TABLE = "niat_and_intensive_offline_section_wise_daily_learning_schedule_details"

SERIES_RANGES = [
    {"name": "300", "min": 0, "max": 350},
    {"name": "350", "min": 350, "max": 400},
    {"name": "400", "min": 400, "max": 450},
    {"name": "450", "min": 450, "max": 500},
    {"name": "500", "min": 500, "max": 550},
    {"name": "550+", "min": 550, "max": float("inf")},
]

ALLOTTED_HOURS_BY_SEMESTER = {
    "Semester 1": {
        "NRI Institute of Technology": 510,
        "NRI": 510,
        "S-Vyasa": 673,
        "S-VYASA": 673,
        "Annamacharya University": 540,
        "Annamacharya": 540,
        "Vivekananda global University": 464,
        "VGU": 464,
        "NSRIT": 346,
        "NSRIT University": 346,
        "CDU": 522,
        "Chaitanya Deemed-to-be University": 522,
        "A Dy Patil University": 434,
        "A Dy Patil": 434,
        "MRV University": 485,
        "MRV": 485,
        "Malla Reddy Vishwavidyapeeth": 485,
        "Yenepoya University": 544,
        "Yenapoya University": 544,
        "Yenepoya": 544,
        "Noida International": 480,
        "Noida International University": 480,
        "NIU": 480,
        "Chalapathy": 360,
        "Chalapathy (CITY)": 360,
        "Chalapathi": 360,
        "Sanjay Godhawat University": 354,
        "Sanjay Ghodawat University": 354,
        "SGU": 354,
        "Crescent University": 310,
        "Crescent": 310,
        "Academy of Maritime education & Technology": 469,
        "AMET": 469,
        "Takshashila University": 408,
        "Takshasila University": 408,
        "Takshashila": 408,
        "Aurora University": 500,
        "Aurora": 500,
        "NIAT Chevella": 600,
    },
    "Semester 2": {
        "Sanjay Ghodawat University": 730,
        "Sanjay Godhawat University": 730,
        "SGU": 730,
        "Vivekananda global University": 501,
        "VGU": 501,
        "Yenepoya University": 611,
        "Yenapoya University": 611,
        "Yenepoya": 611,
        "S-Vyasa": 597,
        "S-VYASA": 597,
        "A Dy Patil University": 569,
        "A Dy Patil": 569,
        "Takshashila University": 441,
        "Takshasila University": 441,
        "Takshashila": 441,
        "Academy of Maritime education & Technology": 520,
        "AMET": 520,
        "Noida International": 441,
        "Noida International University": 441,
        "NIU": 441,
        "Annamacharya University": 625,
        "Annamacharya": 625,
        "NRI Institute of Technology": 621,
        "NRI": 621,
        "MRV University": 450,
        "MRV": 450,
        "Malla Reddy Vishwavidyapeeth": 450,
        "CDU": 582,
        "Chaitanya Deemed-to-be University": 582,
        "Crescent University": 380,
        "Crescent": 380,
        "Chalapathy": 506,
        "Chalapathy (CITY)": 506,
        "Chalapathi": 506,
        "NSRIT": 489,
        "NSRIT University": 489,
        "Aurora University": 500,
        "Aurora": 500,
        "BITS": 814,
        "NIAT Chevella": 600,
    },
}

SEMESTER_DATES_BY_SEMESTER = {
    "Semester 1": {
        "A Dy Patil University": {"start": "Aug 4, 2025", "end": "Dec 15, 2025"},
        "AMET": {"start": "Sep 1, 2025", "end": "Jan 27, 2026"},
        "Annamacharya University": {"start": "Aug 11, 2025", "end": "Jan 6, 2026"},
        "Aurora University": {"start": "Sep 15, 2025", "end": "Jun 15, 2026"},
        "Chaitanya Deemed-to-be University": {"start": "Aug 4, 2025", "end": "Dec 24, 2025"},
        "Chalapathy (CITY)": {"start": "Aug 25, 2025", "end": "Jan 24, 2026"},
        "Crescent University": {"start": "Sep 8, 2025", "end": "Dec 24, 2025"},
        "Malla Reddy Vishwavidyapeeth": {"start": "Aug 4, 2025", "end": "Dec 31, 2025"},
        "NIAT Chevella": {"start": "Aug 25, 2025", "end": "Jun 6, 2026"},
        "Noida International University": {"start": "Aug 25, 2025", "end": "Dec 22, 2025"},
        "NRI": {"start": "Aug 18, 2025", "end": "Dec 30, 2025"},
        "NSRIT University": {"start": "Aug 18, 2025", "end": "Dec 30, 2025"},
        "S-VYASA": {"start": "Aug 11, 2025", "end": "Jan 20, 2026"},
        "Sanjay Ghodawat University": {"start": "Aug 11, 2025", "end": "Dec 15, 2025"},
        "Takshasila University": {"start": "Sep 15, 2025", "end": "Jan 21, 2026"},
        "Vivekananda global University": {"start": "Aug 25, 2025", "end": "Dec 20, 2025"},
        "Yenapoya University": {"start": "Aug 4, 2025", "end": "Dec 23, 2025"},
    },
    "Semester 2": {
        "Sanjay Ghodawat University": {"start": "Jan 5, 2026", "end": "Jun 13, 2026"},
        "Vivekananda global University": {"start": "Jan 2, 2026", "end": "May 30, 2026"},
        "Yenepoya University": {"start": "Jan 20, 2026", "end": "Jun 5, 2026"},
        "Yenapoya University": {"start": "Jan 20, 2026", "end": "Jun 5, 2026"},
        "S-VYASA": {"start": "Feb 16, 2026", "end": "Jul 7, 2026"},
        "A Dy Patil University": {"start": "Jan 5, 2026", "end": "May 15, 2026"},
        "Takshashila University": {"start": "Feb 9, 2026", "end": "Jun 13, 2026"},
        "Takshasila University": {"start": "Feb 9, 2026", "end": "Jun 13, 2026"},
        "AMET": {"start": "Feb 2, 2026", "end": "Jun 9, 2026"},
        "Noida International University": {"start": "Jan 12, 2026", "end": "Jun 6, 2026"},
        "Noida International": {"start": "Jan 12, 2026", "end": "Jun 6, 2026"},
        "Annamacharya University": {"start": "Jan 2, 2026", "end": "Jun 4, 2026"},
        "NRI": {"start": "Jan 16, 2026", "end": "Jun 20, 2026"},
        "NRI Institute of Technology": {"start": "Jan 16, 2026", "end": "Jun 20, 2026"},
        "MRV University": {"start": "Jan 2, 2026", "end": "May 9, 2026"},
        "Malla Reddy Vishwavidyapeeth": {"start": "Jan 2, 2026", "end": "May 9, 2026"},
        "Chaitanya Deemed-to-be University": {"start": "Jan 19, 2026", "end": "May 18, 2026"},
        "CDU": {"start": "Jan 19, 2026", "end": "May 18, 2026"},
        "Crescent University": {"start": "Jan 19, 2026", "end": "May 19, 2026"},
        "Chalapathy (CITY)": {"start": "Jan 27, 2026", "end": "Jul 11, 2026"},
        "Chalapathy": {"start": "Jan 27, 2026", "end": "Jul 11, 2026"},
        "NSRIT University": {"start": "Feb 9, 2026", "end": "Jul 13, 2026"},
        "NSRIT": {"start": "Feb 9, 2026", "end": "Jul 13, 2026"},
        "Aurora University": {"start": "Aug 12, 2025", "end": "Feb 22, 2026"},
        "BITS": {"start": "Jan 28, 2026", "end": "Aug 15, 2026"},
    },
}

COURSE_MAPPING_BY_SEMESTER = {
    "Semester 1": {
        "GENERATIVE_AI": "Introduction to Generative AI",
        "MATHEMATICS": "Mathematics for Computer Science",
        "BUILD_YOUR_OWN_STATIC_WEBSITE": "Web Application Development I",
        "COMMUNICATIVE_ENGLISH_FOUNDATION": "Communication English Foundation",
        "PROGRAMMING_FOUNDATIONS": "Computer Programming",
        "QUANTITATIVE_APTITUDE": "Quantitative Aptitude",
    },
    "Semester 2": {
        "WEB_APPLICATION_DEVELOPMENT_2": "Web Application Development 2",
        "WA2": "Web Application Development 2",
        "DBMS": "Database Management Systems",
        "DATABASE_MANAGEMENT": "Database Management Systems",
        "DATA_STRUCTURES": "Data Structures",
        "DS": "Data Structures",
        "NUMERICAL_APTITUDE": "Numerical Aptitude",
        "NA": "Numerical Aptitude",
        "QUANTITATIVE_APTITUDE": "Numerical Aptitude",
        "ENGLISH_ADVANCED": "English Advanced",
        "EA": "English Advanced",
        "COMMUNICATIVE_ENGLISH_FOUNDATION": "English Advanced",
        "LLM": "Large Language Models",
        "LARGE_LANGUAGE_MODELS": "Large Language Models",
        "GENERATIVE_AI": "Large Language Models",
        "PHYSICS": "Physics",
        "PHY": "Physics",
        "CHEMISTRY": "Chemistry",
        "CHE": "Chemistry",
        "YOGA": "Yoga",
        "TDP": "Talent Development Program",
        "HVS": "Human Values & Ethics",
        "HUMAN_VALUES": "Human Values & Ethics",
        "ASSESSMENT": "Assessment",
        "AS": "Assessment",
        "BUSINESS_ENGLISH": "Business English",
        "BE": "Business English",
        "IKS": "Indian Knowledge System",
        "INDIAN_KNOWLEDGE_SYSTEM": "Indian Knowledge System",
        "LINEAR_ALGEBRA": "Linear Algebra & Calculus",
        "LA_C": "Linear Algebra & Calculus",
        "ENVIRONMENTAL_SCIENCE": "Environmental Science",
        "ENV": "Environmental Science",
        "INDIAN_CONSTITUTION": "Indian Constitution",
        "IC": "Indian Constitution",
        "LANGUAGE_ELECTIVE": "Language Elective",
        "LA_E": "Language Elective",
        "ENGINEERING_DRAWING": "Engineering Drawing",
        "ED": "Engineering Drawing",
        "CLOUD_COMPUTING": "Cloud Computing",
        "CC": "Cloud Computing",
        "PROGRAMMING_FOUNDATIONS": "Data Structures",
        "BUILD_YOUR_OWN_STATIC_WEBSITE": "Web Application Development 2",
        "MATHEMATICS": "Linear Algebra & Calculus",
    },
}

COURSE_ALIAS_GROUPS_BY_SEMESTER = {
    "Semester 1": {
        "Introduction to Generative AI": ["generative ai", "introduction to generative ai"],
        "Mathematics for Computer Science": ["mathematics", "mathematics for computer science"],
        "Web Application Development I": [
            "build your own static website",
            "build your own responsive website",
            "modern responsive web design",
            "responsive web design using flexbox",
            "html & css",
            "web application development i",
        ],
        "Communication English Foundation": [
            "communicative english foundation",
            "communication english foundation",
            "english foundation",
        ],
        "Computer Programming": [
            "programming foundations",
            "programing foundation",
            "python programming",
            "problem solving with python programming",
            "computer programming",
            "introduction to niat",
            "niat practice page",
            "logical thinking",
            "oops",
            "more python problem solving",
        ],
        "Quantitative Aptitude": ["quantitative aptitude", "numerical aptitude"],
    },
    "Semester 2": {
        "Web Application Development 2": [
            "web application development 2",
            "build your own dynamic web application",
            "js essentials",
            "javascript essentials",
            "js programming",
            "introduction to react js",
            "react js",
            "node js",
        ],
        "Database Management Systems": [
            "database management systems",
            "introduction to database",
            "introduction to databases",
        ],
        "Data Structures": [
            "data structures",
            "data structures and algorithm",
            "dsa",
            "dsa foundation",
            "dsa level 1",
            "dsa extra coding questions",
            "dsa - beginner",
            "niat - dsa",
            "academy - dsa",
            "phase 1 : data structures and algorithms",
            "foundations of data structures and algorithms",
        ],
        "Numerical Aptitude": ["numerical aptitude", "quantitative aptitude", "logical thinking"],
        "English Advanced": ["english advanced", "communicative english foundation", "business english"],
        "Large Language Models": ["large language models", "llm", "generative ai"],
        "Physics": ["physics"],
        "Chemistry": ["chemistry"],
        "Yoga": ["yoga"],
        "Talent Development Program": ["talent development program", "tdp"],
        "Human Values & Ethics": ["human values", "human values & ethics", "hvs"],
        "Assessment": ["assessment"],
        "Business English": ["business english"],
        "Indian Knowledge System": ["indian knowledge system", "iks"],
        "Linear Algebra & Calculus": ["linear algebra", "linear algebra & calculus", "calculus"],
        "Environmental Science": ["environmental science"],
        "Indian Constitution": ["indian constitution"],
        "Language Elective": ["language elective"],
        "Engineering Drawing": ["engineering drawing"],
        "Cloud Computing": ["cloud computing"],
    },
}


def get_config(key: str, default: str = "") -> str:
    if key in st.secrets:
        return str(st.secrets[key])
    return os.getenv(key, default)


def sql_escape(value: str) -> str:
    return str(value).replace("\\", "\\\\").replace("'", "\\'")


def to_iso_date(value: str) -> str:
    if not value:
        return ""
    if re.match(r"^\d{4}-\d{2}-\d{2}$", value):
        return value
    return datetime.strptime(value, "%b %d, %Y").strftime("%Y-%m-%d")


def shift_iso_date(iso_date: str, year_delta: int = 0) -> str:
    if not iso_date or year_delta == 0:
        return iso_date
    parts = [int(part) for part in iso_date.split("-")]
    return f"{parts[0] + year_delta:04d}-{parts[1]:02d}-{parts[2]:02d}"


def should_apply_batch_filter(batch: str) -> bool:
    return bool(batch and batch.strip() and not re.match(r"^niat\s+\d+$", batch.strip(), re.IGNORECASE))


def get_batch_year_shift(batch: str) -> int:
    match = re.match(r"^niat\s+(\d{2})$", batch.strip(), re.IGNORECASE) if batch else None
    return int(match.group(1)) - 25 if match else 0


def get_semester_window_clause(semester: str, batch: str, institute_expr: str, date_expr: str) -> str:
    windows = SEMESTER_DATES_BY_SEMESTER.get(semester)
    if not windows:
        return ""
    year_shift = get_batch_year_shift(batch)
    clauses = []
    for institute_name, window in windows.items():
        start = shift_iso_date(to_iso_date(window["start"]), year_shift)
        end = shift_iso_date(to_iso_date(window["end"]), year_shift)
        clauses.append(
            f"(LOWER({institute_expr}) = '{sql_escape(institute_name.lower())}' AND {date_expr} BETWEEN '{start}' AND '{end}')"
        )
    return f"({' OR '.join(clauses)})" if clauses else ""


def get_course_mapping(semester: str) -> dict:
    return COURSE_MAPPING_BY_SEMESTER.get(semester, COURSE_MAPPING_BY_SEMESTER["Semester 1"])


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def normalize_course_name(course_name: str, semester: str) -> str:
    raw = str(course_name or "").strip()
    if not raw:
        return raw
    course_map = get_course_mapping(semester)
    if raw in course_map:
        return course_map[raw]
    normalized_raw = normalize_text(raw)
    alias_groups = COURSE_ALIAS_GROUPS_BY_SEMESTER.get(semester, {})
    for canonical_name, aliases in alias_groups.items():
        if any(normalized_raw == normalize_text(alias) or normalize_text(alias) in normalized_raw for alias in aliases):
            return canonical_name
    return raw


def get_allotted_hours(name: str, semester: str):
    sem_hours = ALLOTTED_HOURS_BY_SEMESTER.get(semester, ALLOTTED_HOURS_BY_SEMESTER["Semester 1"])
    if name in sem_hours:
        return sem_hours[name]
    lowered = name.lower()
    for key, value in sem_hours.items():
        if lowered.find(key.lower().split(" ")[0]) != -1:
            return value
    return None


def get_semester_dates_for_institute(name: str, semester: str):
    sem_dates = SEMESTER_DATES_BY_SEMESTER.get(semester, SEMESTER_DATES_BY_SEMESTER["Semester 1"])
    if name in sem_dates:
        return sem_dates[name]
    lowered = name.lower()
    for key, value in sem_dates.items():
        if lowered.find(key.lower().split(" ")[0]) != -1:
            return value
    return None


def get_series_for_value(value: float) -> dict:
    for series in SERIES_RANGES:
        if value >= series["min"] and value < series["max"]:
            return series
    return SERIES_RANGES[-1]


def get_series_for_allotted_hours(name: str, semester: str):
    hours = get_allotted_hours(name, semester)
    if hours is None:
        return None
    return get_series_for_value(hours)


@st.cache_resource(show_spinner=False)
def get_bigquery_client():
    project_id = get_config("BQ_PROJECT_ID", DEFAULT_PROJECT_ID)
    if "gcp_service_account" in st.secrets:
        credentials = service_account.Credentials.from_service_account_info(dict(st.secrets["gcp_service_account"]))
        return bigquery.Client(project=project_id or credentials.project_id, credentials=credentials)

    credentials_json = get_config("BQ_CREDENTIALS_JSON")
    if credentials_json:
        credentials = service_account.Credentials.from_service_account_info(json.loads(credentials_json))
        return bigquery.Client(project=project_id or credentials.project_id, credentials=credentials)

    return bigquery.Client(project=project_id)


def format_table_ref(table_ref: str, default_table: str) -> str:
    project_id = get_config("BQ_PROJECT_ID", DEFAULT_PROJECT_ID)
    dataset = get_config("BQ_DATASET", DEFAULT_DATASET)
    raw = table_ref.strip() if table_ref else default_table
    parts = [part.strip() for part in raw.split(".") if part.strip()]
    if len(parts) == 3:
        return f"`{parts[0]}.{parts[1]}.{parts[2]}`"
    if len(parts) == 2:
        return f"`{project_id}.{parts[0]}.{parts[1]}`"
    return f"`{project_id}.{dataset}.{parts[0]}`"


def get_table_refs():
    return {
        "semester": format_table_ref(get_config("BQ_SEMESTER_TABLE", DEFAULT_SEMESTER_TABLE), DEFAULT_SEMESTER_TABLE),
        "assessment": format_table_ref(get_config("BQ_ASSESSMENT_TABLE", DEFAULT_ASSESSMENT_TABLE), DEFAULT_ASSESSMENT_TABLE),
        "users": format_table_ref(get_config("BQ_USERS_TABLE", DEFAULT_USERS_TABLE), DEFAULT_USERS_TABLE),
        "content": format_table_ref(get_config("BQ_CONTENT_TABLE", DEFAULT_CONTENT_TABLE), DEFAULT_CONTENT_TABLE),
        "schedule": format_table_ref(get_config("BQ_SCHEDULE_TABLE", DEFAULT_SCHEDULE_TABLE), DEFAULT_SCHEDULE_TABLE),
    }


@st.cache_data(ttl=600, show_spinner=False)
def run_query(sql: str) -> pd.DataFrame:
    client = get_bigquery_client()
    rows = client.query(sql).result()
    return rows.to_dataframe(create_bqstorage_client=False)


def build_content_subquery(content_table: str) -> str:
    return f"""
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
          FROM {content_table}
        )
        GROUP BY unit_id
    """


def fetch_semester_data(batch: str, semester: str) -> pd.DataFrame:
    refs = get_table_refs()
    where_clauses = ["TRIM(COALESCE(s.institute_name, '')) != ''"]
    window_clause = get_semester_window_clause(semester, batch, "s.institute_name", "DATE(s.session_date)")
    if window_clause:
        where_clauses.append(window_clause)
    if should_apply_batch_filter(batch):
        where_clauses.append(f"LOWER(COALESCE(s.batch_name, '')) LIKE '%{sql_escape(batch.strip().lower())}%'")

    sql = f"""
        WITH content AS (
          {build_content_subquery(refs["content"])}
        ),
        schedule_base AS (
          SELECT
            s.institute_name AS institute,
            COALESCE(NULLIF(TRIM(s.section_name), ''), 'Unknown') AS section,
            s.session_type,
            s.session_status,
            DATE(s.session_date) AS report_date,
            s.session_id,
            COALESCE(content.course_title, s.session_name) AS course_candidate
          FROM {refs["schedule"]} s
          LEFT JOIN content ON s.resource_id = content.unit_id
          WHERE {' AND '.join(where_clauses)}
        ),
        session_course AS (
          SELECT
            institute,
            section,
            session_type,
            session_status,
            report_date,
            session_id,
            ARRAY_AGG(course_candidate ORDER BY occurrences DESC, course_candidate LIMIT 1)[OFFSET(0)] AS course
          FROM (
            SELECT
              institute,
              section,
              session_type,
              session_status,
              report_date,
              session_id,
              course_candidate,
              COUNT(*) AS occurrences
            FROM schedule_base
            GROUP BY institute, section, session_type, session_status, report_date, session_id, course_candidate
          )
          GROUP BY institute, section, session_type, session_status, report_date, session_id
        ),
        roster AS (
          SELECT
            u.institute_name AS institute,
            COALESCE(NULLIF(TRIM(u.section_name), ''), 'Unknown') AS section,
            COUNT(DISTINCT user_id) AS students
          FROM {refs["users"]} u
          WHERE TRIM(COALESCE(u.institute_name, '')) != ''
          GROUP BY institute, section
        )
        SELECT
          sc.course AS course,
          sc.institute AS institute,
          sc.section AS section,
          sc.session_type AS session_type,
          COUNT(DISTINCT IF(sc.session_status = 'COMPLETED', sc.session_id, NULL)) AS sessions,
          COALESCE(r.students, 0) AS students,
          ROUND(
            100 * SAFE_DIVIDE(
              COUNT(DISTINCT IF(sc.session_status = 'COMPLETED', sc.session_id, NULL)),
              COUNT(DISTINCT sc.session_id)
            ),
            2
          ) AS completion,
          0 AS avg_time,
          0 AS p80_time,
          '{sql_escape(batch)}' AS batch,
          '{sql_escape(semester)}' AS semester,
          CAST(MAX(sc.report_date) AS STRING) AS report_date
        FROM session_course sc
        LEFT JOIN roster r
          ON r.institute = sc.institute
          AND r.section = sc.section
        GROUP BY course, institute, section, session_type, students
        HAVING sessions > 0
        ORDER BY institute, section, course
    """
    return run_query(sql)


def fetch_assessment_data(batch: str, semester: str) -> pd.DataFrame:
    refs = get_table_refs()
    date_expr = "DATE(COALESCE(a.submission_datetime, a.question_start_datetime))"
    where_clauses = [
        "u.user_id IS NOT NULL",
        "TRIM(COALESCE(u.institute_name, '')) != ''",
    ]
    window_clause = get_semester_window_clause(semester, batch, "u.institute_name", date_expr)
    if window_clause:
        where_clauses.append(window_clause)
    if should_apply_batch_filter(batch):
        where_clauses.append(f"LOWER(COALESCE(u.batch_name, '')) LIKE '%{sql_escape(batch.strip().lower())}%'")

    sql = f"""
        WITH users AS (
          SELECT DISTINCT
            user_id,
            institute_name,
            section_name,
            batch_name
          FROM {refs["users"]}
        ),
        content AS (
          {build_content_subquery(refs["content"])}
        )
        SELECT
          u.institute_name AS university,
          COALESCE(NULLIF(TRIM(u.section_name), ''), 'Unknown') AS section,
          COALESCE(
            content.course_title,
            COALESCE(
              NULLIF(TRIM(a.question_set_title), ''),
              CONCAT('Question Set ', CAST(a.question_set_id AS STRING))
            )
          ) AS course_code,
          COUNT(DISTINCT IF(COALESCE(a.user_score, a.actual_score) IS NOT NULL, a.user_id, NULL)) AS avg_participation,
          ROUND(AVG(COALESCE(SAFE_DIVIDE(a.user_score, NULLIF(a.actual_score, 0)), 0)), 4) AS avg_score,
          '{sql_escape(batch)}' AS batch,
          '{sql_escape(semester)}' AS semester,
          CAST(MAX({date_expr}) AS STRING) AS report_date
        FROM {refs["assessment"]} a
        JOIN users u USING (user_id)
        LEFT JOIN content ON CAST(a.question_set_id AS STRING) = content.unit_id
        WHERE {' AND '.join(where_clauses)}
          AND COALESCE(a.actual_score, 0) > 0
        GROUP BY university, section, course_code
        ORDER BY university, section, course_code
    """
    return run_query(sql)


def calc_univ_assessment(assessment_df: pd.DataFrame, univ_name: str):
    if assessment_df.empty:
        return {"avgScore": None, "avgParticipation": None}
    univ_data = assessment_df[assessment_df["university"] == univ_name]
    if univ_data.empty:
        return {"avgScore": None, "avgParticipation": None}
    sections = [section for section in sorted(univ_data["section"].dropna().unique()) if section]
    if len(sections) <= 1:
        return {
            "avgScore": float(univ_data["avg_score"].mean()),
            "avgParticipation": float(univ_data["avg_participation"].mean()),
        }
    common_courses = None
    for section in sections:
        section_courses = set(univ_data[univ_data["section"] == section]["course_code"].tolist())
        common_courses = section_courses if common_courses is None else common_courses & section_courses
    if not common_courses:
        return {"avgScore": None, "avgParticipation": None}
    section_avgs = []
    for section in sections:
        section_data = univ_data[(univ_data["section"] == section) & (univ_data["course_code"].isin(common_courses))]
        section_avgs.append(
            {
                "score": float(section_data["avg_score"].mean()),
                "participation": float(section_data["avg_participation"].mean()),
            }
        )
    return {
        "avgScore": sum(item["score"] for item in section_avgs) / len(section_avgs),
        "avgParticipation": sum(item["participation"] for item in section_avgs) / len(section_avgs),
    }


def calculate_series_data(data_df: pd.DataFrame, assessment_df: pd.DataFrame, analysis_type: str, semester: str):
    institutes = sorted(data_df["institute"].dropna().unique().tolist())
    university_metrics = []

    for institute in institutes:
        institute_df = data_df[data_df["institute"] == institute]
        sections = [section for section in sorted(institute_df["section"].dropna().unique()) if section]

        def calc_section_metric(section_df: pd.DataFrame):
            lecture_df = section_df[section_df["session_type"] == "LECTURE"]
            practice_df = section_df[section_df["session_type"] == "PRACTICE"]
            exam_df = section_df[section_df["session_type"] == "EXAM"]
            lecture_sessions = float(lecture_df["sessions"].max()) if not lecture_df.empty else 0
            practice_sessions = float(practice_df["sessions"].max()) if not practice_df.empty else 0
            exam_sessions = float(exam_df["sessions"].max()) if not exam_df.empty else 0
            return {
                "totalSessions": lecture_sessions + practice_sessions + exam_sessions,
                "classSize": float(section_df["students"].max()) if not section_df.empty else 0,
                "lectureCompletion": float(lecture_df["completion"].mean()) if not lecture_df.empty else 0,
                "practiceCompletion": float(practice_df["completion"].mean()) if not practice_df.empty else 0,
                "examCompletion": float(exam_df["completion"].mean()) if not exam_df.empty else 0,
                "avgTime": float(section_df["avg_time"].sum()),
                "p80Time": float(section_df["p80_time"].sum()),
                "practiceAvgTime": float(practice_df["avg_time"].sum()) if not practice_df.empty else 0,
                "practiceP80Time": float(practice_df["p80_time"].sum()) if not practice_df.empty else 0,
            }

        section_metrics = [calc_section_metric(institute_df[institute_df["section"] == section]) for section in sections] if sections else [calc_section_metric(institute_df)]
        average = lambda key: sum(metric[key] for metric in section_metrics) / len(section_metrics)
        assessment = calc_univ_assessment(assessment_df, institute)
        allotted_hours = get_allotted_hours(institute, semester)
        if analysis_type == "design":
            series_info = get_series_for_allotted_hours(institute, semester)
            series_name = series_info["name"] if series_info else "Unknown"
        else:
            series_name = get_series_for_value(average("totalSessions"))["name"]
        university_metrics.append(
            {
                "name": institute,
                "sectionCount": len(sections) or 1,
                "avgSessions": average("totalSessions"),
                "avgClassSize": average("classSize"),
                "avgLectureCompletion": average("lectureCompletion"),
                "avgPracticeCompletion": average("practiceCompletion"),
                "avgExamCompletion": average("examCompletion"),
                "avgOverallCompletion": (average("lectureCompletion") + average("practiceCompletion") + average("examCompletion")) / 3,
                "avgWorkload": average("avgTime"),
                "avgP80Workload": average("p80Time"),
                "avgPracticeWorkload": average("practiceAvgTime"),
                "avgPracticeP80Workload": average("practiceP80Time"),
                "series": series_name,
                "allottedHours": allotted_hours,
                "avgAssessmentScore": assessment["avgScore"],
                "avgParticipation": assessment["avgParticipation"],
            }
        )

    series_data = {}
    for series in SERIES_RANGES:
        universities = [item for item in university_metrics if item["series"] == series["name"]]
        if not universities:
            series_data[series["name"]] = {
                "universities": [],
                "avgSessions": 0,
                "avgClassSize": 0,
                "avgLectureCompletion": 0,
                "avgPracticeCompletion": 0,
                "avgExamCompletion": 0,
                "avgOverallCompletion": 0,
                "totalStudents": 0,
                "avgAssessmentScore": None,
                "avgParticipation": None,
                "avgAllottedHours": 0,
            }
            continue
        average = lambda key: sum(item[key] for item in universities) / len(universities)
        with_score = [item for item in universities if item["avgAssessmentScore"] is not None]
        with_hours = [item for item in universities if item["allottedHours"] is not None]
        series_data[series["name"]] = {
            "universities": universities,
            "avgSessions": average("avgSessions"),
            "avgClassSize": average("avgClassSize"),
            "avgLectureCompletion": average("avgLectureCompletion"),
            "avgPracticeCompletion": average("avgPracticeCompletion"),
            "avgExamCompletion": average("avgExamCompletion"),
            "avgOverallCompletion": average("avgOverallCompletion"),
            "totalStudents": sum(round(item["avgClassSize"] * item["sectionCount"]) for item in universities),
            "avgAssessmentScore": sum(item["avgAssessmentScore"] for item in with_score) / len(with_score) if with_score else None,
            "avgParticipation": sum(item["avgParticipation"] for item in with_score) / len(with_score) if with_score else None,
            "avgAllottedHours": sum(item["allottedHours"] for item in with_hours) / len(with_hours) if with_hours else 0,
        }
    return series_data


def summarize_type(course_df: pd.DataFrame, session_type: str):
    rows = course_df[course_df["session_type"] == session_type]
    if rows.empty:
        return None
    return {
        "sessions": float(rows["sessions"].sum()),
        "completion": float(rows["completion"].mean()),
        "avg_time": float(rows["avg_time"].sum()),
        "p80_time": float(rows["p80_time"].sum()),
    }


def build_university_metrics(data_df: pd.DataFrame, assessment_df: pd.DataFrame, institute: str, section: str, semester: str):
    filtered = data_df[data_df["institute"] == institute].copy()
    if section:
        filtered = filtered[filtered["section"] == section]
    if filtered.empty:
        return None
    filtered["normalized_course"] = filtered["course"].apply(lambda course: normalize_course_name(course, semester))
    lecture_df = filtered[filtered["session_type"] == "LECTURE"]
    practice_df = filtered[filtered["session_type"] == "PRACTICE"]
    exam_df = filtered[filtered["session_type"] == "EXAM"]

    course_records = []
    assessment_filtered = assessment_df[assessment_df["university"] == institute].copy()
    if section:
        assessment_filtered = assessment_filtered[assessment_filtered["section"] == section]
    assessment_filtered["normalized_course"] = assessment_filtered["course_code"].apply(lambda course: normalize_course_name(course, semester)) if not assessment_filtered.empty else []

    for course_name in sorted(filtered["normalized_course"].unique().tolist()):
        course_df = filtered[filtered["normalized_course"] == course_name]
        lecture = summarize_type(course_df, "LECTURE")
        practice = summarize_type(course_df, "PRACTICE")
        exam = summarize_type(course_df, "EXAM")
        assessment_row = assessment_filtered[assessment_filtered["normalized_course"] == course_name]
        course_records.append(
            {
                "Course": course_name,
                "Lec": round(lecture["sessions"], 2) if lecture else 0,
                "Prac": round(practice["sessions"], 2) if practice else 0,
                "Exam": round(exam["sessions"], 2) if exam else 0,
                "Total": round((lecture["sessions"] if lecture else 0) + (practice["sessions"] if practice else 0) + (exam["sessions"] if exam else 0), 2),
                "Lec %": round(lecture["completion"], 1) if lecture else None,
                "Prac %": round(practice["completion"], 1) if practice else None,
                "Exam %": round(exam["completion"], 1) if exam else None,
                "Score %": round(float(assessment_row["avg_score"].mean()) * 100, 1) if not assessment_row.empty else None,
                "Particip #": round(float(assessment_row["avg_participation"].mean()), 1) if not assessment_row.empty else None,
            }
        )

    return {
        "courseCount": len(course_records),
        "classSize": float(filtered["students"].max()),
        "lectureCount": float(lecture_df["sessions"].sum()) if not lecture_df.empty else 0,
        "practiceCount": float(practice_df["sessions"].sum()) if not practice_df.empty else 0,
        "examCount": float(exam_df["sessions"].sum()) if not exam_df.empty else 0,
        "totalSessions": float(filtered["sessions"].sum()),
        "overallCompletion": float(filtered["completion"].mean()),
        "lectureCompletion": float(lecture_df["completion"].mean()) if not lecture_df.empty else 0,
        "practiceCompletion": float(practice_df["completion"].mean()) if not practice_df.empty else 0,
        "examCompletion": float(exam_df["completion"].mean()) if not exam_df.empty else 0,
        "assessmentScore": float(assessment_filtered["avg_score"].mean() * 100) if not assessment_filtered.empty else None,
        "assessmentParticipation": float(assessment_filtered["avg_participation"].mean()) if not assessment_filtered.empty else None,
        "courseTable": pd.DataFrame(course_records),
    }


def render_metric_row(items):
    columns = st.columns(len(items))
    for column, item in zip(columns, items):
        column.metric(item["label"], item["value"])


def main():
    st.set_page_config(page_title="NIAT Analytics Streamlit", layout="wide")
    st.title("NIAT Analytics")
    st.caption("Streamlit version of the audit dashboard using the corrected BigQuery schedule-based semester data.")

    with st.sidebar:
        st.header("Filters")
        batch = st.selectbox("Batch", ["NIAT 24", "NIAT 25", "NIAT 26"], index=1)
        semester = st.selectbox("Semester", [f"Semester {index}" for index in range(1, 9)], index=0)
        analysis_type = st.radio("Analysis Type", ["design", "delivered"], format_func=lambda value: value.title())
        load_clicked = st.button("Load Data", type="primary")
        st.markdown("**Deployment note**")
        st.caption("Add your BigQuery credentials in Streamlit Cloud secrets before deploying.")

    if load_clicked or "semester_df" not in st.session_state or st.session_state.get("batch") != batch or st.session_state.get("semester") != semester:
        with st.spinner("Fetching data from BigQuery..."):
            semester_df = fetch_semester_data(batch, semester)
            assessment_df = fetch_assessment_data(batch, semester)
            st.session_state["semester_df"] = semester_df
            st.session_state["assessment_df"] = assessment_df
            st.session_state["batch"] = batch
            st.session_state["semester"] = semester

    semester_df = st.session_state.get("semester_df", pd.DataFrame())
    assessment_df = st.session_state.get("assessment_df", pd.DataFrame())

    if semester_df.empty:
        st.warning("No semester data returned. Check your secrets or selected semester.")
        st.stop()

    series_data = calculate_series_data(semester_df, assessment_df, analysis_type, semester)
    active_series = [series["name"] for series in SERIES_RANGES if series_data[series["name"]]["universities"]]
    if not active_series:
        st.warning("No active series available for the selected filters.")
        st.stop()

    series_rows = []
    for series in SERIES_RANGES:
        data = series_data[series["name"]]
        if not data["universities"]:
            continue
        series_rows.append(
            {
                "Series": series["name"],
                "Universities": len(data["universities"]),
                "Avg Sessions": round(data["avgSessions"], 1),
                "Avg Class Size": round(data["avgClassSize"], 1),
                "Overall %": round(data["avgOverallCompletion"], 1),
                "Students": int(data["totalStudents"]),
                "Avg Score %": round(data["avgAssessmentScore"] * 100, 1) if data["avgAssessmentScore"] is not None else None,
            }
        )
    series_df = pd.DataFrame(series_rows)

    render_metric_row(
        [
            {"label": "Universities", "value": int(semester_df["institute"].nunique())},
            {"label": "Sections", "value": int(semester_df["section"].nunique())},
            {"label": "Rows", "value": len(semester_df)},
            {"label": "Assessment Rows", "value": len(assessment_df)},
        ]
    )

    st.subheader("Series Overview")
    st.dataframe(series_df, use_container_width=True, hide_index=True)

    selected_series = st.selectbox("Select Series", active_series)
    universities = sorted(series_data[selected_series]["universities"], key=lambda item: item["name"])
    university_rows = pd.DataFrame(
        [
            {
                "University": item["name"],
                "Sections": item["sectionCount"],
                "Avg Sessions": round(item["avgSessions"], 1),
                "Avg Class Size": round(item["avgClassSize"], 1),
                "Lecture %": round(item["avgLectureCompletion"], 1),
                "Practice %": round(item["avgPracticeCompletion"], 1),
                "Exam %": round(item["avgExamCompletion"], 1),
                "Overall %": round(item["avgOverallCompletion"], 1),
                "Avg Score %": round(item["avgAssessmentScore"] * 100, 1) if item["avgAssessmentScore"] is not None else None,
            }
            for item in universities
        ]
    )

    st.subheader(f"Universities in Series {selected_series}")
    st.dataframe(university_rows, use_container_width=True, hide_index=True)

    selected_university = st.selectbox("Select University", [item["name"] for item in universities])
    sections = sorted(semester_df[semester_df["institute"] == selected_university]["section"].dropna().unique().tolist())
    selected_section = st.selectbox("Select Section", sections) if sections else ""
    dates = get_semester_dates_for_institute(selected_university, semester)
    university_metrics = build_university_metrics(semester_df, assessment_df, selected_university, selected_section, semester)

    st.subheader(f"{selected_university} {selected_section}")
    if dates:
        st.caption(f"Semester window: {dates['start']} to {dates['end']}")

    render_metric_row(
        [
            {"label": "Courses", "value": university_metrics["courseCount"]},
            {"label": "Students", "value": round(university_metrics["classSize"], 1)},
            {"label": "Total Sessions", "value": round(university_metrics["totalSessions"], 1)},
            {"label": "Overall Completion %", "value": round(university_metrics["overallCompletion"], 1)},
        ]
    )
    render_metric_row(
        [
            {"label": "Lecture", "value": round(university_metrics["lectureCount"], 1)},
            {"label": "Practice", "value": round(university_metrics["practiceCount"], 1)},
            {"label": "Exam", "value": round(university_metrics["examCount"], 1)},
            {"label": "Avg Score %", "value": round(university_metrics["assessmentScore"], 1) if university_metrics["assessmentScore"] is not None else "—"},
        ]
    )

    st.subheader("Course-wise Breakdown")
    st.dataframe(university_metrics["courseTable"], use_container_width=True, hide_index=True)


if __name__ == "__main__":
    main()
