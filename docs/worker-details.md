# CloudFlare Worker Details

This lists out the sequence diagrams and process flows for each worker

## Form Worker (1 Worker)

A single Worker handles contact form submissions. Defenses run cheapest-first so obvious garbage bails out before any network calls.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Worker as CF Worker (contact)
    participant Turnstile as Turnstile Verify API
    participant Resend as Resend API

    User->>Browser: fills out form, clicks submit
    Browser->>Worker: POST /api/contact (fields + Turnstile token)
    Worker->>Worker: honeypot empty? rate-limit OK? format valid?
    alt Local checks fail
        Worker-->>Browser: 4xx
        Browser-->>User: show error
    else Local checks pass
        Worker->>Turnstile: verify token (server-side secret)
        Turnstile-->>Worker: pass / fail
        alt Turnstile fails
            Worker-->>Browser: 4xx
            Browser-->>User: show error
        else Turnstile passes
            Worker->>Resend: send email to owner
            Resend-->>Worker: 200 OK
            Worker-->>Browser: 200 OK
            Browser-->>User: show confirmation
        end
    end
```

- Local checks (honeypot, rate-limit, format validation) run first so garbage requests never trigger an outbound API call.
- Turnstile verification uses the secret key server-side. Only the public sitekey is ever exposed in the browser.
- Resend handles email delivery to the owner. The customer's address goes in `Reply-To` so the owner can respond directly from their inbox.
- If Resend returns a 5xx (rare), the Worker propagates a 5xx so the form can surface a retry-friendly error to the user.

## CMS Auth Worker (1 Worker)

A drop-in deployment of [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) that completes the GitHub OAuth handshake for the Sveltia CMS admin UI. The client secret can't live in the browser, so this Worker is the server-side half of the [authorization code flow](https://sveltiacms.app/en/docs/backends/github#authorization-code-flow).

```mermaid
sequenceDiagram
    actor Editor
    participant Browser as Browser (Sveltia CMS)
    participant Worker as CF Worker (auth)
    participant GitHub as GitHub OAuth

    Editor->>Browser: click "Login with GitHub"
    Browser->>Worker: GET /auth (opens popup)
    Worker->>GitHub: redirect to authorize URL (client_id, scope)
    GitHub->>Editor: prompt to authorize
    Editor->>GitHub: approve
    GitHub->>Worker: GET /callback?code=...
    Worker->>GitHub: POST /access_token (code + client_secret)
    GitHub-->>Worker: access_token
    Worker-->>Browser: postMessage(token) to opener
    Browser->>Browser: store token, close popup
    Browser-->>Editor: CMS loaded, talking to GitHub directly
```

- Only runs during login, so it sits well inside free-tier limits.
- After login the browser talks straight to the GitHub API with the token — the Worker is not in the read/write path for CMS content.
- The GitHub OAuth App's client secret lives only in the Worker's environment, never in the static site bundle.
- The Ignition Intel CMS OAuth App lives under [GitHub OAuth Apps](https://github.com/settings/developers).
