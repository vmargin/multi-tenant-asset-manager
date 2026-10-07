import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Field, Notice } from "../components/UI.jsx";
import { post } from "../api/client.js";
import "./Access.css";

const DEMO_CREDENTIALS = Object.freeze({
  username: "demo@assethub.test",
  password: "AssetHubDemo!",
});

export default function Access({
  onSession,
  busy,
  setBusy,
  theme,
  onThemeChange,
  session,
  onOpenWorkspace,
  onSignOut,
}) {
  const invite = new URLSearchParams(location.search).get("invite");
  const [mode, setAccessMode] = useState(invite ? "invite" : "login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const email = form.email.trim().toLowerCase();
      const usesDemoCredentials =
        mode === "login" &&
        email === DEMO_CREDENTIALS.username &&
        form.password === DEMO_CREDENTIALS.password;

      const result =
        mode === "invite"
          ? await post("/auth/accept-invite", {
              token: invite,
              name: form.name,
              password: form.password,
            })
          : mode === "register"
            ? await post("/auth/register", { ...form, email })
            : usesDemoCredentials
              ? await post("/auth/demo")
              : await post("/auth/login", {
                  email,
                  password: form.password,
                });

      onSession(result);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemoCredentials() {
    setError("");
    setForm((current) => ({
      ...current,
      email: DEMO_CREDENTIALS.username,
      password: DEMO_CREDENTIALS.password,
    }));
    window.requestAnimationFrame(() =>
      document.getElementById("access-submit")?.focus(),
    );
  }

  const setMode = (next) => {
    setError("");
    setShowPassword(false);
    setAccessMode(next);
  };

  const activeTheme =
    theme === "system"
      ? document.documentElement.dataset.theme || "light"
      : theme;
  const activeOrganization =
    session?.organizations?.find(
      (organization) => organization.id === session.activeOrganizationId,
    ) || session?.organizations?.[0];

  function toggleTheme() {
    onThemeChange(activeTheme === "dark" ? "light" : "dark");
  }

  const panelTitle = session
    ? `Welcome back, ${session.user?.name?.split(" ")[0] || "there"}.`
    : mode === "invite"
      ? "Join your team"
      : mode === "register"
        ? "Create your workspace"
        : "Welcome back";

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <a className="auth-brand" href="/" aria-label="AssetHub home">
          <span className="auth-brand__mark">
            <Icon name="box" size={22} />
          </span>
          <span className="auth-brand__name">AssetHub</span>
          <span className="auth-brand__divider" aria-hidden="true" />
          <span className="auth-brand__context">Workspace access</span>
        </a>
        <button
          className="auth-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={activeTheme === "dark"}
          title={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
        >
          <Icon name={activeTheme === "dark" ? "sun" : "moon"} size={17} />
        </button>
      </header>

      <main className="auth-main">
        <div className="auth-layout">
          <aside className="auth-story" aria-labelledby="auth-story-title">
            <span className="auth-kicker">A CLEARER VIEW OF YOUR EQUIPMENT</span>
            <h1 id="auth-story-title">
              Every asset.
              <br />
              <em>In good hands.</em>
            </h1>
            <p className="auth-story__description">
              Keep inventory, people, and asset history together across your
              workspaces.
            </p>

            <section
              className="auth-lifecycle"
              aria-label="Asset lifecycle: available, assigned, and in service"
            >
              <span className="auth-lifecycle__label">ASSET LIFECYCLE</span>
              <div className="auth-lifecycle__steps">
                <span className="auth-step auth-step--available">
                  <i aria-hidden="true" /> Available
                </span>
                <Icon name="arrow-right" size={14} />
                <span className="auth-step auth-step--assigned">
                  <i aria-hidden="true" /> Assigned
                </span>
                <Icon name="arrow-right" size={14} />
                <span className="auth-step auth-step--service">
                  <i aria-hidden="true" /> In service
                </span>
              </div>
            </section>

            <p className="auth-story__privacy">
              <Icon name="shield" size={17} />
              <span>
                Private workspaces. Each team sees only the records it belongs
                to.
              </span>
            </p>
          </aside>

          <section
            id="auth-panel"
            className="auth-card"
            aria-labelledby="auth-panel-title"
          >
            {session ? (
              <>
                <div className="auth-card__heading">
                  <span className="auth-card__eyebrow">YOUR WORKSPACE</span>
                  <h2 id="auth-panel-title">{panelTitle}</h2>
                  <p>
                    Continue to {activeOrganization?.name || "your team"}’s
                    AssetHub workspace.
                  </p>
                </div>
                <div className="auth-session-actions">
                  <Button
                    variant="primary"
                    icon="arrow-right"
                    onClick={onOpenWorkspace}
                  >
                    Open workspace
                  </Button>
                  <button className="auth-text-action" onClick={onSignOut}>
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="auth-card__heading">
                  <span className="auth-card__eyebrow">
                    {mode === "invite"
                      ? "YOUR INVITATION"
                      : mode === "register"
                        ? "GET STARTED"
                        : "SECURE WORKSPACE ACCESS"}
                  </span>
                  <h2 id="auth-panel-title">{panelTitle}</h2>
                  <p>
                    {mode === "invite"
                      ? "Set up your account to accept this team invitation."
                      : mode === "register"
                        ? "Create a private home for your organization’s equipment."
                        : "Sign in to continue to your team’s assets and activity."}
                  </p>
                </div>

                {error && <Notice tone="error">{error}</Notice>}

                <form onSubmit={submit} className="auth-form">
                  {mode === "invite" && (
                    <Notice tone="info">
                      If you already have an AssetHub account, use your current
                      password to accept this invitation.
                    </Notice>
                  )}

                  {(mode === "register" || mode === "invite") && (
                    <Field
                      label="Your name"
                      value={form.name}
                      onChange={set("name")}
                      autoComplete="name"
                      maxLength={120}
                      required
                    />
                  )}

                  {mode === "register" && (
                    <Field
                      label="Organization name"
                      value={form.organizationName}
                      onChange={set("organizationName")}
                      autoComplete="organization"
                      maxLength={120}
                      required
                    />
                  )}

                  {mode !== "invite" && (
                    <>
                      <Field
                        id="access-email"
                        label={
                          mode === "login"
                            ? "Work email or demo username"
                            : "Work email"
                        }
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        autoComplete={mode === "login" ? "username" : "email"}
                        autoCapitalize="none"
                        spellCheck={false}
                        inputMode="email"
                        maxLength={254}
                        aria-describedby={
                          mode === "login" ? "access-email-help" : undefined
                        }
                        placeholder="you@company.com"
                        required
                      />
                      {mode === "login" && (
                        <p id="access-email-help" className="auth-field-help">
                          Use your work email or the demo username below.
                        </p>
                      )}
                    </>
                  )}

                  <div className="auth-password-control">
                    <Field
                      id="access-password"
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={set("password")}
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      minLength={mode === "register" ? 10 : undefined}
                      maxLength={mode === "register" ? 72 : 128}
                      aria-describedby={
                        mode === "login"
                          ? "access-password-help"
                          : "access-password-guidance"
                      }
                      required
                    />
                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={`${showPassword ? "Hide" : "Show"} password`}
                      aria-controls="access-password"
                      aria-pressed={showPassword}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <p
                    id={
                      mode === "login"
                        ? "access-password-help"
                        : "access-password-guidance"
                    }
                    className="auth-field-help auth-field-help--password"
                  >
                    {mode === "login"
                      ? "Forgot your password? Contact your workspace administrator for help."
                      : mode === "invite"
                        ? "Use your current password if you already have an account."
                        : "Choose at least 10 characters for your new password."}
                  </p>

                  <Button
                    id="access-submit"
                    type="submit"
                    variant="primary"
                    className="auth-submit"
                    disabled={busy}
                  >
                    {busy
                      ? mode === "login"
                        ? "Signing you in…"
                        : mode === "invite"
                          ? "Accepting invitation…"
                          : "Creating workspace…"
                      : mode === "invite"
                        ? "Accept invitation"
                        : mode === "register"
                          ? "Create workspace"
                          : "Sign in"}
                  </Button>
                </form>

                {mode === "login" && (
                  <section
                    className="auth-demo"
                    aria-labelledby="auth-demo-title"
                    aria-describedby="auth-demo-disclosure"
                  >
                    <div className="auth-demo__heading">
                      <div>
                        <span className="auth-card__eyebrow">DEMO ACCESS</span>
                        <h3 id="auth-demo-title">Explore a sample workspace</h3>
                      </div>
                      <span className="auth-demo__badge">ISOLATED</span>
                    </div>
                    <p className="auth-demo__description">
                      These credentials open a separate workspace with
                      fictional records.
                    </p>
                    <dl className="auth-demo__credentials">
                      <div>
                        <dt>Username</dt>
                        <dd>
                          <code>{DEMO_CREDENTIALS.username}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Password</dt>
                        <dd>
                          <code>{DEMO_CREDENTIALS.password}</code>
                        </dd>
                      </div>
                    </dl>
                    <Button
                      type="button"
                      variant="secondary"
                      className="auth-demo__fill"
                      disabled={busy}
                      onClick={fillDemoCredentials}
                    >
                      Fill demo credentials
                    </Button>
                    <p id="auth-demo-disclosure" className="auth-demo__note">
                      Demo records are fictional, isolated from customer
                      workspaces, and expire after 24 hours.
                    </p>
                  </section>
                )}

                {!invite && (
                  <div className="auth-mode-switch">
                    {mode === "login" ? (
                      <>
                        New to AssetHub?{" "}
                        <button type="button" onClick={() => setMode("register")}>
                          Create an account
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button type="button" onClick={() => setMode("login")}>
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="auth-footer">
        <span>© 2026 AssetHub</span>
        <span>Private workspaces · Clear asset histories</span>
      </footer>
    </div>
  );
}
