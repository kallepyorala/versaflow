#!/usr/bin/env python3
"""Print the smallest-numbered open GitHub issue for the current repository."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from typing import Any


ISSUE_FIELDS = "number,title,body,url,labels,assignees,milestone,createdAt,updatedAt"


def run_gh(args: list[str]) -> Any:
    if shutil.which("gh") is None:
        raise RuntimeError("GitHub CLI `gh` is not installed or not on PATH.")

    result = subprocess.run(
        ["gh", *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode != 0:
        stderr = result.stderr.strip() or "unknown gh error"
        raise RuntimeError(stderr)

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"gh returned invalid JSON: {exc}") from exc


def names(items: Any) -> str:
    if not isinstance(items, list):
        return ""
    values = []
    for item in items:
        if isinstance(item, dict) and item.get("name"):
            values.append(str(item["name"]))
        elif isinstance(item, str):
            values.append(item)
    return ", ".join(values)


def format_markdown(issue: dict[str, Any]) -> str:
    labels = names(issue.get("labels")) or "none"
    assignees = names(issue.get("assignees")) or "none"
    milestone = issue.get("milestone")
    if isinstance(milestone, dict):
        milestone_text = milestone.get("title") or "none"
    else:
        milestone_text = "none"
    body = issue.get("body") or ""
    return "\n".join(
        [
            f"# {issue['number']}: {issue.get('title', '')}",
            "",
            f"URL: {issue.get('url', '')}",
            f"Labels: {labels}",
            f"Assignees: {assignees}",
            f"Milestone: {milestone_text}",
            "",
            "## Body",
            "",
            body,
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch the smallest-numbered open GitHub issue via gh."
    )
    parser.add_argument("--repo", help="Optional GitHub repository, such as owner/name.")
    parser.add_argument("--limit", type=int, default=1000, help="Maximum open issues to inspect.")
    parser.add_argument("--markdown", action="store_true", help="Print a readable Markdown summary.")
    args = parser.parse_args()

    list_cmd = [
        "issue",
        "list",
        "--state",
        "open",
        "--limit",
        str(args.limit),
        "--json",
        "number",
    ]
    if args.repo:
        list_cmd.extend(["--repo", args.repo])

    issues = run_gh(list_cmd)
    if not issues:
        print("No open GitHub issues found.", file=sys.stderr)
        return 2

    number = min(int(issue["number"]) for issue in issues)
    view_cmd = [
        "issue",
        "view",
        str(number),
        "--json",
        ISSUE_FIELDS,
    ]
    if args.repo:
        view_cmd.extend(["--repo", args.repo])

    issue = run_gh(view_cmd)

    # If the smallest-numbered open issue already has an assignee, treat it
    # as work-in-progress and bail out. The /code skill polls this in a loop
    # to avoid two implementers picking up the same issue at once: claiming
    # an issue (`gh issue edit N --add-assignee @me`) is the signal that
    # someone is on it.
    if issue.get("assignees"):
        if args.markdown:
            print("issue-in-progress")
        else:
            assignees = [
                a.get("login") or a.get("name")
                for a in issue["assignees"]
                if isinstance(a, dict)
            ]
            print(json.dumps(
                {
                    "status": "issue-in-progress",
                    "number": issue.get("number"),
                    "assignees": [a for a in assignees if a],
                },
                indent=2,
            ))
        return 0

    if args.markdown:
        print(format_markdown(issue))
    else:
        print(json.dumps(issue, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
