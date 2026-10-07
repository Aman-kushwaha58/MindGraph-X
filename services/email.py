"""
MindGraph X: Email Delivery Service
General transactional notification support.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class EmailService:
    def __init__(self):
        self.provider = os.getenv("EMAIL_PROVIDER", "smtp" if os.getenv("SMTP_HOST") else "dev").lower()

    def send_notification(self, to: str, subject: str, body: str) -> dict:
        from_address = os.getenv("EMAIL_FROM", os.getenv("SMTP_USER", "MindGraph X <notifications@mindgraph.ai>"))

        if self.provider == "smtp" or os.getenv("SMTP_HOST"):
            host = os.getenv("SMTP_HOST", "smtp.gmail.com")
            port = int(os.getenv("SMTP_PORT", "587"))
            user = os.getenv("SMTP_USER", "")
            password = os.getenv("SMTP_PASS", os.getenv("SMTP_PASSWORD", ""))

            if not user or not password:
                raise ValueError("SMTP credentials missing: set SMTP_USER and SMTP_PASS")

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_address
            msg["To"] = to
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(from_address, [to], msg.as_string())

            return {"success": True, "provider": "smtp"}

        return {"success": True, "provider": "dev"}

    def send_password_reset(self, to: str, reset_url: str, expires_in_minutes: int = 15) -> dict:
        subject = "MindGraph X: Password Reset Request"
        body = (
            f"Hello,\n\n"
            f"A password reset request was received for your MindGraph X account.\n\n"
            f"Click the link below to update your password (valid for {expires_in_minutes} minutes):\n"
            f"{reset_url}\n\n"
            f"If you did not request this change, please ignore this email.\n\n"
            f"— The MindGraph X Team"
        )
        return self.send_notification(to, subject, body)


email_service = EmailService()
