package email

import "fmt"

func VerificationEmail(name, verifyURL string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;margin:0;padding:0;">
<div style="max-width:600px;margin:40px auto;padding:40px;background:#111;border-radius:12px;">
<h1 style="color:#AAFF45;margin-bottom:8px;">OfferDraft</h1>
<h2 style="color:#fff;font-weight:500;">Verify your email</h2>
<p style="color:#999;">Hi %s, please verify your email to get started.</p>
<a href="%s" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#AAFF45;color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Verify Email</a>
<p style="color:#555;margin-top:32px;font-size:12px;">If you didn't create an account, ignore this email.</p>
</div></body></html>`, name, verifyURL)
}

func PasswordResetEmail(name, resetURL string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;margin:0;padding:0;">
<div style="max-width:600px;margin:40px auto;padding:40px;background:#111;border-radius:12px;">
<h1 style="color:#AAFF45;margin-bottom:8px;">OfferDraft</h1>
<h2 style="color:#fff;font-weight:500;">Reset your password</h2>
<p style="color:#999;">Hi %s, click below to reset your password. This link expires in 1 hour.</p>
<a href="%s" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#AAFF45;color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
<p style="color:#555;margin-top:32px;font-size:12px;">If you didn't request this, ignore this email.</p>
</div></body></html>`, name, resetURL)
}

func WelcomeEmail(name string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;margin:0;padding:0;">
<div style="max-width:600px;margin:40px auto;padding:40px;background:#111;border-radius:12px;">
<h1 style="color:#AAFF45;margin-bottom:8px;">OfferDraft</h1>
<h2 style="color:#fff;font-weight:500;">Welcome, %s!</h2>
<p style="color:#999;">You're all set. Start creating professional offer packages in minutes.</p>
<p style="color:#555;margin-top:32px;font-size:12px;">The OfferDraft Team</p>
</div></body></html>`, name)
}

func TeamInviteEmail(agencyName, inviteURL string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;margin:0;padding:0;">
<div style="max-width:600px;margin:40px auto;padding:40px;background:#111;border-radius:12px;">
<h1 style="color:#AAFF45;margin-bottom:8px;">OfferDraft</h1>
<h2 style="color:#fff;font-weight:500;">You've been invited</h2>
<p style="color:#999;">You've been invited to join <strong>%s</strong> on OfferDraft.</p>
<a href="%s" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#AAFF45;color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invite</a>
</div></body></html>`, agencyName, inviteURL)
}
