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
        "BUSINESS_ENGLISH": "English Advanced",
        "BE": "English Advanced",
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
        "Introduction to Generative AI": [
            "generative ai",
            "introduction to generative ai",
            "workshop technology introduction to generative ai",
        ],
        "Mathematics for Computer Science": [
            "mathematics",
            "mathematics for computer science",
            "engineering mathematics 1",
            "discrete mathematics",
            "linear algebra and optimization",
            "mathematics for computing",
            "mathematics for data science i",
            "logical mathematics for software engineers i",
            "calculus and differential equations",
        ],
        "Web Application Development I": [
            "build your own static website",
            "build your own responsive website",
            "modern responsive web design",
            "responsive web design using flexbox",
            "html css",
            "web application development i",
            "web application development 1",
            "frontend development 1",
            "frontend development fundamentals",
            "fundamentals of web development",
            "web technologies",
        ],
        "Communication English Foundation": [
            "communicative english foundation",
            "communication english foundation",
            "english foundation",
            "aec 1",
            "cambridge english b1",
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
            "introduction to programming",
            "problem solving using programming i",
            "problem solving with python",
            "problem solving with python programming 1",
            "computer programming laboratory",
            "problem solving using programming i laboratory",
            "computer systems and their fundaments",
            "developer foundations",
            "introduction to computing systems",
        ],
        "Quantitative Aptitude": ["quantitative aptitude", "numerical aptitude"],
        "Applied Science": [
            "applied physics for data science",
            "basic electrical electronics engineering",
            "basic electronics",
            "fundamentals of quantum computing",
        ],
        "Foreign Language": ["foreign language 1", "foreign language - 1", "foreign language"],
        "Yoga": ["essence of yoga", "physical wellness and yoga"],
        "Indian Knowledge System": ["indian knowledge system"],
        "Co-curricular Activities": [
            "co curricular activities i",
            "co curricular activities - i",
            "induction training",
            "trans disciplinary project",
        ],
        "Environmental Science": ["mnc i evs"],
        "Human Values & Ethics": ["uhv2"],
        "Elective": ["elective i"],
        "Support Slot": ["sec 1", "vac 1", "writing practice", "professional skills for engineers"],
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
            "back end development",
            "front end full stack development",
            "frontend development 2",
            "frontend development advanced",
            "command line interfaces and scripting",
            "web application development 2 laboratory",
            "front end full stack development laboratory",
        ],
        "Database Management Systems": [
            "database management systems",
            "introduction to database",
            "introduction to databases",
            "introduction to database management systems",
            "introduction to dbms",
            "database management systems laboratory",
        ],
        "Data Structures": [
            "data structures",
            "data structures and algorithm",
            "dsa",
            "dsa foundation",
            "dsa level 1",
            "dsa extra coding questions",
            "dsa beginner",
            "niat dsa",
            "academy dsa",
            "phase 1 data structures and algorithms",
            "foundations of data structures and algorithms",
            "data structures and algorithms",
            "data structures laboratory",
            "data structures and algorithms laboratory",
            "data structures using c++",
            "object oriented programming",
            "problem solving techniques with c++",
            "datastructures and ai",
        ],
        "Numerical Aptitude": [
            "numerical aptitude",
            "quantitative aptitude",
            "logical thinking",
            "numerical ability",
            "introduction to logic",
        ],
        "English Advanced": [
            "english advanced",
            "communicative english foundation",
            "business english",
            "advanced communicative english",
            "advanced technical english",
            "communicative english advanced",
            "technical communication for engineers",
            "aec 2",
        ],
        "Large Language Models": [
            "large language models",
            "llm",
            "generative ai",
            "building llm applications",
            "foundations of generative ai",
        ],
        "Linear Algebra & Calculus": [
            "linear algebra",
            "linear algebra calculus",
            "calculus",
            "engineering mathematics 2",
            "logical mathematics for software engineers ii",
            "mathematics for problem solving",
            "probability and statistics",
        ],
        "Applied Science": [
            "applied science",
            "basic electrical engineering",
            "applied science basic electrical engineering",
            "engineering physics",
            "engineering chemistry",
            "material chemistry for cse",
            "modern physics",
            "quantum physics",
            "foundation option 1 general biology",
        ],
        "Engineering Drawing": ["computer aided engineering graphics", "engineering drawing", "design drafting"],
        "Environmental Science": [
            "environmental science",
            "environmental sciences",
            "environmental studies",
            "university slot",
        ],
        "Foreign Language": ["foreign language 2", "foreign language -2", "foreign language"],
        "Indian Constitution": ["constitution of india"],
        "Indian Knowledge System": ["indian knowledge systems", "indian knowledge system"],
        "Human Values & Ethics": ["universal human values", "human values", "human values ethics", "hvs"],
        "Yoga": ["application of yoga in mind body management", "yoga"],
        "Co-curricular Activities": ["co curricular activities - 2", "co curricular activities 2"],
        "Internship": ["internship", "trans disciplinary project"],
        "Assessment": ["assessment", "module test", "module exam", "mid exam", "mid test", "internal exam", "internal test"],
        "Language Elective": ["language elective"],
        "Support Slot": ["base 44 workshop", "vac 2", "sec 2"],
        "Cloud Computing": ["cloud computing"],
    },
}


NON_CORE_COURSES_BY_SEMESTER = {
    "Semester 1": {
        "Applied Science",
        "Co-curricular Activities",
        "Elective",
        "Environmental Science",
        "Foreign Language",
        "Human Values & Ethics",
        "Indian Knowledge System",
        "Support Slot",
        "Yoga",
    },
    "Semester 2": {
        "Applied Science",
        "Assessment",
        "Chemistry",
        "Cloud Computing",
        "Co-curricular Activities",
        "Engineering Drawing",
        "Environmental Science",
        "Foreign Language",
        "Human Values & Ethics",
        "Indian Constitution",
        "Indian Knowledge System",
        "Internship",
        "Language Elective",
        "Physics",
        "Support Slot",
        "Talent Development Program",
        "Yoga",
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


def get_date_based_available_semesters(batch: str):
    today = datetime.now().date()
    available = []
    for semester_name, windows in SEMESTER_DATES_BY_SEMESTER.items():
        shifted_starts = []
        for window in windows.values():
            shifted_start = shift_iso_date(to_iso_date(window["start"]), get_batch_year_shift(batch))
            if shifted_start:
                shifted_starts.append(datetime.strptime(shifted_start, "%Y-%m-%d").date())
        if shifted_starts and min(shifted_starts) <= today:
            available.append(semester_name)
    return sorted(available, key=lambda value: int(re.search(r"\d+", value).group()))


@st.cache_data(ttl=600, show_spinner=False)
def fetch_available_semesters_for_batch(batch: str):
    refs = get_table_refs()
    checks = []
    for semester_name in sorted(SEMESTER_DATES_BY_SEMESTER.keys(), key=lambda value: int(re.search(r"\d+", value).group())):
        where_clauses = ["TRIM(COALESCE(s.institute_name, '')) != ''"]
        window_clause = get_semester_window_clause(semester_name, batch, "s.institute_name", "DATE(s.session_date)")
        if window_clause:
            where_clauses.append(window_clause)
        if should_apply_batch_filter(batch):
            where_clauses.append(f"LOWER(COALESCE(s.batch_name, '')) LIKE '%{sql_escape(batch.strip().lower())}%'")
        checks.append(
            f"SELECT '{sql_escape(semester_name)}' AS semester, COUNT(1) AS row_count FROM {refs['schedule']} s WHERE {' AND '.join(where_clauses)}"
        )
    if not checks:
        return []
    sql = " UNION ALL ".join(checks)
    results = run_query(sql)
    available = results[results["row_count"] > 0]["semester"].tolist() if not results.empty else []
    return sorted(available, key=lambda value: int(re.search(r"\d+", value).group()))


def get_available_semesters_for_batch(batch: str):
    try:
        available = fetch_available_semesters_for_batch(batch)
        if available:
            return available
    except Exception:
        pass
    return get_date_based_available_semesters(batch)


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
                "Lecture Slots": round(lecture["sessions"], 2) if lecture else 0,
                "Practice Slots": round(practice["sessions"], 2) if practice else 0,
                "Exam Slots": round(exam["sessions"], 2) if exam else 0,
                "Total Slots": round((lecture["sessions"] if lecture else 0) + (practice["sessions"] if practice else 0) + (exam["sessions"] if exam else 0), 2),
                "Lecture %": round(lecture["completion"], 1) if lecture else None,
                "Practice %": round(practice["completion"], 1) if practice else None,
                "Exam %": round(exam["completion"], 1) if exam else None,
                "Score %": round(float(assessment_row["avg_score"].mean()) * 100, 1) if not assessment_row.empty else None,
                "Participation #": round(float(assessment_row["avg_participation"].mean()), 1) if not assessment_row.empty else None,
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


def filter_course_table(course_table: pd.DataFrame, semester: str):
    if course_table.empty:
        return course_table.copy(), 0
    filtered = course_table.copy()
    excluded_courses = NON_CORE_COURSES_BY_SEMESTER.get(semester, set())
    if excluded_courses:
        filtered = filtered[~filtered["Course"].isin(excluded_courses)].copy()
    hidden_count = len(course_table) - len(filtered)
    if filtered.empty:
        filtered = course_table.copy()
        hidden_count = 0
    filtered = filtered.sort_values(["Total Slots", "Course"], ascending=[False, True]).reset_index(drop=True)
    return filtered, hidden_count


def format_metric_value(value, decimals: int = 1, suffix: str = "", empty: str = "--") -> str:
    if value is None or pd.isna(value):
        return empty
    if isinstance(value, (int, float)):
        if decimals == 0:
            return f"{int(round(value)):,}{suffix}"
        return f"{value:,.{decimals}f}{suffix}"
    return f"{value}{suffix}"


def build_last_updated_label(*frames: pd.DataFrame) -> str:
    timestamps = []
    for frame in frames:
        if frame.empty or "report_date" not in frame.columns:
            continue
        parsed = pd.to_datetime(frame["report_date"], errors="coerce").dropna()
        if not parsed.empty:
            timestamps.append(parsed.max())
    if not timestamps:
        return "Not available"
    return max(timestamps).strftime("%d %b %Y")


def inject_custom_css():
    st.markdown(
        """
        <style>
            .stApp {
                background: linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%);
                color: #0f172a;
            }
            .block-container {
                max-width: 1320px;
                padding-top: 1.4rem;
                padding-bottom: 2.5rem;
            }
            [data-testid="stHeader"] {
                background: rgba(248, 250, 252, 0.9);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(148, 163, 184, 0.18);
            }
            [data-testid="stToolbar"] {
                right: 1rem;
            }
            [data-testid="stSidebar"] {
                background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
                border-right: 1px solid rgba(148, 163, 184, 0.2);
            }
            [data-testid="stSidebar"] * {
                color: #e2e8f0;
            }
            [data-testid="stSidebar"] [data-baseweb="select"] > div,
            [data-testid="stSidebar"] .stRadio > div {
                background: rgba(15, 23, 42, 0.58);
                border: 1px solid rgba(148, 163, 184, 0.18);
                border-radius: 14px;
            }
            [data-testid="stSidebar"] .stButton button {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                border: none;
                color: white;
                font-weight: 600;
            }
            [data-baseweb="select"] > div {
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(148, 163, 184, 0.24);
                border-radius: 14px;
                min-height: 48px;
                box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
            }
            .stSelectbox label p,
            .stRadio label p {
                font-weight: 600;
            }
            .hero-card {
                background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #38bdf8 100%);
                border-radius: 24px;
                color: white;
                padding: 28px 30px;
                box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
                margin-bottom: 12px;
            }
            .hero-eyebrow {
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                opacity: 0.8;
                text-transform: uppercase;
                margin-bottom: 8px;
            }
            .hero-title {
                font-size: 2rem;
                font-weight: 700;
                margin: 0;
            }
            .hero-subtitle {
                margin-top: 10px;
                font-size: 0.98rem;
                line-height: 1.6;
                max-width: 900px;
                color: rgba(255, 255, 255, 0.88);
            }
            .hero-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 18px;
            }
            .hero-pill {
                background: rgba(255, 255, 255, 0.14);
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 999px;
                padding: 8px 12px;
                font-size: 0.85rem;
                font-weight: 600;
            }
            .section-heading {
                margin: 0 0 2px 0;
                font-size: 1.2rem;
                font-weight: 700;
                color: #0f172a;
            }
            .section-caption {
                color: #475569;
                margin-bottom: 12px;
                font-size: 0.94rem;
            }
            .metric-card {
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid rgba(148, 163, 184, 0.22);
                border-radius: 20px;
                padding: 18px 18px 16px 18px;
                box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
                min-height: 118px;
            }
            .metric-label {
                color: #475569;
                font-size: 0.86rem;
                font-weight: 600;
                margin-bottom: 10px;
            }
            .metric-value {
                color: #0f172a;
                font-size: 1.8rem;
                font-weight: 700;
                line-height: 1.1;
                margin-bottom: 8px;
            }
            .metric-help {
                color: #64748b;
                font-size: 0.8rem;
                line-height: 1.5;
            }
            .info-card {
                background: rgba(255, 255, 255, 0.88);
                border: 1px solid rgba(148, 163, 184, 0.22);
                border-radius: 18px;
                padding: 14px 16px;
                color: #334155;
                margin-bottom: 12px;
            }
            div[data-testid="stDataFrame"] {
                border: 1px solid rgba(148, 163, 184, 0.24);
                border-radius: 18px;
                overflow: hidden;
                box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
                background: rgba(255, 255, 255, 0.94);
            }
            div[data-testid="stTabs"] [data-baseweb="tab-list"] {
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            div[data-testid="stTabs"] button {
                font-weight: 600;
                border: 1px solid rgba(148, 163, 184, 0.24);
                border-radius: 999px;
                padding: 0.55rem 1rem;
                background: rgba(255, 255, 255, 0.92);
                color: #334155;
            }
            div[data-testid="stTabs"] button[aria-selected="true"] {
                background: #eff6ff;
                color: #1d4ed8;
                border-color: rgba(59, 130, 246, 0.35);
            }
            div[data-testid="stTabs"] [data-baseweb="tab-highlight"] {
                display: none;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_section_header(title: str, caption: str):
    st.markdown(f"<div class='section-heading'>{title}</div>", unsafe_allow_html=True)
    st.markdown(f"<div class='section-caption'>{caption}</div>", unsafe_allow_html=True)


def render_metric_row(items):
    columns = st.columns(len(items))
    for column, item in zip(columns, items):
        help_text = f"<div class='metric-help'>{item.get('help', '')}</div>" if item.get("help") else ""
        column.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-label">{item['label']}</div>
                <div class="metric-value">{item['value']}</div>
                {help_text}
            </div>
            """,
            unsafe_allow_html=True,
        )


def main():
    st.set_page_config(page_title="NIAT Analytics Streamlit", layout="wide")
    inject_custom_css()

    with st.sidebar:
        st.markdown("## Audit Analysis")
        st.caption("Live Streamlit dashboard for delivery and assessment tracking.")
        batch = st.selectbox("Batch", ["NIAT 24", "NIAT 25", "NIAT 26"], index=1)
        available_semesters = get_available_semesters_for_batch(batch)
        if not available_semesters:
            st.warning(f"No configured semesters are available yet for {batch}.")
            st.caption("Future batches stay hidden until their semester windows start, so the dashboard avoids irrelevant fetches.")
            st.stop()
        default_semester = available_semesters[-1]
        previous_batch = st.session_state.get("batch")
        previous_semester = st.session_state.get("semester")
        if previous_batch == batch and previous_semester in available_semesters:
            default_semester = previous_semester
        semester = st.selectbox("Semester", available_semesters, index=available_semesters.index(default_semester))
        st.caption(f"Available for {batch}: {', '.join(available_semesters)}")
        analysis_type = st.radio("Grouping Logic", ["design", "delivered"], format_func=lambda value: value.title())
        load_clicked = st.button("Load latest data", type="primary", use_container_width=True)
        st.markdown("---")
        st.caption("Design groups universities by planned hours. Delivered groups them by completed slots.")
        st.caption("Streamlit Cloud must have BigQuery credentials in app secrets.")

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
        st.warning("No semester data returned. Check the selected filters and Streamlit Cloud secrets.")
        st.stop()

    series_data = calculate_series_data(semester_df, assessment_df, analysis_type, semester)
    active_series = [series["name"] for series in SERIES_RANGES if series_data[series["name"]]["universities"]]
    if not active_series:
        st.warning("No active series available for the selected filters.")
        st.stop()

    series_rows = []
    all_universities = []
    for series in SERIES_RANGES:
        data = series_data[series["name"]]
        if not data["universities"]:
            continue
        all_universities.extend(data["universities"])
        series_rows.append(
            {
                "Series": series["name"],
                "Universities": len(data["universities"]),
                "Students": int(data["totalStudents"]),
                "Avg Slots": round(data["avgSessions"], 1),
                "Avg Delivery %": round(data["avgOverallCompletion"], 1),
                "Avg Score %": round(data["avgAssessmentScore"] * 100, 1) if data["avgAssessmentScore"] is not None else None,
                "Avg Allotted Hours": round(data["avgAllottedHours"], 1) if data["avgAllottedHours"] else None,
            }
        )
    series_df = pd.DataFrame(series_rows)

    total_students = int(semester_df.groupby(["institute", "section"])["students"].max().sum()) if not semester_df.empty else 0
    avg_delivery = sum(item["avgOverallCompletion"] for item in all_universities) / len(all_universities)
    score_values = [item["avgAssessmentScore"] * 100 for item in all_universities if item["avgAssessmentScore"] is not None]
    avg_score = sum(score_values) / len(score_values) if score_values else None
    allotted_values = [item["allottedHours"] for item in all_universities if item["allottedHours"] is not None]
    avg_allotted_hours = sum(allotted_values) / len(allotted_values) if allotted_values else None
    last_updated = build_last_updated_label(semester_df, assessment_df)
    analysis_label = "Planned schedule bands" if analysis_type == "design" else "Delivered slot bands"

    st.markdown(
        f"""
        <div class="hero-card">
            <div class="hero-eyebrow">Audit Dashboard</div>
            <h1 class="hero-title">NIAT delivery and assessment view</h1>
            <div class="hero-subtitle">Cleaned Streamlit layout focused on series performance, university delivery, and course-level completion. Course tables hide non-core subjects where applicable so the breakdown stays readable.</div>
            <div class="hero-meta">
                <div class="hero-pill">Batch: {batch}</div>
                <div class="hero-pill">Semester: {semester}</div>
                <div class="hero-pill">Grouping: {analysis_label}</div>
                <div class="hero-pill">Last updated: {last_updated}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    top_metrics = [
        {"label": "Universities", "value": format_metric_value(semester_df["institute"].nunique(), decimals=0), "help": "Institutions with schedule data in the current view."},
        {"label": "Students", "value": format_metric_value(total_students, decimals=0), "help": "Summed section roster size using the latest section-level student counts."},
    ]
    if analysis_type == "design":
        top_metrics.append({"label": "Avg Allotted Hours", "value": format_metric_value(avg_allotted_hours, decimals=1), "help": "Average planned hours for universities in the selected design view."})
    top_metrics.extend(
        [
            {"label": "Avg Delivery %", "value": format_metric_value(avg_delivery, suffix="%"), "help": "Average university delivery across lecture, practice, and exam completion."},
            {"label": "Avg Score %", "value": format_metric_value(avg_score, suffix="%"), "help": "Average assessment score for universities with assessment data."},
        ]
    )
    render_metric_row(top_metrics)

    render_section_header("Focus selection", "Choose the series, university, and section scope before reviewing the tables below.")
    filter_col_1, filter_col_2, filter_col_3 = st.columns([1, 1.35, 1])
    with filter_col_1:
        selected_series = st.selectbox("Series", active_series)
    series_summary = series_data[selected_series]
    universities = sorted(series_summary["universities"], key=lambda item: item["name"])
    with filter_col_2:
        selected_university = st.selectbox("University", [item["name"] for item in universities])
    sections = sorted(semester_df[semester_df["institute"] == selected_university]["section"].dropna().unique().tolist())
    section_options = ["All Sections"] + sections if sections else ["All Sections"]
    with filter_col_3:
        selected_section_label = st.selectbox("Section", section_options)
    selected_section = "" if selected_section_label == "All Sections" else selected_section_label

    university_rows = pd.DataFrame(
        [
            {
                "University": item["name"],
                "Sections": item["sectionCount"],
                "Allotted Hours": round(item["allottedHours"], 1) if item["allottedHours"] is not None else None,
                "Avg Slots": round(item["avgSessions"], 1),
                "Lecture %": round(item["avgLectureCompletion"], 1),
                "Practice %": round(item["avgPracticeCompletion"], 1),
                "Exam %": round(item["avgExamCompletion"], 1),
                "Avg Delivery %": round(item["avgOverallCompletion"], 1),
                "Avg Score %": round(item["avgAssessmentScore"] * 100, 1) if item["avgAssessmentScore"] is not None else None,
                "Participation #": round(item["avgParticipation"], 1) if item["avgParticipation"] is not None else None,
            }
            for item in universities
        ]
    ).sort_values(["Avg Delivery %", "University"], ascending=[False, True]).reset_index(drop=True)

    university_metrics = build_university_metrics(semester_df, assessment_df, selected_university, selected_section, semester)
    if university_metrics is None:
        st.warning("No university data available for the current selection.")
        st.stop()
    course_table, hidden_courses = filter_course_table(university_metrics["courseTable"], semester)
    dates = get_semester_dates_for_institute(selected_university, semester)

    overview_tab, comparison_tab, detail_tab = st.tabs(["Series Overview", "University Comparison", "Course Breakdown"])

    with overview_tab:
        render_section_header("Series snapshot", "Each series groups universities by planned or delivered volume based on the selected sidebar logic.")
        series_metrics = [
            {"label": "Selected Series", "value": selected_series, "help": "Current benchmark band used for comparison."},
            {"label": "Universities in Series", "value": format_metric_value(len(universities), decimals=0), "help": "Institutions included in the selected series."},
        ]
        if analysis_type == "design":
            series_metrics.append({"label": "Series Allotted Hours", "value": format_metric_value(series_summary["avgAllottedHours"], decimals=1), "help": "Average planned hours for universities in this design series."})
        series_metrics.extend(
            [
                {"label": "Series Delivery %", "value": format_metric_value(series_summary["avgOverallCompletion"], suffix="%"), "help": "Average delivery across universities in this series."},
                {"label": "Series Score %", "value": format_metric_value(series_summary["avgAssessmentScore"] * 100 if series_summary["avgAssessmentScore"] is not None else None, suffix="%"), "help": "Average assessment score for universities in this series."},
            ]
        )
        render_metric_row(series_metrics)
        st.dataframe(
            series_df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Series": st.column_config.TextColumn("Series"),
                "Universities": st.column_config.NumberColumn("Universities", format="%d"),
                "Students": st.column_config.NumberColumn("Students", format="%d"),
                "Avg Slots": st.column_config.NumberColumn("Avg Slots", format="%.1f"),
                "Avg Delivery %": st.column_config.NumberColumn("Avg Delivery %", format="%.1f%%"),
                "Avg Score %": st.column_config.NumberColumn("Avg Score %", format="%.1f%%"),
                "Avg Allotted Hours": st.column_config.NumberColumn("Avg Allotted Hours", format="%.1f"),
            },
        )

    with comparison_tab:
        render_section_header("University benchmark", "Practice %, Exam %, and Lecture % are completion percentages. Avg Delivery % is the overall university delivery view.")
        st.dataframe(
            university_rows,
            use_container_width=True,
            hide_index=True,
            column_config={
                "University": st.column_config.TextColumn("University"),
                "Sections": st.column_config.NumberColumn("Sections", format="%d"),
                "Allotted Hours": st.column_config.NumberColumn("Allotted Hours", format="%.1f"),
                "Avg Slots": st.column_config.NumberColumn("Avg Slots", format="%.1f"),
                "Lecture %": st.column_config.NumberColumn("Lecture %", format="%.1f%%"),
                "Practice %": st.column_config.NumberColumn("Practice %", format="%.1f%%"),
                "Exam %": st.column_config.NumberColumn("Exam %", format="%.1f%%"),
                "Avg Delivery %": st.column_config.NumberColumn("Avg Delivery %", format="%.1f%%"),
                "Avg Score %": st.column_config.NumberColumn("Avg Score %", format="%.1f%%"),
                "Participation #": st.column_config.NumberColumn("Participation #", format="%.1f"),
            },
        )

    with detail_tab:
        scope_label = selected_section if selected_section else "All sections"
        render_section_header(f"{selected_university} - {scope_label}", "Detailed course view for the selected university and section scope.")
        if dates:
            st.markdown(
                f"<div class='info-card'><strong>Semester window:</strong> {dates['start']} to {dates['end']}</div>",
                unsafe_allow_html=True,
            )
        if hidden_courses:
            st.markdown(
                f"<div class='info-card'><strong>Course cleanup applied:</strong> showing {len(course_table)} focus courses and hiding {hidden_courses} support courses to keep the breakdown readable.</div>",
                unsafe_allow_html=True,
            )
        detail_metrics = [
            {"label": "Courses Shown", "value": format_metric_value(len(course_table), decimals=0), "help": "Visible courses after removing non-core subjects from the breakdown."},
            {"label": "Students", "value": format_metric_value(university_metrics["classSize"], decimals=0), "help": "Section roster size for the selected scope."},
        ]
        if analysis_type == "design":
            selected_university_meta = next((item for item in universities if item["name"] == selected_university), None)
            detail_metrics.append({"label": "Allotted Hours", "value": format_metric_value(selected_university_meta["allottedHours"] if selected_university_meta else None, decimals=1), "help": "Planned hours configured for the selected university in design mode."})
        detail_metrics.extend(
            [
                {"label": "Total Slots", "value": format_metric_value(university_metrics["totalSessions"], decimals=1), "help": "Combined lecture, practice, and exam slots."},
                {"label": "Avg Delivery %", "value": format_metric_value(university_metrics["overallCompletion"], suffix="%"), "help": "Overall completion across all session types in this scope."},
            ]
        )
        render_metric_row(detail_metrics)
        render_metric_row(
            [
                {"label": "Lecture %", "value": format_metric_value(university_metrics["lectureCompletion"], suffix="%"), "help": "Lecture completion percentage."},
                {"label": "Practice %", "value": format_metric_value(university_metrics["practiceCompletion"], suffix="%"), "help": "Practice completion percentage, not student completion."},
                {"label": "Exam %", "value": format_metric_value(university_metrics["examCompletion"], suffix="%"), "help": "Exam completion percentage."},
                {"label": "Score %", "value": format_metric_value(university_metrics["assessmentScore"], suffix="%"), "help": "Average assessment score percentage."},
                {"label": "Participation #", "value": format_metric_value(university_metrics["assessmentParticipation"], decimals=1), "help": "Average count of students who attempted the mapped assessments."},
            ]
        )
        with st.expander("Metric definitions"):
            st.markdown(
                """
                - `Avg Delivery %`: average completion view used for university-level comparison.
                - `Practice %`, `Lecture %`, `Exam %`: completion percentages for those session types.
                - `Score %`: average assessment score percentage.
                - `Participation #`: average number of learners who attempted the mapped assessments.
                """
            )
        st.dataframe(
            course_table,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Course": st.column_config.TextColumn("Course"),
                "Lecture Slots": st.column_config.NumberColumn("Lecture Slots", format="%.1f"),
                "Practice Slots": st.column_config.NumberColumn("Practice Slots", format="%.1f"),
                "Exam Slots": st.column_config.NumberColumn("Exam Slots", format="%.1f"),
                "Total Slots": st.column_config.NumberColumn("Total Slots", format="%.1f"),
                "Lecture %": st.column_config.NumberColumn("Lecture %", format="%.1f%%"),
                "Practice %": st.column_config.NumberColumn("Practice %", format="%.1f%%"),
                "Exam %": st.column_config.NumberColumn("Exam %", format="%.1f%%"),
                "Score %": st.column_config.NumberColumn("Score %", format="%.1f%%"),
                "Participation #": st.column_config.NumberColumn("Participation #", format="%.1f"),
            },
        )




if __name__ == "__main__":
    main()
