"""
Email service for sending verification and notification emails.

Supports two providers:
  1. Resend (recommended — free 100/day, no credit card)
     Set EMAIL_PROVIDER=resend and RESEND_API_KEY=re_...
  2. SMTP (Gmail, Mailgun, or MailHog for local dev)
     Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD

In development (EMAIL_ENABLED=False or SMTP unreachable), emails are printed
to the console so the flow can be tested without a real mail server.
"""

import smtplib
import logging
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service with Resend + SMTP support and dev console fallback."""

    def __init__(self):
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.enabled = settings.EMAIL_ENABLED
        self.provider = getattr(settings, "EMAIL_PROVIDER", "smtp")
        self.resend_api_key = getattr(settings, "RESEND_API_KEY", None)
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.use_tls = getattr(settings, "SMTP_USE_TLS", False)

    def _console_fallback(self, to_email: str, subject: str, html_content: str) -> None:
        """Print email to console when providers are not configured (dev mode)."""
        separator = "=" * 70
        logger.warning(
            "\n%s\n📧 EMAIL (console fallback — no email provider configured)\n"
            "To: %s\nSubject: %s\n%s\n%s\n%s",
            separator, to_email, subject, separator, html_content, separator,
        )

    def _send_via_resend(self, to_email: str, subject: str, html_content: str, text_content: Optional[str]) -> bool:
        """Send via Resend HTTP API (free, reliable, easy)."""
        try:
            import urllib.request
            import json

            payload = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            if text_content:
                payload["text"] = text_content

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                "https://api.resend.com/emails",
                data=data,
                headers={
                    "Authorization": f"Bearer {self.resend_api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode())
                logger.info("Resend email sent: id=%s to=%s", result.get("id"), to_email)
                return True
        except Exception as exc:
            logger.error("Resend API failed: %s", exc)
            return False

    def _send_via_smtp(self, to_email: str, subject: str, html_content: str, text_content: Optional[str]) -> bool:
        """Send via SMTP (Gmail, Mailgun, or MailHog locally)."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if self.use_tls:
                # STARTTLS — Gmail / Mailgun port 587
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())
            elif self.smtp_port == 465:
                # SSL — Resend SMTP / port 465
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=10) as server:
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())
            else:
                # Plain SMTP — MailHog / localhost
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())

            logger.info("SMTP email sent to %s: %s", to_email, subject)
            return True
        except Exception as exc:
            logger.error("SMTP failed: %s", exc)
            return False

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send an email via configured provider. Falls back to console log if all fail."""
        if not self.enabled:
            self._console_fallback(to_email, subject, html_content)
            return True

        # Try Resend first if configured
        if self.provider == "resend" and self.resend_api_key:
            success = self._send_via_resend(to_email, subject, html_content, text_content)
            if success:
                return True
            logger.warning("Resend failed, trying SMTP fallback...")

        # Try SMTP
        if self.smtp_host != "localhost" or self.smtp_user:
            success = self._send_via_smtp(to_email, subject, html_content, text_content)
            if success:
                return True

        # Console fallback
        self._console_fallback(to_email, subject, html_content)
        return True  # Always return True — console log is not a failure

    def send_verification_email(self, to_email: str, verification_url: str) -> bool:
        """Send email verification email."""
        subject = f"Verify your {settings.APP_NAME} account"

        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 32px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Jobrows</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Your Career, Automated</p>
                    </div>
                    <div style="padding: 40px 32px;">
                        <h2 style="color: #111; margin: 0 0 16px;">Verify your email</h2>
                        <p style="color: #555; line-height: 1.7;">Welcome to Jobrows! Click the button below to verify your email address and activate your account.</p>
                        <div style="text-align: center; margin: 36px 0;">
                            <a href="{verification_url}"
                               style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 36px;
                                      text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #888; font-size: 13px;">
                            Or copy this link into your browser:<br>
                            <a href="{verification_url}" style="color: #7c3aed;">{verification_url}</a>
                        </p>
                        <p style="color: #888; font-size: 13px; margin-top: 24px;">
                            ⏰ This link expires in 24 hours.<br>
                            If you didn't create a Jobrows account, please ignore this email.
                        </p>
                    </div>
                    <div style="background: #f9f9f9; padding: 20px 32px; text-align: center; color: #aaa; font-size: 12px;">
                        © 2024 Jobrows. All rights reserved.
                    </div>
                </div>
            </body>
        </html>
        """

        text_content = (
            f"Welcome to Jobrows!\n\n"
            f"Verify your email address by visiting:\n{verification_url}\n\n"
            "This link will expire in 24 hours."
        )

        return self.send_email(to_email, subject, html_content, text_content)

    def send_password_reset_email(self, to_email: str, reset_url: str) -> bool:
        """Send password reset email."""
        subject = "Reset your Jobrows password"

        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 32px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Jobrows</h1>
                    </div>
                    <div style="padding: 40px 32px;">
                        <h2 style="color: #111; margin: 0 0 16px;">Reset your password</h2>
                        <p style="color: #555; line-height: 1.7;">We received a request to reset your password. This link is valid for 1 hour.</p>
                        <div style="text-align: center; margin: 36px 0;">
                            <a href="{reset_url}"
                               style="background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 36px;
                                      text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #888; font-size: 13px;">
                            Or copy this link:<br>
                            <a href="{reset_url}" style="color: #7c3aed;">{reset_url}</a>
                        </p>
                        <p style="color: #888; font-size: 13px; margin-top: 24px;">
                            If you didn't request a password reset, please ignore this email.
                        </p>
                    </div>
                    <div style="background: #f9f9f9; padding: 20px 32px; text-align: center; color: #aaa; font-size: 12px;">
                        © 2024 Jobrows. All rights reserved.
                    </div>
                </div>
            </body>
        </html>
        """

        text_content = (
            "Password Reset Request\n\n"
            f"Visit this link to reset your password:\n{reset_url}\n\n"
            "This link will expire in 1 hour.\n"
            "If you didn't request a password reset, please ignore this email."
        )

        return self.send_email(to_email, subject, html_content, text_content)

    def send_application_notification(self, to_email: str, candidate_name: str, job_title: str, company: str) -> bool:
        """Notify employer of a new job application."""
        subject = f"New application: {job_title} — {candidate_name}"
        html_content = f"""
        <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 32px;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">New Application</h1>
                    </div>
                    <div style="padding: 32px;">
                        <p style="color: #555; font-size: 16px; line-height: 1.7;">
                            <strong style="color: #111;">{candidate_name}</strong> has applied for
                            <strong style="color: #111;">{job_title}</strong> at {company}.
                        </p>
                        <p style="color: #555;">Log in to your employer dashboard to review this application.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, subject, html_content)


# Singleton instance
email_service = EmailService()
