import { useMemo } from "react";
import { Icon } from "../components/Icon.jsx";
import { AssetVisual } from "../components/AssetVisual.jsx";
import {
  EmptyState,
  PageHeading,
  Panel,
  Status,
  PersonAvatar,
} from "../components/UI.jsx";
import { dateLabel, titleCase } from "../lib/format.js";

function Metric({ icon, label, value, note, tone }) {
  return (
    <article className="metric-card">
      <div className="metric-card__top">
        <span>{label}</span>
        <span className={`metric-card__icon metric-card__icon--${tone}`}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
export default function Dashboard({ workspace, navigate }) {
  const {
    assets = [],
    categories = [],
    people = [],
    activity = [],
    requests = [],
    checkouts = [],
    organization = {},
  } = workspace;
  const total = assets.filter((a) => a.status !== "RETIRED").length;
  const assigned = assets.filter((a) => a.status === "ASSIGNED").length;
  const available = assets.filter((a) => a.status === "AVAILABLE").length;
  const maintenance = assets.filter((a) => a.status === "MAINTENANCE").length;
  const attention = useMemo(() => {
    const overdue = checkouts.filter(
      (checkout) =>
        !checkout.returnedAt &&
        checkout.expectedReturn &&
        new Date(checkout.expectedReturn) < new Date(),
    );
    const due = checkouts.filter(
      (checkout) =>
        !checkout.returnedAt &&
        checkout.expectedReturn &&
        new Date(checkout.expectedReturn) >= new Date() &&
        new Date(checkout.expectedReturn) < new Date(Date.now() + 7 * 86400000),
    );
    const openRequests = requests.filter(
      (request) => request.status !== "RESOLVED",
    );
    return { overdue, due, openRequests };
  }, [checkouts, requests]);
  const categoryRows = categories
    .map((category) => ({
      ...category,
      count: assets.filter(
        (a) => a.categoryId === category.id && a.status !== "RETIRED",
      ).length,
    }))
    .filter((x) => x.count)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCategory = Math.max(1, ...categoryRows.map((item) => item.count));
  const countsByWeek = Array.from({ length: 6 }, (_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (5 - i) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return activity.filter(
      (item) =>
        new Date(item.createdAt) >= start && new Date(item.createdAt) < end,
    ).length;
  });
  const maxActivity = Math.max(1, ...countsByWeek);
  const points = countsByWeek
    .map((count, i) => `${32 + i * 72},${94 - (count / maxActivity) * 70}`)
    .join(" ");
  const recent = [...activity]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  return (
    <>
      <PageHeading
        eyebrow={new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
          .format(new Date())
          .toUpperCase()}
        title={`${greeting}, ${workspace.currentUser?.name?.split(" ")[0] || "there"}.`}
        description={`Here’s what’s happening in ${organization.name || "your workspace"}.`}
        actions={
          <select
            aria-label="Dashboard date range"
            value="all"
            disabled
            title="Workspace totals reflect all saved records"
          >
            <option value="all">Current snapshot</option>
          </select>
        }
      />
      <div className="metric-grid">
        <Metric
          icon="box"
          label="Total assets"
          value={total.toLocaleString()}
          note={`${assets.filter((a) => a.status === "RETIRED").length} retired`}
          tone="green"
        />
        <Metric
          icon="users"
          label="Assigned"
          value={assigned.toLocaleString()}
          note={`${total ? Math.round((assigned / total) * 100) : 0}% of active assets`}
          tone="blue"
        />
        <Metric
          icon="check"
          label="Available"
          value={available.toLocaleString()}
          note={`${people.filter((p) => p.status === "ACTIVE").length} active team members`}
          tone="sage"
        />
        <Metric
          icon="wrench"
          label="Maintenance"
          value={maintenance.toLocaleString()}
          note={`${requests.filter((r) => r.status !== "RESOLVED").length} open requests`}
          tone="amber"
        />
      </div>
      <div className="content-grid dashboard-grid">
        <Panel title="Asset activity" className="activity-panel">
          <div className="chart-caption">
            <span>Saved activity by week</span>
            <span>Last 6 weeks</span>
          </div>
          {recent.length ? (
            <>
              <svg
                className="report-chart dashboard-chart"
                viewBox="0 0 400 116"
                preserveAspectRatio="none"
                role="img"
                aria-label="Asset activity per week for the last six weeks"
              >
                {[0, 0.5, 1].map((fraction) => (
                  <g key={fraction}>
                    <line
                      x1="32"
                      x2="392"
                      y1={94 - fraction * 70}
                      y2={94 - fraction * 70}
                      className="chart-gridline"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x="24"
                      y={97 - fraction * 70}
                      className="chart-value"
                      textAnchor="end"
                    >
                      {Math.round(maxActivity * fraction)}
                    </text>
                  </g>
                ))}
                <polygon
                  points={`32,94 ${points} 392,94`}
                  fill="currentColor"
                  opacity=".06"
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                {countsByWeek.map((count, i) => (
                  <circle
                    key={i}
                    cx={32 + i * 72}
                    cy={94 - (count / maxActivity) * 70}
                    r="2"
                  />
                ))}
              </svg>
              <div className="chart-axis">
                {Array.from({ length: 6 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (5 - i) * 7);
                  return (
                    <span key={i}>
                      {date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              icon="chart-no-axes-combined"
              title="Activity will appear here"
              description="Once your team starts managing equipment, saved actions will build this view."
            />
          )}
        </Panel>
        <Panel
          title="Recent activity"
          action={
            <button
              className="text-button"
              onClick={() => navigate("notifications")}
            >
              View all <Icon name="arrow-right" size={14} />
            </button>
          }
        >
          <div className="activity-list">
            {recent.length ? (
              recent.map((item) => (
                <button
                  className="activity-row"
                  key={item.id}
                  onClick={() =>
                    item.assetId && navigate(`assets/${item.assetId}`)
                  }
                >
                  <span className="activity-row__icon">
                    <Icon name={activityIcon(item.action)} size={15} />
                  </span>
                  <span className="activity-row__copy">
                    <b>{item.title}</b>
                    <small>
                      {item.description || dateLabel(item.createdAt)}
                    </small>
                  </span>
                  <time>{relativeTime(item.createdAt)}</time>
                  <Icon name="chevron-right" size={14} />
                </button>
              ))
            ) : (
              <EmptyState
                icon="clipboard-check"
                title="No activity yet"
                description="Changes your team makes will show here."
              />
            )}
          </div>
        </Panel>
      </div>
      <div className="content-grid dashboard-grid dashboard-grid--lower">
        <Panel
          title="Equipment by category"
          action={
            <button
              className="text-button"
              onClick={() => navigate("categories")}
            >
              Manage categories <Icon name="arrow-right" size={14} />
            </button>
          }
        >
          {categoryRows.length ? (
            <div className="category-bars">
              {categoryRows.map((category) => (
                <div key={category.id} className="category-bar">
                  <span>{category.name}</span>
                  <span className="category-bar__track">
                    <i
                      style={{
                        width: `${(category.count / maxCategory) * 100}%`,
                      }}
                    />
                  </span>
                  <b>{category.count}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="tag"
              title="Categories will appear here"
              description="Add equipment categories to see the distribution."
            />
          )}
        </Panel>
        <Panel
          title="Needs attention"
          action={
            <span className="attention-count">
              {attention.overdue.length + attention.openRequests.length}
            </span>
          }
        >
          {attention.overdue.length ||
          attention.due.length ||
          attention.openRequests.length ? (
            <div className="attention-list">
              {attention.overdue.slice(0, 2).map((checkout) => (
                <button
                  className="attention-row"
                  key={checkout.id}
                  onClick={() => navigate(`assets/${checkout.assetId}`)}
                >
                  <span className="attention-mark attention-mark--red">
                    <Icon name="calendar" size={15} />
                  </span>
                  <span>
                    <b>Overdue return</b>
                    <small>
                      {assets.find((a) => a.id === checkout.assetId)?.name} ·
                      expected {dateLabel(checkout.expectedReturn)}
                    </small>
                  </span>
                  <Icon name="chevron-right" size={14} />
                </button>
              ))}
              {attention.due.slice(0, 2).map((checkout) => (
                <button
                  className="attention-row"
                  key={checkout.id}
                  onClick={() => navigate(`assets/${checkout.assetId}`)}
                >
                  <span className="attention-mark">
                    <Icon name="calendar" size={15} />
                  </span>
                  <span>
                    <b>Return coming up</b>
                    <small>
                      {assets.find((a) => a.id === checkout.assetId)?.name} ·{" "}
                      {dateLabel(checkout.expectedReturn)}
                    </small>
                  </span>
                  <Icon name="chevron-right" size={14} />
                </button>
              ))}
              {attention.openRequests.slice(0, 2).map((request) => (
                <button
                  className="attention-row"
                  key={request.id}
                  onClick={() => navigate("requests")}
                >
                  <span className="attention-mark attention-mark--amber">
                    <Icon name="wrench" size={15} />
                  </span>
                  <span>
                    <b>{request.title}</b>
                    <small>
                      {assets.find((a) => a.id === request.assetId)?.name} ·{" "}
                      {titleCase(request.status)}
                    </small>
                  </span>
                  <Status value={request.priority} />
                </button>
              ))}
            </div>
          ) : (
            <div className="all-clear">
              <span>
                <Icon name="check" size={16} />
              </span>
              <div>
                <b>Everything looks in order</b>
                <small>
                  No overdue returns or open requests need attention.
                </small>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
function activityIcon(action = "") {
  const key = String(action).toLowerCase();
  return key.includes("checkout")
    ? "arrow-right-left"
    : key.includes("request")
      ? "wrench"
      : key.includes("audit")
        ? "clipboard-check"
        : key.includes("location")
          ? "map-pin"
          : "box";
}
function relativeTime(value) {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(value)) / 3600000),
  );
  return hours < 1
    ? "Just now"
    : hours < 24
      ? `${hours}h ago`
      : hours < 48
        ? "Yesterday"
        : `${Math.floor(hours / 24)}d ago`;
}
