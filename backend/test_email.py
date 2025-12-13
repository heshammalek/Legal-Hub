from app.utils.email import send_email

send_email(
    "h3malik@gmail.com",
    "Test Email",
    "<h1>This is a test</h1><p>If you receive this, emails are working!</p>"
)