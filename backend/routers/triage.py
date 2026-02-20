import os
import smtplib
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from routers.properties import get_properties
from routers.results import MOCK_PREDICTIONS, MOCK_LOCAL_SHAP, MOCK_VULNERABILITY

router = APIRouter()

TEAM_EMAILS = {
    "High": "madhu269reddi@gmail.com",
    "Mid": "madhu269reddi@gmail.com",
    "Low": "madhu269reddi@gmail.com",
}

SENDER_EMAIL = "madhu269reddi@gmail.com"
BASE_URL = os.getenv("TRIAGE_BASE_URL", "http://localhost:5173")

# Propensity by position (index 0=A=High … 5=F=Low) — matches MOCK_PREDICTIONS order
POSITION_PROPENSITY = [
    {"tier": "High", "label": "High Propensity", "score": 0.8980},
    {"tier": "High", "label": "High Propensity", "score": 0.9307},
    {"tier": "High", "label": "High Propensity", "score": 0.8465},
    {"tier": "Mid",  "label": "Mid Propensity",  "score": 0.4319},
    {"tier": "Mid",  "label": "Mid Propensity",  "score": 0.4517},
    {"tier": "Low",  "label": "Low Propensity",  "score": 0.0357},
]


class TriageRequest(BaseModel):
    submissionId: Optional[int] = None


class LetterRequest(BaseModel):
    submissionId: str
    brokerEmail: str
    brokerCompany: Optional[str] = ""
    propertyCounty: Optional[str] = ""
    letterType: str  # "intent" or "not_interested"


def _build_email(tier: str, submission_ids: list[str], today_str: str) -> MIMEMultipart:
    propensity_param = tier.lower()
    triage_url = f"{BASE_URL}/triage?propensity={propensity_param}"
    ids_str = ", ".join(submission_ids)
    count = len(submission_ids)

    subject = f"Submissions for {today_str} – {tier} Propensity"

    plain = (
        f"Dear {tier} Propensity UWT Team,\n\n"
        f"The AI underwriting agent has identified {count} submission(s) classified as "
        f"{tier} Propensity that require your review.\n\n"
        f"Submission IDs: {ids_str}\n\n"
        f"Please review the details at:\n{triage_url}\n\n"
        f"This email was sent automatically by the UWT AI Agent ({SENDER_EMAIL})."
    )

    color_map = {"High": "#16a34a", "Mid": "#d97706", "Low": "#dc2626"}
    badge_color = color_map.get(tier, "#6b7280")

    html = f"""
    <html><body style="font-family:Arial,sans-serif;color:#111827;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:{badge_color}">UWT AI Agent — {tier} Propensity Triage</h2>
      <p>Dear <strong>{tier} Propensity UWT Team</strong>,</p>
      <p>The AI underwriting agent has identified <strong>{count} submission(s)</strong>
         classified as <strong>{tier} Propensity</strong> that require your review.</p>
      <p><strong>Submission IDs:</strong> {ids_str}</p>
      <p>
        <a href="{triage_url}"
           style="display:inline-block;background:{badge_color};color:#fff;padding:10px 20px;
                  border-radius:6px;text-decoration:none;font-weight:bold">
          Review {tier} Propensity Submissions
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="font-size:12px;color:#6b7280">
        This email was sent automatically by the UWT AI Agent ({SENDER_EMAIL}).
      </p>
    </body></html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = TEAM_EMAILS[tier]
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


@router.post("/send-emails")
def send_triage_emails(request: TriageRequest):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    today_str = date.today().strftime("%b %d, %Y")

    # Build tiers using actual submission_ids from the properties API (respects CSV overrides)
    properties = get_properties()
    tiers: dict[str, list[str]] = {"High": [], "Mid": [], "Low": []}
    for i, prop in enumerate(properties[:6]):
        if i < len(POSITION_PROPENSITY):
            tier = POSITION_PROPENSITY[i]["tier"]
            tiers[tier].append(prop["submission_id"])

    tier_counts = {k: len(v) for k, v in tiers.items()}

    # If SMTP not configured, return graceful response (demo mode)
    if not smtp_host or not smtp_user or not smtp_pass:
        return {
            "status": "skipped",
            "reason": "SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS env vars",
            "tiers": tier_counts,
        }

    emails = [_build_email(tier, ids, today_str) for tier, ids in tiers.items() if ids]

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            for msg in emails:
                server.sendmail(SENDER_EMAIL, msg["To"], msg.as_string())
    except Exception as exc:
        return {"status": "error", "reason": str(exc), "tiers": tier_counts}

    return {"status": "sent", "tiers": tier_counts}


@router.post("/send-letter")
def send_letter(request: LetterRequest):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")

    broker = request.brokerCompany or "Broker"
    county = request.propertyCounty or "the property"
    sub_id = request.submissionId
    today_str = date.today().strftime("%b %d, %Y")

    if request.letterType == "intent":
        subject = f"Re: Submission {sub_id} — Letter of Intent"
        plain = (
            f"Dear {broker},\n\n"
            f"We have completed our review of submission {sub_id} for {county} "
            f"and are pleased to confirm our intent to proceed with quoting.\n\n"
            f"Our underwriting team will be in touch with further details shortly.\n\n"
            f"Regards,\nUWT Underwriting Team\n{SENDER_EMAIL}"
        )
        html = f"""
        <html><body style="font-family:Arial,sans-serif;color:#111827;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#16a34a">Letter of Intent</h2>
          <p>Dear <strong>{broker}</strong>,</p>
          <p>We have completed our review of submission <strong>{sub_id}</strong> for <strong>{county}</strong>
             and are pleased to confirm our intent to proceed with quoting.</p>
          <p>Our underwriting team will be in touch with further details shortly.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#6b7280">Regards, UWT Underwriting Team | {SENDER_EMAIL} | {today_str}</p>
        </body></html>
        """
    else:
        subject = f"Re: Submission {sub_id} — Notice of Non-Interest"
        plain = (
            f"Dear {broker},\n\n"
            f"Thank you for submitting {sub_id} for {county} for our consideration. "
            f"After careful review, we regret that we are unable to proceed with this submission at this time.\n\n"
            f"We appreciate your continued partnership and look forward to future opportunities.\n\n"
            f"Regards,\nUWT Underwriting Team\n{SENDER_EMAIL}"
        )
        html = f"""
        <html><body style="font-family:Arial,sans-serif;color:#111827;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#dc2626">Notice of Non-Interest</h2>
          <p>Dear <strong>{broker}</strong>,</p>
          <p>Thank you for submitting <strong>{sub_id}</strong> for <strong>{county}</strong> for our consideration.</p>
          <p>After careful review, we regret that we are unable to proceed with this submission at this time.</p>
          <p>We appreciate your continued partnership and look forward to future opportunities.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#6b7280">Regards, UWT Underwriting Team | {SENDER_EMAIL} | {today_str}</p>
        </body></html>
        """

    if not smtp_host or not smtp_user or not smtp_pass:
        return {"status": "skipped", "reason": "SMTP not configured"}

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = request.brokerEmail
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, request.brokerEmail, msg.as_string())
    except Exception as exc:
        return {"status": "error", "reason": str(exc)}

    return {"status": "sent"}


@router.get("/property/{submission_id}")
def get_property_result(submission_id: str):
    """Return full property result data for a given submission_id string (e.g. 'SUB0001').
    Maps the submission_id to its position index via live properties list, then returns
    the corresponding MOCK_PREDICTIONS, MOCK_LOCAL_SHAP, and MOCK_VULNERABILITY data.
    """
    properties = get_properties()
    # Find position index of this submission_id in the live properties list
    prop_index = None
    for i, prop in enumerate(properties[:6]):
        if prop.get("submission_id") == submission_id:
            prop_index = i
            break

    if prop_index is None:
        raise HTTPException(status_code=404, detail=f"Property '{submission_id}' not found")

    pred = MOCK_PREDICTIONS[prop_index]
    return {
        "submission_id": submission_id,
        "property_index": prop_index,
        "quote_propensity": pred["quote_propensity_probability"],
        "quote_propensity_label": pred["quote_propensity"],
        "total_risk_score": pred["total_risk_score"],
        "property_vulnerability_risk": pred["property_vulnerability_risk"],
        "construction_risk_score": pred["construction_risk"],
        "locality_risk": pred["locality_risk"],
        "coverage_risk": pred["coverage_risk"],
        "claim_history_risk": pred["claim_history_risk"],
        "property_condition_risk": pred["property_condition_risk"],
        "property_state": pred["property_state"],
        "occupancy_type": pred["occupancy_type"],
        "cover_type": pred["cover_type"],
        "submission_channel": pred["submission_channel"],
        "excluded": pred.get("excluded", False),
        "exclusion_reason": pred.get("exclusion_reason", None),
        "shap_values": MOCK_LOCAL_SHAP[prop_index],
        "vulnerability_data": MOCK_VULNERABILITY[prop_index],
    }
