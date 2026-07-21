import {Resend} from 'resend'

const TO_EMAIL = 'ivan@sukhov.xyz'
// Falls back to Resend's shared sandbox sender so this works immediately
// without a verified domain; set RESEND_FROM_EMAIL once sukhov.xyz (or
// whichever domain) is verified in the Resend dashboard.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Ivan Sukhov <onboarding@resend.dev>'

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return Response.json({message: 'Missing RESEND_API_KEY environment variable.'}, {status: 500})
  }

  const {name, email, message} = await request.json()

  if (typeof message !== 'string' || !message.trim()) {
    return Response.json({message: 'Message is required.'}, {status: 400})
  }

  const senderName = typeof name === 'string' && name.trim() ? name.trim() : null
  const senderEmail = typeof email === 'string' && email.trim() ? email.trim() : null

  const resend = new Resend(apiKey)
  const {error} = await resend.emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    replyTo: senderEmail ?? undefined,
    subject: `New request from ${senderName ?? 'website visitor'}`,
    text: [
      senderName ? `Name: ${senderName}` : null,
      senderEmail ? `Email: ${senderEmail}` : null,
      '',
      message,
    ]
      .filter((line): line is string => line !== null)
      .join('\n'),
  })

  if (error) {
    return Response.json({message: error.message}, {status: 502})
  }

  // Best-effort: the visitor's own copy is a nice-to-have, not the point of
  // the submission — its failure shouldn't fail a request Ivan already got.
  if (senderEmail) {
    const {error: copyError} = await resend.emails.send({
      from: FROM_EMAIL,
      to: senderEmail,
      replyTo: TO_EMAIL,
      subject: 'Your request — a copy for your records',
      text: [
        senderName ? `Hi ${senderName},` : 'Hi,',
        '',
        "Thanks for reaching out — here's a copy of what you sent:",
        '',
        message,
        '',
        "I'll get back to you within two working days.",
      ].join('\n'),
    })
    if (copyError) console.error('send-request: visitor copy failed:', copyError)
  }

  return Response.json({sent: true})
}
