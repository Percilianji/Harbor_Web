import os
import smtplib
from email.message import EmailMessage


def send_official_invite(to_email: str, official_name: str, setup_link: str) -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    from_email = os.getenv("SMTP_FROM_EMAIL", username or "no-reply@harbor.cm").strip()

    if not host or not username or not password:
        return False

    message = EmailMessage()
    message["Subject"] = "Set up your Harbor government account"
    message["From"] = from_email
    message["To"] = to_email
    message.set_content(
        f"""Hello {official_name},

A Harbor administrator created a government official account for you.

Use this secure link to create your password:
{setup_link}

If you did not expect this account, ignore this email.
"""
    )

    with smtplib.SMTP(host, port, timeout=15) as smtp:
        smtp.starttls()
        smtp.login(username, password)
        smtp.send_message(message)

    return True
