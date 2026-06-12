export async function onRequestPost({ request, env }) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'invalid email' }, { status: 400 });
    }

    // Fail loud + clear if the Cloudflare Pages env vars aren't set, instead of
    // a generic 500 that's impossible to debug from the browser.
    if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) {
      return Response.json(
        { error: 'server not configured (missing RESEND_API_KEY / RESEND_AUDIENCE_ID)' },
        { status: 500 },
      );
    }

    // Resend Contacts API: the audience id is a PATH parameter, not a body
    // field. POST /audiences/{id}/contacts with { email, unsubscribed }.
    const res = await fetch(
      `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      },
    );

    // 409 = already exists → treat as success
    if (res.ok || res.status === 409) {
      return Response.json({ ok: true });
    }

    const err = await res.json().catch(() => ({}));
    return Response.json({ error: err.message || 'resend error' }, { status: 500 });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
