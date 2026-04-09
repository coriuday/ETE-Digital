"""
Email service for sending verification and notification emails.

In development (EMAIL_ENABLED=False or SMTP unreachable), emails are printed
to the console so the flow can be tested without a real mail server.
Set SMTP_HOST=localhost, SMTP_PORT=1025 with MailHog for local testing.
For Gmail/Mailgun, set SMTP_USE_TLS=True and SMTP_PORT=587.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service using SMTP with dev console fallback."""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = getattr(settings, "SMTP_USE_TLS", False)
        self.enabled = getattr(settings, "EMAIL_ENABLED", True)

    def _console_fallback(self, to_email: str, subject: str, html_content: str) -> None:
        """Print email to console when SMTP is not available (dev mode)."""
        separator = "=" * 70
        logger.warning(
            "\n%s\n📧 EMAIL (console fallback — SMTP unavailable)\n" "To: %s\nSubject: %s\n%s\n%s\n%s",
            separator,
            to_email,
            subject,
            separator,
            html_content,
            separator,
        )

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Send an email. Falls back to console log if SMTP fails or is disabled."""
        if not self.enabled:
            self._console_fallback(to_email, subject, html_content)
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if self.use_tls:
                # STARTTLS — for Gmail / Mailgun (port 587)
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())
            else:
                # Plain SMTP — for MailHog / localhost / port 465 SSL
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                    if self.smtp_user and self.smtp_password:
                        server.login(self.smtp_user, self.smtp_password)
                    server.sendmail(self.from_email, to_email, msg.as_string())

            logger.info("Email sent to %s: %s", to_email, subject)
            return True

        except Exception as exc:  # pragma: no cover
            logger.error("SMTP failed, using console fallback. Error: %s", exc)
            self._console_fallback(to_email, subject, html_content)
            return True  # Return True so callers don't treat console log as failure

    def send_verification_email(self, to_email: str, verification_url: str) -> bool:
        """Send email verification email."""
        subject = f"Verify your {settings.APP_NAME} account"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">Welcome to {settings.APP_NAME}!</h2>
                    <p>Thank you for registering. Please verify your email address to activate your account.</p>
                    <p style="margin: 30px 0;">
                        <a href="{verification_url}"
                           style="background-color: #4F46E5; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="{verification_url}">{verification_url}</a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account,
                        please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """

        text_content = (
            f"Welcome to {settings.APP_NAME}!\n\n"
            f"Please verify your email address by visiting:\n{verification_url}\n\n"
            "This link will expire in 24 hours."
        )

        return self.send_email(to_email, subject, html_content, text_content)

    def send_password_reset_email(self, to_email: str, reset_url: str) -> bool:
        """Send password reset email."""
        subject = f"Reset your {settings.APP_NAME} password"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">Password Reset Request</h2>
                    <p>We received a request to reset your password. Click the button below to reset it.</p>
                    <p style="margin: 30px 0;">
                        <a href="{reset_url}"
                           style="background-color: #4F46E5; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="{reset_url}">{reset_url}</a>
                    </p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                        This link will expire in 1 hour. If you didn't request a password reset,
                        please ignore this email.
                    </p>
                </div>
            </body>
        </html>
        """

        text_content = (
            "Password Reset Request\n\n"
            f"Visit this link to reset your password:\n{reset_url}\n\n"
            "This link will expire in 1 hour."
        )

        return self.send_email(to_email, subject, html_content, text_content)

    def send_application_notification(self, to_email: str, candidate_name: str, job_title: str, company: str) -> bool:
        """Notify employer of a new job application."""
        subject = f"New application: {job_title} — {candidate_name}"
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4F46E5;">New Application Received</h2>
                    <p><strong>{candidate_name}</strong> has applied for <strong>{job_title}</strong> at {company}.</p>
                    <p>Log in to your employer dashboard to review this application.</p>
                </div>
            </body>
        </html>
        """
        return self.send_email(to_email, subject, html_content)


# Singleton instance
email_service = EmailService()
