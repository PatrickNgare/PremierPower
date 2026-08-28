"""Outgoing email.

One job: tell someone a enquiry arrived. Deliberately small — stdlib smtplib,
no queue, no templates, no third-party client.

The rule that shapes everything here: **an email failure must never cost a
lead**. Every call is best-effort and swallows its exceptions, because the
enquiry is already committed by the time this runs. A site that 500s on a
contact form because a mail server was briefly unreachable loses the customer
and the record of them.
"""

import logging
import smtplib
from email.message import EmailMessage

from ..settings import settings

log = logging.getLogger("premierpower.mail")


def send(subject: str, body: str, *, reply_to: str = "") -> bool:
    """Send one plain-text message. Returns whether it went.

    Never raises. Callers are handling a request that has already succeeded.
    """
    if not settings.email_configured:
        log.info("email not configured — would have sent: %s", subject)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.mail_from
    msg["To"] = settings.notify_email
    if reply_to:
        # So hitting reply in the mail client answers the enquirer, not us.
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    try:
        if settings.smtp_port == 465:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
        with server:
            if settings.smtp_tls and settings.smtp_port != 465:
                server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        log.info("emailed %s: %s", settings.notify_email, subject)
        return True
    except Exception:
        # Logged with the traceback so a misconfiguration is diagnosable,
        # but never propagated.
        log.exception("could not send notification email: %s", subject)
        return False


def lead_notification(lead) -> tuple[str, str]:
    """The message for a new enquiry.

    Written to be readable on a phone lock screen: who, what, and a number to
    call, before anything else.
    """
    who = lead.name + (f" · {lead.company}" if lead.company else "")
    subject = f"New {lead.kind}: {who}"

    # Grouped so an absent optional field collapses its whole line rather than
    # leaving a blank one, while the gaps between groups survive.
    contact = [f"{lead.name}" + (f" at {lead.company}" if lead.company else "")]
    if lead.phone:
        contact.append(f"Phone: {lead.phone}")
    if lead.email:
        contact.append(f"Email: {lead.email}")

    about = [f"{label}: {value}" for label, value in (
        ("Project", lead.project_type), ("Area", lead.area), ("Property", lead.property),
    ) if value]

    groups = [contact, about, [lead.message or "(no message)"],
              ["—", "Reply to this email to answer them directly."]]
    body = "\n\n".join("\n".join(g) for g in groups if g)
    return subject, body
