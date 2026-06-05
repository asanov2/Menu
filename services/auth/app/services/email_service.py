import asyncio
import functools
import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#FDFAF5;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;
              padding:40px 36px;border:1px solid #E8E0D0;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;font-size:22px;color:#1A1208;font-weight:700;">
        qrmenus.kz
      </div>
    </div>
    <h2 style="font-size:18px;color:#1A1208;margin:0 0 10px;">Код подтверждения</h2>
    <p style="font-size:14px;color:#A09080;margin:0 0 28px;line-height:1.65;">
      Для завершения регистрации введите этот код на сайте.<br>
      Код действителен <strong>10 минут</strong>.
    </p>
    <div style="background:#F8F0D8;border-radius:10px;padding:28px;text-align:center;
                margin-bottom:28px;">
      <span style="font-size:44px;font-weight:700;letter-spacing:14px;color:#1A1208;
                   font-family:monospace;">{code}</span>
    </div>
    <p style="font-size:12px;color:#C0B8A8;margin:0;text-align:center;line-height:1.6;">
      Если вы не регистрировались на qrmenus.kz&nbsp;&mdash; просто проигнорируйте это письмо.
    </p>
  </div>
</body>
</html>"""


async def send_verification_email(to_email: str, code: str) -> None:
    html = _HTML_TEMPLATE.format(code=code)

    def _send() -> None:
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.resend_from,
            "to": [to_email],
            "subject": "Код подтверждения qrmenus.kz",
            "html": html,
        })

    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, functools.partial(_send))
    except Exception as exc:
        logger.error("Resend failed for %s: %s", to_email, exc)
        raise
