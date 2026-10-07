import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Field, Notice } from "../components/UI.jsx";
import ProductPreview from "../components/ReferenceCollage.jsx";
import { post } from "../api/client.js";

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
  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result =
        mode === "invite"
          ? await post("/auth/accept-invite", {
              token: invite,
              name: form.name,
              password: form.password,
            })
          : mode === "register"
            ? await post("/auth/register", form)
            : await post("/auth/login", {
                email: form.email,
                password: form.password,
              });
      onSession(result);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setError("");
    setBusy(true);
    try {
      onSession(await post("/auth/demo"));
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  }
  const setMode = (next) => {
    setError("");
    setAccessMode(next);
  };
  const activeTheme =
    theme === "system"
      ? document.documentElement.dataset.theme || "light"
      : theme;
  const activeOrganization = session?.organizations?.find(
    (organization) => organization.id === session.activeOrganizationId,
  ) || session?.organizations?.[0];
  const accessCardTitle = session
    ? `Welcome back, ${session.user?.name?.split(" ")[0] || "Jordan"}.`
    : mode === "invite"
      ? "Join your team."
      : mode === "register"
        ? "Create your workspace."
        : "Sign in to AssetHub.";
  function toggleTheme() {
    onThemeChange(activeTheme === "dark" ? "light" : "dark");
  }
  return (
    <main className="landing landing--reference">
      <nav
        className="landing__nav reference-topbar"
        aria-label="Public navigation"
      >
        <a className="landing__brand" href="#home">
          <span className="brand-mark">
            <Icon name="box" size={26} />
          </span>
          <span>AssetHub</span>
          <i /> <small>Multi-tenant asset manager</small>
        </a>
        <div className="landing__nav-actions">
          <button
            className="landing__theme"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={activeTheme === "dark"}
            title={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
          >
            <Icon name={activeTheme === "dark" ? "sun" : "moon"} size={16} />
          </button>
          <button
            className="landing__signin"
            onClick={() => {
              if (session) {
                onOpenWorkspace();
                return;
              }
              document
                .getElementById("access-card")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {session ? "Open workspace" : "Sign in"}
          </button>
        </div>
      </nav>
      <section className="reference-stage" aria-label="AssetHub preview">
        <section className="landing__hero">
          <h1>
            Everything
            <br />
            <em>in its right place.</em>
          </h1>
          <p>
            A modern, multi-tenant asset management platform for growing
            organizations.
          </p>
          <div className="landing__features">
            <span>ASSETS</span>
            <b>·</b>
            <span>PEOPLE</span>
            <b>·</b>
            <span>LOCATIONS</span>
            <b>·</b>
            <span>LIFECYCLE</span>
          </div>
        </section>
        <ProductPreview />
      </section>
      <section id="access-card" className="access-card">
        {session ? (
          <>
            <div className="access-card__heading">
              <div>
                <span className="access-card__eyebrow">YOUR WORKSPACE</span>
                <h2>{accessCardTitle}</h2>
                <p>
                  Continue to {activeOrganization?.name || "your organization"}
                  ’s AssetHub workspace.
                </p>
              </div>
            </div>
            <div className="public-workspace-actions">
              <Button
                variant="primary"
                icon="arrow-right"
                onClick={onOpenWorkspace}
              >
                Open {activeOrganization?.name || "workspace"}
              </Button>
              <button className="text-button" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="access-card__heading">
              <div>
                <span className="access-card__eyebrow">
                  {mode === "invite"
                    ? "YOUR INVITATION"
                    : mode === "register"
                      ? "GET STARTED"
                      : "WELCOME BACK"}
                </span>
                <h2>{accessCardTitle}</h2>
                <p>
                  {mode === "invite"
                    ? "Set up your account to accept this invitation."
                    : mode === "register"
                      ? "A considered home for your organization’s equipment."
                      : "Pick up where your team left off."}
                </p>
              </div>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <form onSubmit={submit} className="access-form">
              {mode === "invite" && (
                <Notice tone="info">
                  If you already have an AssetHub account, use its existing
                  password to accept this invitation.
                </Notice>
              )}
              {(mode === "register" || mode === "invite") && (
                <Field
                  label="Your name"
                  value={form.name}
                  onChange={set("name")}
                  autoComplete="name"
                  required
                />
              )}
              {mode === "register" && (
                <Field
                  label="Organization name"
                  value={form.organizationName}
                  onChange={set("organizationName")}
                  required
                />
              )}
              {mode !== "invite" && (
                <Field
                  label="Work email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  required
                />
              )}
              <Field
                label={mode === "invite" ? "Create password" : "Password"}
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "register" ? 10 : undefined}
                maxLength={mode === "register" ? 72 : 128}
                hint={
                  mode === "login"
                    ? undefined
                    : "New accounts require at least 10 characters. Existing accounts use their current password."
                }
                required
              />
              <Button type="submit" variant="primary" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "invite"
                    ? "Accept invitation"
                    : mode === "register"
                      ? "Create workspace"
                      : "Sign in"}{" "}
                <Icon name="arrow-right" size={16} />
              </Button>
              {mode === "login" && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    icon="box"
                    disabled={busy}
                    onClick={demo}
                    aria-describedby="demo-data-disclosure"
                  >
                    {busy ? "Preparing your workspace…" : "Explore the demo"}
                  </Button>
                  <p
                    id="demo-data-disclosure"
                    className="access-form__demo-disclosure"
                  >
                    Demo content uses fictional sample data.
                  </p>
                </>
              )}
            </form>
            <div className="access-card__switch">
              {mode === "login" ? (
                <>
                  New to AssetHub?{" "}
                  <button onClick={() => setMode("register")}>
                    Create an account
                  </button>
                </>
              ) : (
                !invite && (
                  <>
                    Already have an account?{" "}
                    <button onClick={() => setMode("login")}>Sign in</button>
                  </>
                )
              )}
            </div>
          </>
        )}
      </section>
      <footer className="landing__footer">
        <span>© 2026 AssetHub</span>
        <span>BUILT FOR CLARITY · DESIGNED FOR TEAMS</span>
        <span>Private workspaces, thoughtfully managed.</span>
      </footer>
    </main>
  );
}
