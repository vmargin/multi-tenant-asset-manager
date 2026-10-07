import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./components/Icon.jsx";
import { AssetVisual } from "./components/AssetVisual.jsx";
import {
  Button,
  Dialog,
  EmptyState,
  Loading,
  Notice,
  PersonAvatar,
  Status,
} from "./components/UI.jsx";
import Access from "./pages/Access.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AssetsPage from "./pages/AssetsPage.jsx";
import {
  AuditsPage,
  CategoriesPage,
  LocationsPage,
  PeoplePage,
  ReportsPage,
  RequestsPage,
  SettingsPage,
} from "./pages/Operations.jsx";
import {
  clearSession,
  getStoredSession,
  get,
  saveSession,
} from "./api/client.js";
import { mayManage, titleCase } from "./lib/format.js";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      ["dashboard", "layout-dashboard", "Dashboard"],
      ["assets", "box", "Assets"],
      ["locations", "map-pin", "Locations"],
      ["people", "users", "People & access"],
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      ["requests", "wrench", "Maintenance"],
      ["audits", "clipboard-check", "Audits"],
      ["categories", "tag", "Categories & tags"],
    ],
  },
  {
    label: "INSIGHTS",
    items: [["reports", "chart-no-axes-combined", "Reports"]],
  },
];
function parseHash() {
  let raw = location.hash.replace(/^#\/?/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return { page: "missing", id: null };
  }
  if (!raw || raw === "home") return { page: "dashboard", id: null };
  const [page, ...tail] = raw.split("/");
  return { page, id: tail.join("/") || null };
}
function resolvedTheme(preference) {
  return preference === "system"
    ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : preference || "light";
}
function getTheme() {
  try {
    return localStorage.getItem("assethub.theme") || "system";
  } catch {
    return "light";
  }
}
function setThemePreference(value) {
  localStorage.setItem("assethub.theme", value);
  document.documentElement.dataset.theme = resolvedTheme(value);
}

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());
  const [workspace, setWorkspace] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(getStoredSession()));
  const [fatal, setFatal] = useState("");
  const [route, setRoute] = useState(parseHash);
  const [theme, setTheme] = useState(getTheme);
  const [overlay, setOverlay] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [notice, setNotice] = useState("");
  const sidebarRef = useRef(null);
  const priorFocus = useRef(null);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const refresh = useCallback(async () => {
    setFatal("");
    const data = await get("/workspace");
    const enriched = { ...data, currentUser: getStoredSession()?.user };
    setWorkspace(enriched);
    const saved = getStoredSession();
    if (saved?.activeOrganizationId === data.organization.id) {
      const updated = {
        ...saved,
        organizations: saved.organizations.map((org) =>
          org.id === data.organization.id
            ? {
                ...org,
                name: data.organization.name,
                slug: data.organization.slug,
                role: data.role,
              }
            : org,
        ),
      };
      saveSession(updated);
      setSession(updated);
    }
    return enriched;
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme(theme);
  }, [theme]);
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const onExpire = () => {
      setSession(null);
      setWorkspace(null);
      setLoading(false);
    };
    window.addEventListener("assethub:session-expired", onExpire);
    return () =>
      window.removeEventListener("assethub:session-expired", onExpire);
  }, []);
  useEffect(() => {
    if (!session?.token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const current = await get("/auth/me");
        if (!active) return;
        const saved = getStoredSession() || {};
        const restored = {
          ...saved,
          user: current.user,
          organizations: current.organizations || saved.organizations || [],
          activeOrganizationId: current.organizations.some(
            (org) => org.id === saved.activeOrganizationId,
          )
            ? saved.activeOrganizationId
            : current.activeOrganizationId,
        };
        saveSession(restored);
        setSession(restored);
        const data = await get("/workspace");
        if (active) setWorkspace({ ...data, currentUser: restored.user });
      } catch (error) {
        if (active) {
          setFatal(error.message);
          if (!getStoredSession()) {
            setSession(null);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.token, session?.activeOrganizationId]);
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () =>
      (document.documentElement.dataset.theme = media.matches
        ? "dark"
        : "light");
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [theme]);
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOverlay("search");
        setTimeout(() => document.getElementById("global-search")?.focus(), 0);
      }
      if (event.key === "Escape") {
        if (overlay) setOverlay("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlay]);
  useEffect(() => {
    if (!mobileOpen) {
      if (!document.querySelector("dialog[open]"))
        priorFocus.current?.focus?.();
      priorFocus.current = null;
      return;
    }
    priorFocus.current = document.activeElement;
    const root = sidebarRef.current;
    const focusable = () =>
      root?.querySelectorAll(
        'button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]',
      ) || [];
    focusable()[0]?.focus();
    const trap = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(focusable());
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
    };
  }, [mobileOpen]);
  const changeRoute = useCallback((path) => {
    location.hash = path === "dashboard" ? "#dashboard" : `#${path}`;
    setOverlay("");
    setMobileOpen(false);
  }, []);
  const onSession = (sessionValue) => {
    const saved = saveSession(sessionValue);
    setSession(saved);
    setWorkspace(null);
    setFatal("");
    setLoading(true);
    history.replaceState(null, "", `${location.origin}/#dashboard`);
    setRoute({ page: "dashboard", id: null });
  };
  const chooseOrganization = (id) => {
    if (!session) return;
    const updated = { ...session, activeOrganizationId: id };
    saveSession(updated);
    setSession(updated);
    setWorkspace(null);
    setLoading(true);
    setOverlay("");
  };
  const logout = () => {
    clearSession();
    setSession(null);
    setWorkspace(null);
    setFatal("");
    setOverlay("");
    changeRoute("home");
  };
  const canManage = mayManage(workspace?.role);
  const isOwner = workspace?.role === "OWNER";
  const notifications = useMemo(
    () => workspace?.activity || [],
    [workspace?.activity],
  );
  const readKey = workspace?.organization?.id
    ? `assethub.notifications.${workspace.organization.id}`
    : "";
  let readIds = [];
  try {
    readIds = JSON.parse(localStorage.getItem(readKey) || "[]");
  } catch {
    readIds = [];
  }
  function markRead(id) {
    const next = [...new Set([...readIds, id])];
    localStorage.setItem(readKey, JSON.stringify(next));
    setNotice("Notification marked as read.");
    setWorkspace({ ...workspace });
  }
  function markAllRead() {
    localStorage.setItem(
      readKey,
      JSON.stringify(notifications.map((n) => n.id)),
    );
    setNotice("All notifications marked as read.");
    setWorkspace({ ...workspace });
  }
  const unreadCount = notifications.filter(
    (item) => !readIds.includes(item.id),
  ).length;
  const searchRows = useMemo(() => {
    if (!workspace) return [];
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      ...(workspace.assets || [])
        .filter((a) =>
          [a.name, a.assetTag, a.serialNumber, a.model].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q),
          ),
        )
        .map((a) => ({
          type: "Asset",
          title: a.name,
          subtitle: a.assetTag,
          icon: "box",
          path: `assets/${a.id}`,
          asset: a,
        })),
      ...(workspace.people || [])
        .filter((p) =>
          [p.name, p.email, p.department].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q),
          ),
        )
        .map((p) => ({
          type: "Person",
          title: p.name,
          subtitle: p.email,
          icon: "users",
          path: "people",
          person: p,
        })),
      ...(workspace.locations || [])
        .filter((p) =>
          [p.name, p.address].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q),
          ),
        )
        .map((p) => ({
          type: "Location",
          title: p.name,
          subtitle: p.address,
          icon: "map-pin",
          path: "locations",
        })),
      ...(workspace.requests || [])
        .filter((p) =>
          [p.title, p.description].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(q),
          ),
        )
        .map((p) => ({
          type: "Request",
          title: p.title,
          subtitle: titleCase(p.status),
          icon: "wrench",
          path: "requests",
        })),
    ].slice(0, 12);
  }, [workspace, search]);
  const orgResults = (session?.organizations || []).filter((org) =>
    `${org.name} ${org.slug}`
      .toLowerCase()
      .includes(organizationSearch.toLowerCase()),
  );
  if (!session || new URLSearchParams(location.search).get("invite"))
    return <Access onSession={onSession} busy={busy} setBusy={setBusy} />;
  if (loading && !workspace)
    return (
      <div className="workspace-loading">
        <Loading />
      </div>
    );
  if (!workspace)
    return (
      <main className="fatal-state">
        <div className="fatal-card">
          <span className="brand-mark">
            <Icon name="box" size={24} />
          </span>
          <h1>We couldn’t load this workspace.</h1>
          <p>
            {fatal ||
              "There was a problem loading your saved organization data."}
          </p>
          <div>
            <Button
              variant="primary"
              icon="refresh-cw"
              onClick={() => {
                setLoading(true);
                refresh()
                  .then(setWorkspace)
                  .catch((e) => setFatal(e.message))
                  .finally(() => setLoading(false));
              }}
            >
              Try again
            </Button>
            <Button onClick={logout}>Sign out</Button>
          </div>
        </div>
      </main>
    );
  const title =
    navGroups
      .flatMap((group) => group.items)
      .find(([key]) => key === route.page)?.[2] ||
    { settings: "Settings", notifications: "Notifications" }[route.page] ||
    "Asset details";
  return (
    <div className="app-shell">
      <aside
        ref={sidebarRef}
        className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? "true" : undefined}
        aria-label={mobileOpen ? "Navigation menu" : undefined}
      >
        <div className="sidebar__brand">
          <span className="brand-mark">
            <Icon name="box" size={22} />
          </span>
          <span>
            <b>AssetHub</b>
            <small>WORKSPACE</small>
          </span>
          <button
            className="sidebar-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <button
          className="org-switch"
          onClick={() => {
            setOrganizationSearch("");
            setMobileOpen(false);
            setOverlay("organization");
          }}
          aria-haspopup="dialog"
        >
          <span className="org-avatar">
            <Icon name="building-2" size={17} />
          </span>
          <span>
            <b>{workspace.organization?.name || "Workspace"}</b>
            <small>
              {workspace.role === "OWNER"
                ? "Owner workspace"
                : titleCase(workspace.role)}
            </small>
          </span>
          <Icon name="chevron-down" size={15} />
        </button>
        <nav className="sidebar__nav" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div className="sidebar__group" key={group.label}>
              <span className="sidebar__label">{group.label}</span>
              {group.items.map(([key, icon, label]) => (
                <button
                  key={key}
                  className={`sidebar__link${route.page === key ? " is-active" : ""}`}
                  aria-current={route.page === key ? "page" : undefined}
                  onClick={() => changeRoute(key)}
                >
                  <Icon name={icon} size={17} />
                  <span>{label}</span>
                  {key === "requests" &&
                    workspace.requests?.filter((r) => r.status !== "RESOLVED")
                      .length > 0 && (
                      <i className="sidebar__count">
                        {
                          workspace.requests.filter(
                            (r) => r.status !== "RESOLVED",
                          ).length
                        }
                      </i>
                    )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button
            className={`sidebar__link${route.page === "settings" ? " is-active" : ""}`}
            onClick={() => changeRoute("settings")}
          >
            <Icon name="settings" size={17} />
            <span>Settings</span>
          </button>
          <div className="sidebar-profile">
            <PersonAvatar
              person={workspace.currentUser || session.user}
              size={34}
            />
            <span>
              <b>
                {workspace.currentUser?.name || session.user?.name || "Account"}
              </b>
              <small>
                {workspace.currentUser?.email || session.user?.email}
              </small>
            </span>
            <button
              className="icon-button"
              aria-label="Account menu"
              onClick={() => setOverlay("account")}
            >
              <Icon name="ellipsis" size={18} />
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <main className="main-column" inert={mobileOpen}>
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" size={20} />
          </button>
          <button
            className="topbar__workspace"
            onClick={() => {
              setOrganizationSearch("");
              setOverlay("organization");
            }}
          >
            <Icon name="box" size={17} />
            <span>{workspace.organization?.name || "Workspace"}</span>
            <Icon name="chevron-down" size={14} />
          </button>
          <button
            className="global-search-trigger"
            onClick={() => {
              setSearch("");
              setOverlay("search");
            }}
          >
            <Icon name="search" size={16} />
            <span>Search assets, people, or requests…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar__actions">
            <button
              className="icon-button notification-trigger"
              aria-label={`Notifications, ${unreadCount} unread`}
              onClick={() => {
                setFilter("ALL");
                setOverlay("notifications");
              }}
            >
              <Icon name="bell" size={18} />
              {unreadCount > 0 && <i />}
            </button>
            <button
              className="account-trigger"
              aria-label="Account menu"
              onClick={() => setOverlay("account")}
            >
              <PersonAvatar
                person={workspace.currentUser || session.user}
                size={30}
              />
              <Icon name="chevron-down" size={13} />
            </button>
          </div>
        </header>
        <section className="main-content" aria-label={title}>
          {fatal && (
            <Notice tone="error">
              {fatal}{" "}
              <button className="text-button" onClick={refresh}>
                Retry
              </button>
            </Notice>
          )}
          {route.page === "dashboard" && (
            <Dashboard workspace={workspace} navigate={changeRoute} />
          )}
          {route.page === "assets" && (
            <AssetsPage
              workspace={workspace}
              canManage={canManage}
              refresh={refresh}
              navigate={changeRoute}
              detailId={route.id}
            />
          )}
          {route.page === "locations" && (
            <LocationsPage
              workspace={workspace}
              canManage={canManage}
              refresh={refresh}
            />
          )}
          {route.page === "people" && (
            <PeoplePage
              workspace={workspace}
              canManage={isOwner}
              refresh={refresh}
            />
          )}
          {route.page === "requests" && (
            <RequestsPage
              workspace={workspace}
              canManage={canManage}
              refresh={refresh}
            />
          )}
          {route.page === "audits" && (
            <AuditsPage
              workspace={workspace}
              canManage={canManage}
              refresh={refresh}
            />
          )}
          {route.page === "categories" && (
            <CategoriesPage
              workspace={workspace}
              canManage={canManage}
              refresh={refresh}
            />
          )}
          {route.page === "reports" && <ReportsPage workspace={workspace} />}
          {route.page === "settings" && (
            <SettingsPage
              workspace={workspace}
              canManage={isOwner}
              refresh={refresh}
              theme={theme}
              setTheme={(value) => {
                setThemePreference(value);
                setTheme(value);
              }}
            />
          )}
          {route.page === "notifications" && (
            <NotificationPage
              notifications={notifications}
              readIds={readIds}
              markRead={markRead}
              markAllRead={markAllRead}
              navigate={changeRoute}
            />
          )}
          {![
            "dashboard",
            "assets",
            "locations",
            "people",
            "requests",
            "audits",
            "categories",
            "reports",
            "settings",
            "notifications",
          ].includes(route.page) && (
            <EmptyState
              icon="box"
              title="Page not found"
              description="This workspace page is not available."
              action={
                <Button onClick={() => changeRoute("dashboard")}>
                  Back to dashboard
                </Button>
              }
            />
          )}
        </section>
        <footer className="main-footer">
          <span>AssetHub</span>
          <span>Thoughtful asset management for growing teams.</span>
          <span>{workspace.role ? titleCase(workspace.role) : ""}</span>
        </footer>
      </main>

      {overlay === "organization" && (
        <Dialog title="Switch organization" onClose={() => setOverlay("")}>
          <label className="search-field org-search">
            <Icon name="search" size={16} />
            <input
              autoFocus
              value={organizationSearch}
              onChange={(e) => setOrganizationSearch(e.target.value)}
              placeholder="Search organizations…"
              aria-label="Search organizations"
            />
          </label>
          <div className="org-list">
            {orgResults.length ? (
              orgResults.map((org) => (
                <button
                  key={org.id}
                  className={`org-option${org.id === workspace.organization?.id ? " is-current" : ""}`}
                  onClick={() => chooseOrganization(org.id)}
                >
                  <span className="org-avatar">
                    <Icon name="building-2" size={18} />
                  </span>
                  <span>
                    <b>{org.name}</b>
                    <small>{org.slug || titleCase(org.role)}</small>
                  </span>
                  {org.id === workspace.organization?.id && (
                    <Icon name="check" size={17} />
                  )}
                </button>
              ))
            ) : (
              <EmptyState
                icon="building-2"
                title="No organizations found"
                description="Try a different search."
              />
            )}
          </div>
        </Dialog>
      )}
      {overlay === "search" && (
        <Dialog title="Search your workspace" onClose={() => setOverlay("")}>
          <label className="search-field modal-search">
            <Icon name="search" size={17} />
            <input
              id="global-search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find assets, people, locations, requests…"
              aria-label="Search your workspace"
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchRows[0]) {
                  event.preventDefault();
                  changeRoute(searchRows[0].path);
                }
              }}
            />
            <kbd>ESC</kbd>
          </label>
          <div className="search-results">
            {search.trim() ? (
              searchRows.length ? (
                searchRows.map((row, index) => (
                  <button
                    key={`${row.type}-${row.title}-${index}`}
                    onClick={() => changeRoute(row.path)}
                  >
                    <span className="search-result__icon">
                      <Icon name={row.icon} size={16} />
                    </span>
                    <span>
                      <b>{row.title}</b>
                      <small>{row.subtitle}</small>
                    </span>
                    <em>{row.type}</em>
                    <Icon name="arrow-up-right" size={15} />
                  </button>
                ))
              ) : (
                <div className="search-empty">No results for “{search}”</div>
              )
            ) : (
              <div className="search-hint">
                <span>
                  <Icon name="box" size={15} /> Search saved assets, people,
                  locations, and requests
                </span>
                <span>Enter to open · Esc to close</span>
              </div>
            )}
          </div>
        </Dialog>
      )}
      {overlay === "notifications" && (
        <Dialog title="Notifications" drawer onClose={() => setOverlay("")}>
          <div className="notification-tabs">
            {["ALL", "UNREAD", "ASSIGNMENTS", "REQUESTS", "SYSTEM"].map(
              (key) => (
                <button
                  key={key}
                  className={filter === key ? "is-active" : ""}
                  onClick={() => setFilter(key)}
                >
                  {key === "ALL" ? "All" : titleCase(key)}
                  {key === "UNREAD" && unreadCount > 0 && <i>{unreadCount}</i>}
                </button>
              ),
            )}
          </div>
          <NotificationList
            notifications={notifications}
            readIds={readIds}
            filter={filter}
            markRead={markRead}
            navigate={changeRoute}
          />
          <div className="dialog__footer">
            <Button onClick={() => setOverlay("")}>Close</Button>
            <Button
              variant="quiet"
              onClick={markAllRead}
              disabled={!unreadCount}
            >
              Mark all read
            </Button>
          </div>
        </Dialog>
      )}
      {overlay === "account" && (
        <Dialog title="Your account" onClose={() => setOverlay("")}>
          <div className="account-card">
            <PersonAvatar
              person={workspace.currentUser || session.user}
              size={46}
            />
            <span>
              <b>{workspace.currentUser?.name || session.user?.name}</b>
              <small>
                {workspace.currentUser?.email || session.user?.email}
              </small>
              <small>
                {workspace.role && titleCase(workspace.role)} in{" "}
                {workspace.organization?.name}
              </small>
            </span>
          </div>
          <div className="account-links">
            <button
              onClick={() => {
                setOverlay("");
                changeRoute("settings");
              }}
            >
              <Icon name="settings" size={17} /> Workspace settings{" "}
              <Icon name="arrow-right" size={14} />
            </button>
            <button
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setThemePreference(next);
                setTheme(next);
              }}
            >
              <Icon
                name={resolvedTheme(theme) === "dark" ? "sun" : "moon"}
                size={17}
              />
              {resolvedTheme(theme) === "dark"
                ? "Switch to light appearance"
                : "Switch to dark appearance"}
              <Icon name="arrow-right" size={14} />
            </button>
            <button className="account-links__danger" onClick={logout}>
              <Icon name="log-out" size={17} /> Sign out
            </button>
          </div>
        </Dialog>
      )}
      {notice && (
        <div className="toast" role="status">
          <Icon name="check-circle-2" size={16} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationPage({
  notifications,
  readIds,
  markRead,
  markAllRead,
  navigate,
}) {
  return (
    <>
      <div className="page-heading">
        <div className="page-heading__eyebrow">WORKSPACE UPDATES</div>
        <div className="page-heading__row">
          <h1 className="page-heading__title">Notifications</h1>
          <div className="page-heading__actions">
            <Button
              onClick={markAllRead}
              disabled={notifications.every((n) => readIds.includes(n.id))}
            >
              Mark all read
            </Button>
          </div>
        </div>
        <p className="page-heading__description">
          Recent saved activity from your organization.
        </p>
      </div>
      <NotificationList
        notifications={notifications}
        readIds={readIds}
        filter="ALL"
        markRead={markRead}
        navigate={navigate}
      />
    </>
  );
}
function NotificationList({
  notifications,
  readIds,
  filter,
  markRead,
  navigate,
}) {
  const rows = [...notifications]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(
      (item) =>
        filter === "ALL" ||
        (filter === "UNREAD" && !readIds.includes(item.id)) ||
        (filter === "ASSIGNMENTS" &&
          /checkout|checkin|transfer|assigned/i.test(
            `${item.action} ${item.title}`,
          )) ||
        (filter === "REQUESTS" &&
          /request|maintenance/i.test(`${item.action} ${item.title}`)) ||
        (filter === "SYSTEM" &&
          /organization|member|category|audit/i.test(
            `${item.action} ${item.title}`,
          )),
    );
  if (!rows.length)
    return (
      <EmptyState
        icon="bell"
        title="You’re all caught up"
        description="New workspace activity will appear here."
      />
    );
  return (
    <div className="notification-list">
      {rows.map((item) => (
        <article
          key={item.id}
          className={`notification-row${readIds.includes(item.id) ? " is-read" : ""}`}
        >
          <span className="notification-row__icon">
            <Icon name={itemIcon(item.action)} size={16} />
          </span>
          <button
            className="notification-row__copy"
            onClick={() => {
              markRead(item.id);
              if (item.assetId) navigate(`assets/${item.assetId}`);
              else if (/request/i.test(item.action)) navigate("requests");
            }}
          >
            <b>{item.title}</b>
            <small>{item.description || item.action}</small>
            <time>{notificationTime(item.createdAt)}</time>
          </button>
          {!readIds.includes(item.id) && (
            <button
              className="notification-row__read"
              aria-label="Mark as read"
              onClick={() => markRead(item.id)}
            >
              <i />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
function itemIcon(action = "") {
  const value = action.toLowerCase();
  return value.includes("checkout") || value.includes("checkin")
    ? "arrow-right-left"
    : value.includes("request")
      ? "wrench"
      : value.includes("audit")
        ? "clipboard-check"
        : value.includes("member")
          ? "users"
          : value.includes("transfer")
            ? "map-pin"
            : "box";
}
function notificationTime(value) {
  const delta = Date.now() - new Date(value);
  if (delta < 3600000) return `${Math.max(1, Math.floor(delta / 60000))}m ago`;
  if (delta < 86400000) return `${Math.floor(delta / 3600000)}h ago`;
  if (delta < 172800000) return "Yesterday";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
