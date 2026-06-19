"""
Employer domain authentication helpers.

Supports:
  - Free/public email domain blocklist
  - Email domain extraction
  - HTML file and meta-tag verification checks
"""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urlparse

import httpx

BLOCKED_FREE_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.in",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "protonmail.com",
    "proton.me",
    "rediffmail.com",
    "ymail.com",
    "aol.com",
    "zoho.com",
    "mail.com",
    "gmx.com",
}


def extract_email_domain(email: str) -> str:
    """Return lowercase domain part of an email address."""
    return email.split("@")[-1].lower().strip()


def is_blocked_free_domain(domain: str) -> bool:
    return domain.lower().strip() in BLOCKED_FREE_DOMAINS


def is_corporate_email(email: str) -> bool:
    domain = extract_email_domain(email)
    return bool(domain) and not is_blocked_free_domain(domain)


def normalize_domain(domain: str) -> str:
    """Strip scheme/path and return bare hostname."""
    value = domain.lower().strip()
    if value.startswith("http://") or value.startswith("https://"):
        value = urlparse(value).netloc or value
    return value.removeprefix("www.").split("/")[0]


def domain_from_website(website: str) -> str:
    parsed = urlparse(website if "://" in website else f"https://{website}")
    host = (parsed.netloc or parsed.path or "").lower().removeprefix("www.")
    return host.split("/")[0]


def make_txt_record(token: str) -> str:
    return f"jobsrow-verification={token}"


def make_html_filename(token: str) -> str:
    return f"jobrows-verify-{token}.txt"


def make_meta_content(token: str) -> str:
    return token


async def check_html_file(website: str, token: str) -> bool:
    """GET https://domain/jobrows-verify-{token}.txt and compare body."""
    domain = domain_from_website(website)
    if not domain:
        return False
    filename = make_html_filename(token)
    for base in (f"https://{domain}", f"http://{domain}"):
        url = f"{base}/{filename}"
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code == 200 and resp.text.strip() == make_txt_record(token):
                    return True
        except Exception:
            continue
    return False


async def check_meta_tag(website: str, token: str) -> bool:
    """Fetch homepage HTML and look for jobsrow-verify meta tag."""
    domain = domain_from_website(website)
    if not domain:
        return False
    expected = make_meta_content(token)
    meta_pattern = re.compile(
        r'<meta[^>]+name=["\']jobsrow-verify["\'][^>]+content=["\']([^"\']+)["\']',
        re.IGNORECASE,
    )
    alt_pattern = re.compile(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']jobsrow-verify["\']',
        re.IGNORECASE,
    )
    for base in (f"https://{domain}", f"http://{domain}"):
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(base)
                if resp.status_code != 200:
                    continue
                html = resp.text
                for pattern in (meta_pattern, alt_pattern):
                    match = pattern.search(html)
                    if match and match.group(1).strip() == expected:
                        return True
        except Exception:
            continue
    return False


def trust_tier_label(tier: str, is_domain_verified: bool) -> str:
    if is_domain_verified or tier == "verified":
        return "verified"
    if tier == "pending":
        return "pending"
    return "unverified"
