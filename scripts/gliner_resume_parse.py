#!/usr/bin/env python3
"""Test / optional resume structured extraction via GLiNER2.

Reads resume text from stdin (or --text / --file) and prints ParsedResume-like JSON.

Usage:
  .venv-gliner/bin/python scripts/gliner_resume_parse.py --file sample.txt
  echo "..." | .venv-gliner/bin/python scripts/gliner_resume_parse.py
"""
from __future__ import annotations

import argparse
import json
import sys
from typing import Any


def empty_parsed() -> dict[str, Any]:
    return {
        "contact": {},
        "summary": None,
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "languages": [],
        "meta": {"parser": "gliner2", "model": None},
    }


def _field_text(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, dict) and "text" in value:
        return str(value["text"]).strip() or None
    if isinstance(value, list) and value:
        # sometimes list of spans
        first = value[0]
        return _field_text(first)
    return str(value).strip() or None


def _list_field(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        parts = [p.strip() for p in value.replace(";", ",").split(",")]
        return [p for p in parts if p]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            t = _field_text(item)
            if t:
                out.append(t)
        return out
    return []


def map_gliner_to_parsed(result: dict[str, Any], model_id: str) -> dict[str, Any]:
    parsed = empty_parsed()
    parsed["meta"]["model"] = model_id

    # entities path
    entities = result.get("entities") or {}
    if isinstance(entities, dict):
        persons = entities.get("person") or entities.get("full_name") or []
        if persons:
            parsed["contact"]["name"] = _field_text(persons[0])
        emails = entities.get("email") or []
        if emails:
            parsed["contact"]["email"] = _field_text(emails[0])
        phones = entities.get("phone") or entities.get("phone_number") or []
        if phones:
            parsed["contact"]["phone"] = _field_text(phones[0])
        locs = entities.get("location") or []
        if locs:
            parsed["contact"]["location"] = _field_text(locs[0])
        skills = entities.get("skill") or entities.get("skills") or []
        parsed["skills"] = [_field_text(s) for s in skills if _field_text(s)]
        certs = entities.get("certification") or []
        parsed["certifications"] = [_field_text(c) for c in certs if _field_text(c)]
        langs = entities.get("language") or entities.get("languages") or []
        parsed["languages"] = [_field_text(l) for l in langs if _field_text(l)]

    # structured extract_json style
    contact_list = result.get("contact") or result.get("candidate") or []
    if isinstance(contact_list, list) and contact_list:
        c0 = contact_list[0] if isinstance(contact_list[0], dict) else {}
        for key in ("name", "email", "phone", "location", "linkedin", "website"):
            val = _field_text(c0.get(key))
            if val:
                parsed["contact"][key] = val

    summary = result.get("summary") or result.get("professional_summary")
    if isinstance(summary, list) and summary:
        parsed["summary"] = _field_text(summary[0].get("text") if isinstance(summary[0], dict) else summary[0])
    elif isinstance(summary, str):
        parsed["summary"] = summary.strip() or None
    elif isinstance(summary, dict):
        parsed["summary"] = _field_text(summary.get("text") or summary.get("content"))

    def map_jobs(key: str, out_key: str) -> None:
        items = result.get(key) or []
        if not isinstance(items, list):
            return
        mapped = []
        for item in items:
            if not isinstance(item, dict):
                continue
            if out_key == "experience":
                mapped.append(
                    {
                        "title": _field_text(item.get("title") or item.get("role") or item.get("job_title")),
                        "company": _field_text(item.get("company") or item.get("organization") or item.get("employer")),
                        "location": _field_text(item.get("location")),
                        "startDate": _field_text(item.get("start_date") or item.get("startDate") or item.get("start")),
                        "endDate": _field_text(item.get("end_date") or item.get("endDate") or item.get("end")),
                        "description": _field_text(item.get("description") or item.get("bullets") or item.get("responsibilities")),
                    }
                )
            else:
                mapped.append(
                    {
                        "institution": _field_text(item.get("institution") or item.get("school") or item.get("university")),
                        "degree": _field_text(item.get("degree") or item.get("qualification")),
                        "field": _field_text(item.get("field") or item.get("major")),
                        "startDate": _field_text(item.get("start_date") or item.get("startDate")),
                        "endDate": _field_text(item.get("end_date") or item.get("endDate") or item.get("graduation_date")),
                        "description": _field_text(item.get("description")),
                    }
                )
        if mapped:
            parsed[out_key] = mapped

    map_jobs("experience", "experience")
    map_jobs("work_experience", "experience")
    map_jobs("education", "education")

    def map_item_list(key: str) -> list[str]:
        value = result.get(key)
        if value is None:
            return []
        # extract_json often returns [{"items": [...]}]
        if isinstance(value, list) and value and isinstance(value[0], dict):
            if "items" in value[0]:
                return _list_field(value[0].get("items"))
            # list of objects with a name/text field
            out: list[str] = []
            for item in value:
                t = _field_text(item.get("name") or item.get("text") or item.get("value") or item)
                if t and not t.startswith("{"):
                    out.append(t)
            return out
        return _list_field(value)

    skills = map_item_list("skills")
    if skills:
        parsed["skills"] = skills
    certs = map_item_list("certifications")
    if certs:
        parsed["certifications"] = [c for c in certs if not c.lower().startswith("gpa")]
    langs = map_item_list("languages")
    if langs:
        parsed["languages"] = langs

    projects = result.get("projects") or []
    if isinstance(projects, list):
        parsed["projects"] = [
            {
                "name": _field_text(p.get("name") if isinstance(p, dict) else p),
                "description": _field_text(p.get("description") if isinstance(p, dict) else None),
            }
            for p in projects
            if _field_text(p.get("name") if isinstance(p, dict) else p)
        ]

    return parsed


def run_extract(text: str, model_id: str, mode: str) -> dict[str, Any]:
    from gliner2 import GLiNER2

    extractor = GLiNER2.from_pretrained(model_id)

    if mode == "entities":
        result = extractor.extract_entities(
            text,
            {
                "person": "Full name of the candidate or person",
                "email": "Email address",
                "phone": "Phone number",
                "location": "City, region, or country of residence",
                "company": "Employer or organization name",
                "job_title": "Job title or role held",
                "skill": "Professional skill, tool, or technology",
                "school": "University, college, or school name",
                "degree": "Academic degree or qualification",
                "date": "Employment or education date or date range",
                "certification": "Professional certification or license",
                "language": "Spoken or written human language",
            },
        )
        # lift entities + map job titles/companies into experience heuristically
        mapped = map_gliner_to_parsed(result, model_id)
        ents = result.get("entities") or {}
        companies = ents.get("company") or []
        titles = ents.get("job_title") or []
        if not mapped["experience"] and (companies or titles):
            n = max(len(companies), len(titles))
            exp = []
            for i in range(n):
                exp.append(
                    {
                        "company": _field_text(companies[i]) if i < len(companies) else None,
                        "title": _field_text(titles[i]) if i < len(titles) else None,
                    }
                )
            mapped["experience"] = exp
        schools = ents.get("school") or []
        degrees = ents.get("degree") or []
        if not mapped["education"] and (schools or degrees):
            n = max(len(schools), len(degrees))
            edu = []
            for i in range(n):
                edu.append(
                    {
                        "institution": _field_text(schools[i]) if i < len(schools) else None,
                        "degree": _field_text(degrees[i]) if i < len(degrees) else None,
                    }
                )
            mapped["education"] = edu
        mapped["meta"]["mode"] = "entities"
        mapped["meta"]["raw_gliner"] = result
        return mapped

    # structured JSON extraction (preferred for form fill)
    result = extractor.extract_json(
        text,
        {
            "contact": [
                "name::str::Candidate full name",
                "email::str::Email address",
                "phone::str::Phone number",
                "location::str::City and country or region",
                "linkedin::str::LinkedIn profile URL if present",
            ],
            "summary": [
                "text::str::Professional summary or profile paragraph if present",
            ],
            "experience": [
                "title::str::Job title or role",
                "company::str::Employer or organization",
                "location::str::Work location",
                "start_date::str::Start date",
                "end_date::str::End date or Present",
                "description::str::Key responsibilities or achievements",
            ],
            "education": [
                "institution::str::School or university",
                "degree::str::Degree or qualification",
                "field::str::Field of study",
                "start_date::str::Start date",
                "end_date::str::End or graduation date",
            ],
            "skills": [
                "items::list::List of professional skills and tools",
            ],
            "certifications": [
                "items::list::Professional certifications",
            ],
            "languages": [
                "items::list::Human languages spoken",
            ],
            "projects": [
                "name::str::Project name",
                "description::str::Project description",
            ],
        },
    )
    mapped = map_gliner_to_parsed(result, model_id)
    mapped["meta"]["mode"] = "extract_json"
    mapped["meta"]["raw_gliner"] = result
    return mapped


def main() -> int:
    parser = argparse.ArgumentParser(description="GLiNER2 resume structure test")
    parser.add_argument("--file", "-f", help="Path to text file")
    parser.add_argument("--text", "-t", help="Inline text")
    parser.add_argument(
        "--model",
        default="fastino/gliner2-base-v1",
        help="HF model id (default: fastino/gliner2-base-v1)",
    )
    parser.add_argument(
        "--mode",
        choices=["json", "entities"],
        default="json",
        help="extract_json (default) or entities",
    )
    parser.add_argument(
        "--no-raw-meta",
        action="store_true",
        help="Omit raw GLiNER payload from output",
    )
    args = parser.parse_args()

    if args.file:
        with open(args.file, encoding="utf-8") as fh:
            text = fh.read()
    elif args.text:
        text = args.text
    else:
        text = sys.stdin.read()

    text = text.strip()
    if not text:
        print(json.dumps({"error": "empty input"}, indent=2))
        return 1

    # Cap very long inputs for the base model context
    if len(text) > 12000:
        text = text[:12000]

    try:
        parsed = run_extract(text, args.model, args.mode)
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc), "parser": "gliner2"}, indent=2))
        return 2

    if args.no_raw_meta and isinstance(parsed.get("meta"), dict):
        parsed["meta"].pop("raw_gliner", None)

    print(json.dumps(parsed, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
