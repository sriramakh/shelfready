"""Transactional email service via Resend.

Sends templated emails for key user lifecycle events:
welcome, quota warnings, and payment failures.
"""

import logging

import resend

from ..config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.resend_api_key

_FROM_EMAIL = settings.from_email
_APP_NAME = "ShelfReady"


async def send_welcome_email(to: str, name: str) -> None:
    """Send a welcome email to a newly registered user.

    Args:
        to: Recipient email address.
        name: Recipient's display name.
    """
    display_name = name or "there"
    subject = f"Welcome to {_APP_NAME}!"

    html_body = f"""\
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px;">Welcome to {_APP_NAME}, {display_name}!</h1>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    We're excited to have you on board. {_APP_NAME} helps you create
    optimized product listings, stunning images, social media content,
    and ad copy -- all powered by AI.
  </p>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    Here's how to get started:
  </p>

  <ol style="color: #333; font-size: 16px; line-height: 1.8;">
    <li><strong>Create your first listing</strong> -- Enter your product details and let AI generate optimized copy.</li>
    <li><strong>Generate product images</strong> -- Create professional product photos in seconds.</li>
    <li><strong>Amplify with social &amp; ads</strong> -- Turn listings into social posts and ad campaigns.</li>
  </ol>

  <div style="margin: 32px 0; text-align: center;">
    <a href="https://app.shelfready.app/dashboard"
       style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
      Go to Dashboard
    </a>
  </div>

  <p style="color: #666; font-size: 14px; line-height: 1.6;">
    You're currently on the <strong>Free plan</strong> with 100 requests per 5 hours.
    <a href="https://app.shelfready.app/billing" style="color: #6366f1;">Upgrade anytime</a>
    for more capacity and features.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

  <p style="color: #999; font-size: 12px;">
    &copy; {_APP_NAME} &middot; You received this email because you signed up for {_APP_NAME}.
  </p>
</div>"""

    await _send_email(to=to, subject=subject, html=html_body)
    logger.info("Welcome email sent to %s", to)


async def send_quota_warning(
    to: str,
    name: str,
    used: int,
    limit: int,
) -> None:
    """Send a quota usage warning email.

    Args:
        to: Recipient email address.
        name: Recipient's display name.
        used: Number of requests used in the current window.
        limit: Maximum requests allowed in the window.
    """
    display_name = name or "there"
    percentage = round((used / limit) * 100) if limit > 0 else 100
    remaining = max(0, limit - used)
    subject = f"You've used {percentage}% of your {_APP_NAME} quota"

    html_body = f"""\
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px;">Quota Usage Alert</h1>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    Hi {display_name},
  </p>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    You've used <strong>{used}</strong> of your <strong>{limit}</strong>
    available requests ({percentage}%). You have <strong>{remaining}</strong>
    requests remaining in this window.
  </p>

  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <div style="background-color: #e5e7eb; border-radius: 4px; height: 24px; overflow: hidden;">
      <div style="background-color: {'#ef4444' if percentage >= 90 else '#f59e0b' if percentage >= 75 else '#6366f1'}; height: 100%; width: {min(percentage, 100)}%; border-radius: 4px;"></div>
    </div>
    <p style="color: #666; font-size: 14px; margin-top: 8px; text-align: center;">
      {used} / {limit} requests used
    </p>
  </div>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    Your quota resets on a rolling 5-hour window. If you need more capacity,
    consider upgrading your plan.
  </p>

  <div style="margin: 32px 0; text-align: center;">
    <a href="https://app.shelfready.app/billing"
       style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
      Upgrade Plan
    </a>
  </div>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

  <p style="color: #999; font-size: 12px;">
    &copy; {_APP_NAME} &middot; You received this alert because your usage is approaching your plan limit.
  </p>
</div>"""

    await _send_email(to=to, subject=subject, html=html_body)
    logger.info("Quota warning email sent to %s (%d/%d used)", to, used, limit)


async def send_payment_failed(to: str, name: str) -> None:
    """Send a payment failure notification email.

    Args:
        to: Recipient email address.
        name: Recipient's display name.
    """
    display_name = name or "there"
    subject = f"Payment failed for your {_APP_NAME} subscription"

    html_body = f"""\
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 16px;">Payment Failed</h1>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    Hi {display_name},
  </p>

  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    We were unable to process your latest payment for your {_APP_NAME}
    subscription. This can happen if your card has expired or if there
    are insufficient funds.
  </p>

  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #991b1b; font-size: 14px; margin: 0;">
      <strong>Action Required:</strong> Please update your payment method
      to avoid service interruption. Your subscription features will remain
      active for a short grace period while we retry the payment.
    </p>
  </div>

  <div style="margin: 32px 0; text-align: center;">
    <a href="https://app.shelfready.app/billing"
       style="background-color: #ef4444; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
      Update Payment Method
    </a>
  </div>

  <p style="color: #666; font-size: 14px; line-height: 1.6;">
    If you believe this is an error or need assistance, please contact
    our support team at
    <a href="mailto:support@shelfready.app" style="color: #6366f1;">support@shelfready.app</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

  <p style="color: #999; font-size: 12px;">
    &copy; {_APP_NAME} &middot; You received this email because a payment for your subscription could not be processed.
  </p>
</div>"""

    await _send_email(to=to, subject=subject, html=html_body)
    logger.info("Payment failed email sent to %s", to)


async def _send_email(to: str, subject: str, html: str) -> None:
    """Send an email via the Resend API.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        html: HTML email body.

    Raises:
        RuntimeError: If the email fails to send.
    """
    try:
        resend.Emails.send(
            {
                "from": _FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        raise RuntimeError(
            f"Failed to send email to {to}. Please try again."
        ) from exc
