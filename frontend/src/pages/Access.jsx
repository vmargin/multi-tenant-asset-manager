import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { Button, Field, Notice } from "../components/UI.jsx";
import { post } from "../api/client.js";

export default function Access({ onSession, busy, setBusy }) {
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
  const previewDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return (
    <main className="landing">
      <nav className="landing__nav">
        <a className="landing__brand" href="#home">
          <span className="brand-mark">
            <Icon name="box" size={26} />
          </span>
          <span>AssetHub</span>
          <i /> <small>Asset management, in order.</small>
        </a>
        <button
          className="landing__signin"
          onClick={() =>
            document
              .getElementById("access-card")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Sign in <Icon name="arrow-right" size={15} />
        </button>
      </nav>
      <div className="landing__content">
        <section className="landing__hero">
          <div className="landing__kicker">
            <span /> THE ORGANIZED WAY TO MANAGE EQUIPMENT
          </div>
          <h1>
            Everything in <em>its right place.</em>
          </h1>
          <p>
            A modern, multi-tenant asset management platform for growing
            organizations. Track equipment, people, and lifecycle in one calm
            workspace.
          </p>
          <div className="landing__actions">
            <Button
              variant="primary"
              icon="arrow-right"
              disabled={busy}
              onClick={demo}
            >
              {busy ? "Preparing your workspace…" : "Explore the demo"}
            </Button>
            <button className="text-button" onClick={() => setMode("register")}>
              Create an organization <Icon name="arrow-up-right" size={15} />
            </button>
          </div>
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
        <section
          className="landing__preview"
          aria-label="Illustrative workspace preview"
        >
          <div className="preview-window">
            <div className="preview-top">
              <span className="brand-mark">
                <Icon name="box" size={17} />
              </span>
              <strong>Acme Studio</strong>
              <span className="preview-search">
                <Icon name="search" size={13} /> Search assets, people, or
                requests…
              </span>
              <span className="preview-avatar">JD</span>
            </div>
            <div className="preview-layout">
              <div className="preview-nav">
                <b>▧ &nbsp; Dashboard</b>
                <span>□ &nbsp; Assets</span>
                <span>⌖ &nbsp; Locations</span>
                <span>♙ &nbsp; People</span>
                <span>◷ &nbsp; Requests</span>
                <span>☷ &nbsp; Reports</span>
              </div>
              <div className="preview-main">
                <div className="preview-welcome">
                  <span>
                    <small>{previewDate.toUpperCase()}</small>
                    <strong>Good morning, Jordan.</strong>
                  </span>
                  <span className="preview-range">Last 30 days⌄</span>
                </div>
                <div className="preview-stats">
                  <div>
                    <small>Total assets</small>
                    <b>248</b>
                    <i>↑ 8.2%</i>
                  </div>
                  <div>
                    <small>Assigned</small>
                    <b>176</b>
                    <i>71%</i>
                  </div>
                  <div>
                    <small>Available</small>
                    <b>56</b>
                    <i>23%</i>
                  </div>
                  <div>
                    <small>Maintenance</small>
                    <b>16</b>
                    <i>6%</i>
                  </div>
                </div>
                <div className="preview-bottom">
                  <div className="preview-chart">
                    <small>Asset activity</small>
                    <svg
                      viewBox="0 0 400 120"
                      role="img"
                      aria-label="Illustrative activity chart"
                    >
                      <path
                        d="M5 100 C35 90 40 57 75 70 S120 93 150 49 S190 80 220 51 S258 65 290 35 S329 70 355 26 S380 42 400 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        d="M5 100 C35 90 40 57 75 70 S120 93 150 49 S190 80 220 51 S258 65 290 35 S329 70 355 26 S380 42 400 14 L400 120 L5 120Z"
                        fill="currentColor"
                        opacity=".07"
                      />
                    </svg>
                    <div className="preview-axis">
                      <span>Sep 1</span>
                      <span>Sep 10</span>
                      <span>Sep 20</span>
                      <span>Sep 30</span>
                    </div>
                  </div>
                  <div className="preview-activity">
                    <small>Recent activity</small>
                    <p>
                      <i className="activity-dot" /> MacBook Pro checked out{" "}
                      <b>2h</b>
                    </p>
                    <p>
                      <i className="activity-dot activity-dot--gold" />{" "}
                      Maintenance request created <b>4h</b>
                    </p>
                    <p>
                      <i className="activity-dot activity-dot--slate" /> Asset
                      moved to Floor 2 <b>1d</b>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="preview-note">
            <span className="preview-note__cube">
              <Icon name="box" size={18} />
            </span>
            <span>
              <b>Every detail, accounted for.</b>
              <small>From first purchase to final return.</small>
            </span>
          </div>
        </section>
        <section id="access-card" className="access-card">
          <div className="access-card__heading">
            <div>
              <span className="access-card__eyebrow">
                {mode === "invite"
                  ? "YOUR INVITATION"
                  : mode === "register"
                    ? "GET STARTED"
                    : "WELCOME BACK"}
              </span>
              <h2>
                {mode === "invite"
                  ? "Join your team."
                  : mode === "register"
                    ? "Create your workspace."
                    : "Sign in to AssetHub."}
              </h2>
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
        </section>
      </div>
      <footer className="landing__footer">
        <span>© 2026 AssetHub</span>
        <span>BUILT FOR CLARITY · DESIGNED FOR TEAMS</span>
        <span>Private workspaces, thoughtfully managed.</span>
      </footer>
    </main>
  );
}
