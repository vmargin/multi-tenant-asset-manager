import { useState } from "react";
import { Icon } from "../components/Icon.jsx";
import {
  Button,
  Dialog,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  Panel,
  PersonAvatar,
  Status,
} from "../components/UI.jsx";
import { patch, post } from "../api/client.js";
import { dateLabel, money, titleCase } from "../lib/format.js";
import { downloadCsv } from "../lib/csv.js";

export function CategoriesPage({ workspace, canManage, refresh }) {
  const { categories = [], assets = [] } = workspace;
  const [tab, setTab] = useState("categories");
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function open(item) {
    setEditing(item || null);
    setForm(
      item
        ? { name: item.name, description: item.description || "" }
        : { name: "", description: "" },
    );
    setError("");
    setDialog(true);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await (editing
        ? patch(`/categories/${editing.id}`, form)
        : post("/categories", form));
      setDialog(false);
      await refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ORGANIZE"
        title="Categories & tags"
        description="Group equipment so your inventory is easier to understand."
        actions={
          canManage && (
            <Button icon="plus" variant="primary" onClick={() => open()}>
              Add category
            </Button>
          )
        }
      />
      <div className="tab-row">
        <button
          className={tab === "categories" ? "is-active" : ""}
          onClick={() => setTab("categories")}
        >
          Categories <span>{categories.length}</span>
        </button>
        <button
          className={tab === "tags" ? "is-active" : ""}
          onClick={() => setTab("tags")}
        >
          Tags <span>0</span>
        </button>
      </div>
      {tab === "tags" ? (
        <EmptyState
          icon="tag"
          title="Tags are not available yet"
          description="Use categories to organize equipment in this workspace."
        />
      ) : categories.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Assets</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="category-name">
                      <span>
                        <Icon name="box" size={15} />
                      </span>
                      <b>{item.name}</b>
                    </span>
                  </td>
                  <td>{item.description || "—"}</td>
                  <td>
                    {assets
                      .filter((a) => a.categoryId === item.id)
                      .length.toLocaleString()}
                  </td>
                  {canManage && (
                    <td>
                      <Button icon="pencil" onClick={() => open(item)}>
                        Edit
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="tag"
          title="No categories yet"
          description="Categories help your team find related equipment."
          action={
            canManage && (
              <Button icon="plus" variant="primary" onClick={() => open()}>
                Add category
              </Button>
            )
          }
        />
      )}{" "}
      {dialog && (
        <Dialog
          title={editing ? "Edit category" : "Add category"}
          onClose={() => setDialog(false)}
        >
          <form id="category-form" className="form-stack" onSubmit={save}>
            <Field
              label="Category name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Field
              label="Description"
              type="textarea"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            {error && <Notice tone="error">{error}</Notice>}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="category-form"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save category"}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function LocationsPage({ workspace, canManage, refresh }) {
  const { locations = [], assets = [] } = workspace;
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", parentId: "", address: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function open(item) {
    setEditing(item || null);
    setForm(
      item
        ? {
            name: item.name,
            parentId: item.parentId || "",
            address: item.address || "",
          }
        : { name: "", parentId: "", address: "" },
    );
    setError("");
    setDialog(true);
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      name: form.name,
      parentId: form.parentId || undefined,
      address: form.address || undefined,
    };
    try {
      await (editing
        ? patch(`/locations/${editing.id}`, body)
        : post("/locations", body));
      setDialog(false);
      await refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const roots = locations.filter((x) => !x.parentId);
  const children = (id) => locations.filter((x) => x.parentId === id);
  return (
    <>
      <PageHeading
        eyebrow="ORGANIZE"
        title="Locations"
        description="Keep track of where equipment belongs, from offices to rooms and shelves."
        actions={
          canManage && (
            <Button icon="plus" variant="primary" onClick={() => open()}>
              Add location
            </Button>
          )
        }
      />
      {locations.length ? (
        <div className="location-layout">
          <Panel title="Location hierarchy">
            <div className="location-tree">
              {roots.map((item) => (
                <LocationNode
                  key={item.id}
                  item={item}
                  depth={0}
                  childrenOf={children}
                  assets={assets}
                  onEdit={open}
                  canManage={canManage}
                />
              ))}
            </div>
          </Panel>
          <Panel title="Location summary">
            <div className="location-summary">
              <div>
                <span>Locations</span>
                <b>{locations.length}</b>
              </div>
              <div>
                <span>Assets placed</span>
                <b>
                  {
                    assets.filter((a) => a.locationId && a.status !== "RETIRED")
                      .length
                  }
                </b>
              </div>
              <div>
                <span>Not assigned</span>
                <b>
                  {
                    assets.filter(
                      (a) => !a.locationId && a.status !== "RETIRED",
                    ).length
                  }
                </b>
              </div>
            </div>
          </Panel>
        </div>
      ) : (
        <EmptyState
          icon="map-pin"
          title="No locations yet"
          description="Add offices and rooms to give your team a clear map of equipment."
          action={
            canManage && (
              <Button icon="plus" variant="primary" onClick={() => open()}>
                Add location
              </Button>
            )
          }
        />
      )}
      {dialog && (
        <Dialog
          title={editing ? "Edit location" : "Add location"}
          onClose={() => setDialog(false)}
        >
          <form id="location-form" className="form-stack" onSubmit={save}>
            <Field
              label="Location name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Field
              label="Parent location"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              options={locations
                .filter((item) => item.id !== editing?.id)
                .map((x) => ({ value: x.id, label: x.name }))}
              placeholder="No parent location"
            />
            <Field
              label="Address or notes"
              type="textarea"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            {error && <Notice tone="error">{error}</Notice>}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="location-form"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save location"}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
function LocationNode({ item, depth, childrenOf, assets, onEdit, canManage }) {
  const kids = childrenOf(item.id);
  return (
    <>
      <div className="location-node" style={{ "--depth": depth }}>
        <Icon name={kids.length ? "chevron-down" : "map-pin"} size={15} />
        <span>
          <b>{item.name}</b>
          {item.address && <small>{item.address}</small>}
        </span>
        <span className="location-node__count">
          {
            assets.filter(
              (a) => a.locationId === item.id && a.status !== "RETIRED",
            ).length
          }
        </span>
        {canManage && (
          <button
            className="icon-button"
            aria-label={`Edit ${item.name}`}
            onClick={() => onEdit(item)}
          >
            <Icon name="pencil" size={15} />
          </button>
        )}
      </div>
      {kids.map((child) => (
        <LocationNode
          key={child.id}
          item={child}
          depth={depth + 1}
          childrenOf={childrenOf}
          assets={assets}
          onEdit={onEdit}
          canManage={canManage}
        />
      ))}
    </>
  );
}

export function PeoplePage({ workspace, canManage, refresh }) {
  const { people = [] } = workspace;
  const [tab, setTab] = useState("people");
  const [dialog, setDialog] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "MEMBER",
    department: "",
  });
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  function open(person) {
    setEditing(person || null);
    setForm(
      person
        ? {
            name: person.name,
            email: person.email,
            role: person.role,
            department: person.department || "",
          }
        : { name: "", email: "", role: "MEMBER", department: "" },
    );
    setError("");
    setInviteUrl("");
    setDialog(person ? "edit" : "invite");
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await patch(`/people/${editing.id}`, {
          role: form.role,
          department: form.department,
        });
        await refresh();
        setDialog("");
      } else {
        const result = await post("/people", form);
        setInviteUrl(result.inviteUrl);
        setDialog("invited");
        await refresh();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(
        new URL(inviteUrl, location.origin).href,
      );
      setError("Invitation link copied.");
    } catch {
      setError(
        "Could not copy automatically. Select and copy the invitation link below.",
      );
    }
  }
  const filtered = people.filter((p) =>
    [p.name, p.email, p.department].some((v) =>
      String(v || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );
  return (
    <>
      <PageHeading
        eyebrow="TEAM"
        title="People & access"
        description="Invite teammates and manage workspace permissions."
        actions={
          canManage && (
            <Button icon="plus" variant="primary" onClick={() => open()}>
              Invite person
            </Button>
          )
        }
      />
      <div className="tab-row">
        <button
          className={tab === "people" ? "is-active" : ""}
          onClick={() => setTab("people")}
        >
          People <span>{people.length}</span>
        </button>
        <button
          className={tab === "roles" ? "is-active" : ""}
          onClick={() => setTab("roles")}
        >
          Roles
        </button>
        <button
          className={tab === "permissions" ? "is-active" : ""}
          onClick={() => setTab("permissions")}
        >
          Permissions
        </button>
      </div>
      {tab === "people" ? (
        <>
          <label className="search-field people-search">
            <Icon name="search" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
            />
          </label>
          {filtered.length ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    {canManage && <th />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((person) => (
                    <tr key={person.id}>
                      <td>
                        <span className="person-cell">
                          <PersonAvatar person={person} />
                          <span>
                            <b>{person.name}</b>
                            <small>{person.email}</small>
                          </span>
                        </span>
                      </td>
                      <td>{person.department || "—"}</td>
                      <td>
                        <Status value={person.role} />
                      </td>
                      <td>
                        <Status value={person.status} />
                      </td>
                      {canManage && (
                        <td>
                          <Button icon="pencil" onClick={() => open(person)}>
                            Manage
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="users"
              title="No teammates found"
              description="Try a different search or invite a teammate."
            />
          )}
        </>
      ) : (
        <RoleGuide tab={tab} />
      )}
      {dialog === "invite" && (
        <Dialog title="Invite a teammate" onClose={() => setDialog("")}>
          <p className="muted-copy">
            Create a secure invitation link for this workspace. You can share
            the link directly; AssetHub does not send email.
          </p>
          <form id="people-form" className="form-stack" onSubmit={submit}>
            <Field
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Field
              label="Work email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Field
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={["MEMBER", "MANAGER"]}
            />
            <Field
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            {error && <Notice tone="error">{error}</Notice>}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog("")}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="people-form"
              disabled={busy}
            >
              {busy ? "Creating…" : "Create invitation"}
            </Button>
          </div>
        </Dialog>
      )}
      {dialog === "edit" && (
        <Dialog title={`Manage ${editing?.name}`} onClose={() => setDialog("")}>
          <form id="people-form" className="form-stack" onSubmit={submit}>
            <Field
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={["OWNER", "MANAGER", "MEMBER"]}
            />
            <Field
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            {error && <Notice tone="error">{error}</Notice>}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog("")}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="people-form"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save access"}
            </Button>
          </div>
        </Dialog>
      )}
      {dialog === "invited" && (
        <Dialog title="Invitation created" onClose={() => setDialog("")}>
          <Notice tone="success">
            The invitation is ready to share. No email has been sent.
          </Notice>
          <Field
            label="Invitation link"
            value={inviteUrl ? new URL(inviteUrl, location.origin).href : ""}
            readOnly
          />
          <div className="dialog__footer">
            <Button onClick={() => setDialog("")}>Done</Button>
            <Button variant="primary" icon="copy" onClick={copyInvite}>
              Copy link
            </Button>
          </div>
          {error && <Notice tone="success">{error}</Notice>}
        </Dialog>
      )}
    </>
  );
}
function RoleGuide({ tab }) {
  return (
    <div className="role-grid">
      {(tab === "roles"
        ? [
            [
              "OWNER",
              "Full workspace control",
              "Manage organization settings, members, invitations, and all asset operations.",
            ],
            [
              "MANAGER",
              "Daily operations",
              "Manage inventory, locations, categories, maintenance, and audits.",
            ],
            [
              "MEMBER",
              "View and report",
              "View workspace records and submit equipment issue requests.",
            ],
          ]
        : [
            [
              "Assets",
              "Owner · Manager",
              "Create, edit, check out, transfer, and retire equipment.",
            ],
            ["People", "Owner", "Invite teammates and update workspace roles."],
            [
              "Requests",
              "Everyone",
              "Submit maintenance requests; managers advance and resolve them.",
            ],
            [
              "Settings",
              "Owner",
              "Change the workspace name, description, and currency.",
            ],
          ]
      ).map(([title, scope, description]) => (
        <article key={title}>
          <span>
            {tab === "roles" ? (
              <Icon name="shield" size={18} />
            ) : (
              <Icon name="check-circle-2" size={18} />
            )}
          </span>
          <div>
            <b>{title}</b>
            <small>{scope}</small>
            <p>{description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RequestsPage({ workspace, canManage, refresh }) {
  const { requests = [], assets = [], people = [] } = workspace;
  const [filter, setFilter] = useState("ALL");
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    assetId: "",
    title: "",
    description: "",
    priority: "MEDIUM",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rows = requests
    .filter((r) => filter === "ALL" || r.status === filter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post("/requests", form);
      setDialog(false);
      setForm({ assetId: "", title: "", description: "", priority: "MEDIUM" });
      await refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function advance(request, status) {
    setBusy(true);
    setError("");
    try {
      await patch(`/requests/${request.id}`, { status });
      await refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="LIFECYCLE"
        title="Maintenance requests"
        description="Track equipment issues and the work needed to resolve them."
        actions={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setError("");
              setDialog(true);
            }}
          >
            New request
          </Button>
        }
      />
      <div className="tab-row">
        {["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"].map((value) => (
          <button
            key={value}
            className={filter === value ? "is-active" : ""}
            onClick={() => setFilter(value)}
          >
            {value === "ALL" ? "All" : titleCase(value)}{" "}
            <span>
              {value === "ALL"
                ? requests.length
                : requests.filter((r) => r.status === value).length}
            </span>
          </button>
        ))}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {rows.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asset</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Requested by</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((request) => (
                <tr key={request.id}>
                  <td className="mono">
                    {request.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td>
                    {assets.find((a) => a.id === request.assetId)?.name ||
                      "Asset unavailable"}
                  </td>
                  <td>
                    <b>{request.title}</b>
                    <small className="table-subtext">
                      {request.description}
                    </small>
                  </td>
                  <td>
                    <Status value={request.status} />
                  </td>
                  <td>
                    <Status value={request.priority} />
                  </td>
                  <td>
                    {people.find((p) => p.id === request.requestedById)?.name ||
                      "Team member"}
                  </td>
                  <td>{dateLabel(request.createdAt)}</td>
                  <td>
                    {canManage && request.status !== "RESOLVED" && (
                      <Button
                        disabled={busy}
                        onClick={() =>
                          advance(
                            request,
                            request.status === "OPEN"
                              ? "IN_PROGRESS"
                              : "RESOLVED",
                          )
                        }
                      >
                        {request.status === "OPEN" ? "Start work" : "Resolve"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="wrench"
          title="No maintenance requests"
          description="Report equipment issues so they can be tracked through resolution."
          action={
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setDialog(true)}
            >
              Create request
            </Button>
          }
        />
      )}
      {dialog && (
        <Dialog
          title="Report an equipment issue"
          onClose={() => setDialog(false)}
        >
          <form id="request-form" className="form-stack" onSubmit={create}>
            <Field
              label="Asset"
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              options={assets
                .filter((a) => a.status !== "RETIRED")
                .map((a) => ({
                  value: a.id,
                  label: `${a.name} · ${a.assetTag}`,
                }))}
              required
            />
            <Field
              label="Issue"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Field
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              options={["LOW", "MEDIUM", "HIGH"]}
            />
            <Field
              label="Description"
              type="textarea"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            {error && <Notice tone="error">{error}</Notice>}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="request-form"
              disabled={busy}
            >
              {busy ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export function AuditsPage({ workspace, canManage, refresh }) {
  const { audits = [], assets = [], locations = [] } = workspace;
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(null);
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post("/audits", { name, locationId: locationId || undefined });
      setDialog(false);
      setName("");
      setLocationId("");
      await refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function saveAudit(audit, changes) {
    setBusy(true);
    setError("");
    try {
      const updated = await patch(`/audits/${audit.id}`, {
        ...changes,
        expectedVersion: audit.version,
      });
      setActive(changes.status === "COMPLETED" ? null : updated);
      await refresh();
    } catch (error) {
      setError(error.message);
      if (error.status === 409) {
        const latest = await refresh().catch(() => null);
        if (latest)
          setActive(latest.audits.find((item) => item.id === audit.id) || null);
      }
    } finally {
      setBusy(false);
    }
  }
  function verify(audit, assetId) {
    const ids = audit.verifiedAssetIds.includes(assetId)
      ? audit.verifiedAssetIds.filter((id) => id !== assetId)
      : [...audit.verifiedAssetIds, assetId];
    return saveAudit(audit, { verifiedAssetIds: ids });
  }
  const snapshot = (audit) =>
    assets.filter((a) => audit.assetIds.includes(a.id));
  return (
    <>
      <PageHeading
        eyebrow="LIFECYCLE"
        title="Audits"
        description="Verify equipment by location and keep a clear record of each count."
        actions={
          canManage && (
            <Button
              icon="plus"
              variant="primary"
              onClick={() => {
                setError("");
                setDialog(true);
              }}
            >
              New audit
            </Button>
          )
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {audits.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Audit</th>
                <th>Location</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Started</th>
                <th>Completed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => {
                const total = audit.assetIds.length,
                  done = audit.verifiedAssetIds.length;
                return (
                  <tr key={audit.id}>
                    <td>
                      <b>{audit.name}</b>
                    </td>
                    <td>
                      {locations.find((x) => x.id === audit.locationId)?.name ||
                        "All locations"}
                    </td>
                    <td>
                      <Status value={audit.status} />
                    </td>
                    <td>
                      <span className="progress-cell">
                        <i>
                          <b
                            style={{
                              width: `${total ? (done / total) * 100 : 100}%`,
                            }}
                          />
                        </i>
                        {done}/{total}
                      </span>
                    </td>
                    <td>{dateLabel(audit.createdAt)}</td>
                    <td>{dateLabel(audit.completedAt)}</td>
                    <td>
                      <Button
                        onClick={() => {
                          setError("");
                          setActive(audit);
                        }}
                      >
                        {canManage && audit.status === "IN_PROGRESS"
                          ? "Verify items"
                          : "View audit"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="clipboard-check"
          title="No audits yet"
          description="Start a fixed snapshot of equipment and verify it one item at a time."
          action={
            canManage && (
              <Button
                icon="plus"
                variant="primary"
                onClick={() => setDialog(true)}
              >
                Start an audit
              </Button>
            )
          }
        />
      )}
      {dialog && (
        <Dialog title="Start a new audit" onClose={() => setDialog(false)}>
          <p className="muted-copy">
            The audit captures a fixed snapshot of all active assets at the
            selected location.
          </p>
          <form id="audit-form" className="form-stack" onSubmit={create}>
            <Field
              label="Audit name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Field
              label="Location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              options={locations.map((x) => ({ value: x.id, label: x.name }))}
              placeholder="All locations"
            />
            {error && <Notice tone="error">{error}</Notice>}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="audit-form"
              disabled={busy}
            >
              {busy ? "Starting…" : "Start audit"}
            </Button>
          </div>
        </Dialog>
      )}
      {active && (
        <Dialog title={active.name} onClose={() => setActive(null)}>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="audit-items">
            {snapshot(active).map((asset) => (
              <label key={asset.id}>
                <input
                  type="checkbox"
                  checked={active.verifiedAssetIds.includes(asset.id)}
                  disabled={
                    busy || !canManage || active.status !== "IN_PROGRESS"
                  }
                  onChange={() => verify(active, asset.id)}
                />
                <span>
                  <b>{asset.name}</b>
                  <small>
                    {asset.assetTag} · {asset.status}
                  </small>
                </span>
                <Status
                  value={
                    active.verifiedAssetIds.includes(asset.id)
                      ? "VERIFIED"
                      : "TO VERIFY"
                  }
                />
              </label>
            ))}
          </div>
          <div className="dialog__footer">
            <Button onClick={() => setActive(null)}>Close</Button>
            {canManage && active.status === "IN_PROGRESS" && (
              <Button
                variant="primary"
                disabled={
                  busy ||
                  active.verifiedAssetIds.length !== active.assetIds.length
                }
                onClick={() => saveAudit(active, { status: "COMPLETED" })}
              >
                Complete audit
              </Button>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}

export function ReportsPage({ workspace }) {
  const {
    assets = [],
    categories = [],
    locations = [],
    checkouts = [],
    organization = {},
  } = workspace;
  const live = assets.filter((a) => a.status !== "RETIRED");
  const assigned = live.filter((a) => a.status === "ASSIGNED").length;
  const totalCost = live.reduce(
    (sum, a) => sum + Number(a.purchaseCost || 0),
    0,
  );
  const lifecycle = [
    ["Available", live.filter((a) => a.status === "AVAILABLE").length],
    ["Assigned", assigned],
    ["Maintenance", live.filter((a) => a.status === "MAINTENANCE").length],
    ["Retired", assets.filter((a) => a.status === "RETIRED").length],
  ];
  const categoryRows = categories
    .map((c) => ({
      name: c.name,
      count: assets.filter(
        (a) => a.categoryId === c.id && a.status !== "RETIRED",
      ).length,
      cost: assets
        .filter((a) => a.categoryId === c.id && a.status !== "RETIRED")
        .reduce((s, a) => s + Number(a.purchaseCost || 0), 0),
    }))
    .filter((x) => x.count || x.cost);
  const locationRows = locations.map((l) => ({
    name: l.name,
    count: live.filter((a) => a.locationId === l.id).length,
  }));
  const exportRows = assets.map((a) => ({
    ...a,
    status: titleCase(a.status),
    category:
      categories.find((c) => c.id === a.categoryId)?.name || "Uncategorized",
    location:
      locations.find((l) => l.id === a.locationId)?.name || "No location",
  }));
  return (
    <>
      <PageHeading
        eyebrow="INSIGHTS"
        title="Reports"
        description="A clear view of inventory, lifecycle, utilization, and recorded costs."
        actions={
          <Button
            icon="download"
            variant="primary"
            onClick={() =>
              downloadCsv("assethub-inventory-report.csv", exportRows, [
                ["assetTag", "Asset tag"],
                ["name", "Asset"],
                ["status", "Status"],
                ["category", "Category"],
                ["location", "Location"],
                ["purchaseCost", "Purchase cost"],
                ["purchaseDate", "Purchase date"],
              ])
            }
          >
            Export report
          </Button>
        }
      />
      <div className="metric-grid report-metrics">
        <ReportMetric
          label="Total active assets"
          value={live.length.toLocaleString()}
          note="Excludes retired equipment"
        />
        <ReportMetric
          label="Utilization rate"
          value={`${live.length ? Math.round((assigned / live.length) * 100) : 0}%`}
          note="Currently assigned"
        />
        <ReportMetric
          label="Recorded purchase cost"
          value={money(totalCost, organization.currency)}
          note="Based on saved purchase values"
        />
        <ReportMetric
          label="Open checkouts"
          value={checkouts.filter((c) => !c.returnedAt).length}
          note="Equipment with a current custodian"
        />
      </div>
      <div className="content-grid reports-grid">
        <Panel title="Lifecycle overview">
          <div className="report-bars">
            {lifecycle.map(([label, count]) => (
              <div key={label} className="report-bars__row">
                <span>{label}</span>
                <i>
                  <b
                    style={{
                      width: `${assets.length ? (count / assets.length) * 100 : 0}%`,
                    }}
                  />
                </i>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <p className="report-footnote">
            Current status of all recorded assets.
          </p>
        </Panel>
        <Panel title="Equipment by category">
          {categoryRows.length ? (
            <div className="report-bars">
              {categoryRows.map((row) => (
                <div key={row.name} className="report-bars__row">
                  <span>{row.name}</span>
                  <i>
                    <b
                      style={{
                        width: `${Math.max(...categoryRows.map((x) => x.count), 1) ? (row.count / Math.max(...categoryRows.map((x) => x.count), 1)) * 100 : 0}%`,
                      }}
                    />
                  </i>
                  <strong>{row.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="tag"
              title="No category data"
              description="Saved category assignments will appear here."
            />
          )}
        </Panel>
      </div>
      <div className="content-grid reports-grid">
        <Panel title="Assets by location">
          {locationRows.some((x) => x.count) ? (
            <div className="location-report">
              {locationRows.map((row) => (
                <div key={row.name}>
                  <span>{row.name}</span>
                  <b>{row.count}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="map-pin"
              title="No location data"
              description="Assign equipment to locations to view distribution."
            />
          )}
        </Panel>
        <Panel title="Asset costs by category">
          {categoryRows.some((x) => x.cost) ? (
            <div className="location-report">
              {categoryRows.map((row) => (
                <div key={row.name}>
                  <span>{row.name}</span>
                  <b>{money(row.cost, organization.currency)}</b>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="chart-no-axes-combined"
              title="No recorded costs"
              description="Add purchase values to assets to include cost information."
            />
          )}
        </Panel>
      </div>
      <p className="report-footnote report-footnote--page">
        Reports use current saved inventory and lifecycle records. No historical
        trends are estimated.
      </p>
    </>
  );
}
function ReportMetric({ label, value, note }) {
  return (
    <article className="metric-card">
      <div className="metric-card__top">
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function SettingsPage({
  workspace,
  canManage,
  refresh,
  theme,
  setTheme,
}) {
  const { organization = {} } = workspace;
  const [tab, setTab] = useState("organization");
  const [form, setForm] = useState({
    name: organization.name || "",
    description: organization.description || "",
    currency: organization.currency || "PHP",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await patch("/organization", form);
      setMessage("Workspace details saved.");
      await refresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE"
        title="Settings"
        description="Manage your organization and how AssetHub looks for you."
      />
      <div className="settings-layout">
        <aside className="settings-tabs">
          {[
            ["organization", "building-2", "Organization"],
            ["appearance", "sun", "Appearance"],
            ["access", "shield", "Access"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              className={tab === key ? "is-active" : ""}
              onClick={() => setTab(key)}
            >
              <Icon name={icon} size={16} />
              {label}
            </button>
          ))}
        </aside>
        <div className="settings-content">
          {tab === "organization" && (
            <Panel title="Organization details">
              <p className="muted-copy">
                These details identify your shared workspace.
              </p>
              <form
                id="settings-form"
                className="form-stack settings-form"
                onSubmit={save}
              >
                <Field
                  label="Organization name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={!canManage}
                  required
                />
                <Field
                  label="Description"
                  type="textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  disabled={!canManage}
                />
                <Field
                  label="Default currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  options={["PHP", "USD", "EUR", "SGD", "AUD", "GBP"].map(
                    (code) => ({
                      value: code,
                      label: `${code} · ${new Intl.DisplayNames(undefined, { type: "currency" }).of(code)}`,
                    }),
                  )}
                  disabled={!canManage}
                />
                {error && <Notice tone="error">{error}</Notice>}
                {message && <Notice tone="success">{message}</Notice>}
                {canManage && (
                  <div>
                    <Button variant="primary" type="submit" disabled={busy}>
                      {busy ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                )}
              </form>
            </Panel>
          )}
          {tab === "appearance" && (
            <Panel title="Appearance">
              <p className="muted-copy">
                Choose the workspace appearance on this device.
              </p>
              <div className="theme-options">
                {[
                  ["light", "sun", "Light"],
                  ["dark", "moon", "Dark"],
                  ["system", "monitor", "System"],
                ].map(([value, icon, label]) => (
                  <button
                    key={value}
                    className={theme === value ? "is-selected" : ""}
                    onClick={() => setTheme(value)}
                  >
                    <Icon name={icon} size={17} />
                    <span>
                      <b>{label}</b>
                      <small>
                        {value === "system"
                          ? "Follows your device preference"
                          : `${label} appearance`}
                      </small>
                    </span>
                    {theme === value && (
                      <Icon name="check-circle-2" size={17} />
                    )}
                  </button>
                ))}
              </div>
              <Notice tone="info">
                Your appearance preference is saved in this browser.
              </Notice>
            </Panel>
          )}
          {tab === "access" && (
            <Panel title="Roles & workspace access">
              <p className="muted-copy">
                Access is checked for the selected organization on every
                request.
              </p>
              <RoleGuide tab="roles" />
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
