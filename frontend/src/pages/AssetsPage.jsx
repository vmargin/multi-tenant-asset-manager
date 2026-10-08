import { useMemo, useState } from "react";
import { Icon } from "../components/Icon.jsx";
import { AssetVisual } from "../components/AssetVisual.jsx";
import {
  Button,
  Dialog,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  PersonAvatar,
  Status,
} from "../components/UI.jsx";
import { patch, post, get } from "../api/client.js";
import {
  assetFields,
  categoryName,
  dateLabel,
  locationName,
  money,
  personName,
} from "../lib/format.js";
import { downloadCsv, parseCsv } from "../lib/csv.js";

const columns = [
  ["assetTag", "Asset tag"],
  ["name", "Name"],
  ["category", "Category"],
  ["location", "Location"],
  ["status", "Status"],
  ["assignedTo", "Assigned to"],
  ["serialNumber", "Serial number"],
  ["model", "Model"],
  ["purchaseCost", "Purchase cost"],
  ["purchaseDate", "Purchase date"],
  ["warrantyDate", "Warranty date"],
];
const template =
  "name,assetTag,serialNumber,categoryId,locationId,model,purchaseDate,warrantyDate,purchaseCost,notes\n";
function assetExportRow(asset, categories, locations, people) {
  return {
    ...asset,
    category: categoryName(categories, asset.categoryId),
    location: locationName(locations, asset.locationId),
    assignedTo: personName(people, asset.assignedToId),
    purchaseDate: dateLabel(asset.purchaseDate),
    warrantyDate: dateLabel(asset.warrantyDate),
  };
}
export default function AssetsPage({
  workspace,
  canManage,
  refresh,
  navigate,
  detailId,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("name");
  const [selected, setSelected] = useState([]);
  const [dialog, setDialog] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(assetFields());
  const [actionValues, setActionValues] = useState({});
  const [label, setLabel] = useState("");
  const [history, setHistory] = useState([]);
  const {
    assets = [],
    categories = [],
    locations = [],
    people = [],
    activity = [],
  } = workspace;
  const filtered = useMemo(
    () =>
      assets
        .filter((a) => {
          const q = search.toLowerCase();
          const person = personName(people, a.assignedToId);
          return (
            (!q ||
              [a.name, a.assetTag, a.serialNumber, a.model, person].some((v) =>
                String(v || "")
                  .toLowerCase()
                  .includes(q),
              )) &&
            (!status || a.status === status) &&
            (!category || a.categoryId === category) &&
            (!location || a.locationId === location)
          );
        })
        .sort((a, b) =>
          String(a[sort] || "").localeCompare(String(b[sort] || "")),
        ),
    [assets, search, status, category, location, sort, people],
  );
  const canWrite = canManage;
  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const openAdd = () => {
    setSelectedAsset(null);
    setForm(assetFields());
    setError("");
    setDialog("asset");
  };
  const openEdit = (asset) => {
    setSelectedAsset(asset);
    setForm(assetFields(asset));
    setError("");
    setDialog("asset");
  };
  async function submitAsset(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await (selectedAsset
        ? patch(`/assets/${selectedAsset.id}`, form)
        : post("/assets", form));
      setDialog("");
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function openAction(asset, kind) {
    setSelectedAsset(asset);
    setActionValues({ checkoutDate: new Date().toISOString().slice(0, 10) });
    setError("");
    setDialog(kind);
  }
  async function mutate(url, body = {}) {
    setBusy(true);
    setError("");
    try {
      await post(url, body);
      setDialog("");
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function act(event) {
    event.preventDefault();
    if (!selectedAsset) return;
    const id = selectedAsset.id;
    const v = actionValues;
    if (dialog === "checkout")
      await mutate(`/assets/${id}/checkout`, {
        personId: v.personId,
        checkoutDate: v.checkoutDate,
        expectedReturn: v.expectedReturn || undefined,
        notes: v.notes || "",
      });
    if (dialog === "return")
      await mutate(`/assets/${id}/checkin`, { notes: v.notes || "" });
    if (dialog === "transfer")
      await mutate(`/assets/${id}/transfer`, { locationId: v.locationId });
    if (dialog === "retire") await mutate(`/assets/${id}/retire`, {});
    if (dialog === "request") {
      setBusy(true);
      setError("");
      try {
        await post("/requests", {
          assetId: id,
          title: v.title,
          description: v.description,
          priority: v.priority || "MEDIUM",
        });
        setDialog("");
        await refresh();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }
  }
  async function showLabel(asset) {
    setSelectedAsset(asset);
    setError("");
    try {
      const result = await get(`/assets/${asset.id}/label`);
      setLabel(result.dataUrl);
      setDialog("label");
    } catch (e) {
      setError(e.message);
    }
  }
  async function showHistory(asset) {
    setSelectedAsset(asset);
    setHistory(
      activity
        .filter((item) => item.assetId === asset.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    );
    setDialog("history");
  }
  async function importFile(file) {
    if (!file) return;
    setError("");
    setSuccess("");
    const rows = parseCsv(await file.text());
    if (rows.length > 250) {
      setError("A single import can contain up to 250 assets.");
      return;
    }
    if (!rows.length) {
      setError("The CSV file does not contain any asset rows.");
      return;
    }
    const bad = rows.findIndex(
      (row) => !row.name?.trim() || !row.serialNumber?.trim(),
    );
    if (bad >= 0) {
      setError(`Row ${bad + 2} needs both an asset name and serial number.`);
      return;
    }
    setBusy(true);
    try {
      const result = await post("/assets/import", {
        assets: rows.map((row) => ({
          ...row,
          purchaseCost: row.purchaseCost ? Number(row.purchaseCost) : undefined,
        })),
      });
      setError("");
      setSuccess(`${result.count} assets imported successfully.`);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const detail = detailId ? assets.find((a) => a.id === detailId) : null;
  if (detailId && !detail)
    return (
      <div className="page-state">
        <EmptyState
          icon="box"
          title="Asset not found"
          description="This asset may have been moved or is no longer available in this workspace."
          action={
            <Button icon="arrow-left" onClick={() => navigate("assets")}>
              Back to assets
            </Button>
          }
        />
      </div>
    );
  return (
    <>
      {detail ? (
        <AssetDetail
          asset={detail}
          workspace={workspace}
          navigate={navigate}
          canManage={canManage}
          onEdit={() => openEdit(detail)}
          onAction={openAction}
          onLabel={() => showLabel(detail)}
          onHistory={() => showHistory(detail)}
        />
      ) : (
        <>
          <PageHeading
            eyebrow="INVENTORY"
            title="Assets"
            description="Manage and track all equipment across your organization."
            actions={
              <>
                <label className="button button--secondary file-button">
                  <Icon name="upload" size={15} /> Import
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    disabled={!canWrite || busy}
                    onChange={(e) => importFile(e.target.files[0])}
                  />
                </label>
                <Button
                  variant="primary"
                  icon="plus"
                  disabled={!canWrite}
                  onClick={openAdd}
                >
                  Add asset
                </Button>
              </>
            }
          />
          {error && <Notice tone="error">{error}</Notice>}
          {success && <Notice tone="success">{success}</Notice>}
          <div className="toolbar">
            <label className="search-field">
              <Icon name="search" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets…"
                aria-label="Search assets"
              />
            </label>
            <Field
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories.map((x) => ({ value: x.id, label: x.name }))}
              placeholder="All categories"
            />
            <Field
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              options={locations.map((x) => ({ value: x.id, label: x.name }))}
              placeholder="All locations"
            />
            <Field
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]}
              placeholder="All statuses"
            />
            <select
              aria-label="Sort assets"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Sort: Name</option>
              <option value="assetTag">Sort: Asset tag</option>
              <option value="purchaseDate">Sort: Purchase date</option>
            </select>
            <Button
              icon="download"
              onClick={() =>
                downloadCsv(
                  "assethub-assets.csv",
                  filtered.map((asset) =>
                    assetExportRow(asset, categories, locations, people),
                  ),
                  columns,
                )
              }
            >
              Export
            </Button>
            <Button
              icon="file-text"
              onClick={() => {
                const url = URL.createObjectURL(
                  new Blob([template], { type: "text/csv;charset=utf-8" }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "assethub-import-template.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              CSV template
            </Button>
          </div>
          {selected.length > 0 && (
            <div className="selection-bar">
              <span>{selected.length} selected</span>
              <Button
                icon="download"
                onClick={() =>
                  downloadCsv(
                    "assethub-selected-assets.csv",
                    filtered
                      .filter((a) => selected.includes(a.id))
                      .map((asset) =>
                        assetExportRow(asset, categories, locations, people),
                      ),
                    columns,
                  )
                }
              >
                Export selected
              </Button>
              <button className="text-button" onClick={() => setSelected([])}>
                Clear selection
              </button>
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState
              icon="search"
              title={
                assets.length
                  ? "No matching assets"
                  : "Your inventory starts here"
              }
              description={
                assets.length
                  ? "Try adjusting your filters or search."
                  : "Add equipment or import a CSV to keep everything in its right place."
              }
              action={
                canWrite &&
                !assets.length && (
                  <Button variant="primary" icon="plus" onClick={openAdd}>
                    Add your first asset
                  </Button>
                )
              }
            />
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Select all visible assets"
                        checked={
                          filtered.length > 0 &&
                          selected.length === filtered.length
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? filtered.map((x) => x.id) : [],
                          )
                        }
                      />
                    </th>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${asset.name}`}
                          checked={selected.includes(asset.id)}
                          onChange={(e) =>
                            setSelected((old) =>
                              e.target.checked
                                ? [...old, asset.id]
                                : old.filter((x) => x !== asset.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="asset-cell"
                          aria-label={`View ${asset.name}`}
                          onClick={() => navigate(`assets/${asset.id}`)}
                        >
                          <AssetVisual
                            type={
                              asset.categoryId &&
                              categoryName(categories, asset.categoryId)
                            }
                            imageKey={asset.imageKey}
                            name={asset.name}
                            size={38}
                          />
                          <span>
                            <b>{asset.name}</b>
                            <small>
                              {asset.assetTag}{" "}
                              {asset.model ? `· ${asset.model}` : ""}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>{categoryName(categories, asset.categoryId)}</td>
                      <td>{locationName(locations, asset.locationId)}</td>
                      <td>
                        <Status value={asset.status} />
                      </td>
                      <td>
                        {asset.assignedToId ? (
                          <span className="person-cell">
                            <PersonAvatar
                              person={people.find(
                                (p) => p.id === asset.assignedToId,
                              )}
                            />
                            {personName(people, asset.assignedToId)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label={`More actions for ${asset.name}`}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setDialog("actions");
                            }}
                          >
                            <Icon name="ellipsis" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {dialog === "asset" && (
        <Dialog
          title={selectedAsset ? "Edit asset" : "Add an asset"}
          onClose={() => setDialog("")}
        >
          <form id="asset-form" onSubmit={submitAsset} className="form-grid">
            <Field
              label="Asset name"
              value={form.name}
              onChange={setField("name")}
              required
            />
            <Field
              label="Asset tag"
              value={form.assetTag}
              onChange={setField("assetTag")}
            />
            <Field
              label="Serial number"
              value={form.serialNumber}
              onChange={setField("serialNumber")}
              required
            />
            <Field
              label="Model"
              value={form.model}
              onChange={setField("model")}
            />
            <Field
              label="Category"
              value={form.categoryId}
              onChange={setField("categoryId")}
              options={categories.map((x) => ({ value: x.id, label: x.name }))}
            />
            <Field
              label="Location"
              value={form.locationId}
              onChange={setField("locationId")}
              options={locations.map((x) => ({ value: x.id, label: x.name }))}
            />
            <Field
              label="Purchase date"
              type="date"
              value={form.purchaseDate}
              onChange={setField("purchaseDate")}
            />
            <Field
              label="Warranty end"
              type="date"
              value={form.warrantyDate}
              onChange={setField("warrantyDate")}
            />
            <Field
              label="Purchase cost"
              type="number"
              min="0"
              step="0.01"
              value={form.purchaseCost}
              onChange={setField("purchaseCost")}
            />
            <Field
              label="Notes"
              type="textarea"
              className="form-grid__wide"
              value={form.notes}
              onChange={setField("notes")}
            />
            {error && (
              <div className="form-grid__wide">
                <Notice tone="error">{error}</Notice>
              </div>
            )}
          </form>
          <div className="dialog__footer">
            <Button onClick={() => setDialog("")}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              form="asset-form"
              disabled={busy}
            >
              {busy ? "Saving…" : selectedAsset ? "Save changes" : "Add asset"}
            </Button>
          </div>
        </Dialog>
      )}
      {dialog === "actions" && selectedAsset && (
        <Dialog title={selectedAsset.name} onClose={() => setDialog("")}>
          <div className="action-list">
            <button
              onClick={() => {
                setDialog("");
                navigate(`assets/${selectedAsset.id}`);
              }}
            >
              <Icon name="box" />
              View details
            </button>
            {canWrite && (
              <button onClick={() => openEdit(selectedAsset)}>
                <Icon name="pencil" />
                Edit asset
              </button>
            )}
            {canWrite && selectedAsset.status === "AVAILABLE" && (
              <button onClick={() => openAction(selectedAsset, "checkout")}>
                <Icon name="arrow-right-left" />
                Check out
              </button>
            )}
            {canWrite && selectedAsset.status === "ASSIGNED" && (
              <button onClick={() => openAction(selectedAsset, "return")}>
                <Icon name="check" />
                Check in
              </button>
            )}
            {canWrite && selectedAsset.status !== "RETIRED" && (
              <button onClick={() => openAction(selectedAsset, "transfer")}>
                <Icon name="map-pin" />
                Transfer location
              </button>
            )}
            <button onClick={() => showLabel(selectedAsset)}>
              <Icon name="tag" />
              Print QR label
            </button>
            <button onClick={() => showHistory(selectedAsset)}>
              <Icon name="clipboard-check" />
              View history
            </button>
            {canWrite && selectedAsset.status !== "RETIRED" && (
              <button
                className="action-list__danger"
                onClick={() => openAction(selectedAsset, "retire")}
              >
                <Icon name="box" />
                Retire asset
              </button>
            )}
          </div>
        </Dialog>
      )}
      {["checkout", "return", "transfer", "retire", "request"].includes(
        dialog,
      ) &&
        selectedAsset && (
          <Dialog
            title={
              {
                checkout: "Check out asset",
                return: "Return asset",
                transfer: "Transfer asset",
                retire: "Retire asset",
                request: "Report an issue",
              }[dialog]
            }
            drawer
            onClose={() => setDialog("")}
          >
            <div className="drawer-asset">
              <AssetVisual
                type={categoryName(categories, selectedAsset.categoryId)}
                imageKey={selectedAsset.imageKey}
                name={selectedAsset.name}
                size={48}
              />
              <span>
                <b>{selectedAsset.name}</b>
                <small>{selectedAsset.assetTag}</small>
              </span>
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <form id="action-form" onSubmit={act} className="form-stack">
              {dialog === "checkout" && (
                <>
                  <Field
                    label="Assign to"
                    value={actionValues.personId || ""}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        personId: e.target.value,
                      })
                    }
                    options={people
                      .filter((p) => p.status === "ACTIVE")
                      .map((p) => ({ value: p.id, label: p.name }))}
                    required
                  />
                  <Field
                    label="Checkout date"
                    type="date"
                    value={actionValues.checkoutDate}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        checkoutDate: e.target.value,
                      })
                    }
                    required
                  />
                  <Field
                    label="Expected return"
                    type="date"
                    value={actionValues.expectedReturn || ""}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        expectedReturn: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Notes"
                    type="textarea"
                    value={actionValues.notes || ""}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        notes: e.target.value,
                      })
                    }
                  />
                </>
              )}
              {dialog === "return" && (
                <Field
                  label="Return notes"
                  type="textarea"
                  value={actionValues.notes || ""}
                  onChange={(e) =>
                    setActionValues({ ...actionValues, notes: e.target.value })
                  }
                />
              )}
              {dialog === "transfer" && (
                <Field
                  label="New location"
                  value={actionValues.locationId || ""}
                  onChange={(e) =>
                    setActionValues({
                      ...actionValues,
                      locationId: e.target.value,
                    })
                  }
                  options={locations.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  required
                />
              )}
              {dialog === "request" && (
                <>
                  <Field
                    label="Issue title"
                    value={actionValues.title || ""}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                  <Field
                    label="Priority"
                    value={actionValues.priority || "MEDIUM"}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        priority: e.target.value,
                      })
                    }
                    options={["LOW", "MEDIUM", "HIGH"]}
                  />
                  <Field
                    label="Description"
                    type="textarea"
                    value={actionValues.description || ""}
                    onChange={(e) =>
                      setActionValues({
                        ...actionValues,
                        description: e.target.value,
                      })
                    }
                  />
                </>
              )}
              {dialog === "retire" && (
                <Notice tone="warning">
                  This asset will be marked retired and its history will remain
                  available. Retired assets cannot be checked out.
                </Notice>
              )}
            </form>
            <div className="dialog__footer">
              <Button onClick={() => setDialog("")}>Cancel</Button>
              <Button
                variant={dialog === "retire" ? "danger" : "primary"}
                type="submit"
                form="action-form"
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : {
                      checkout: "Check out",
                      return: "Confirm return",
                      transfer: "Move asset",
                      retire: "Retire asset",
                      request: "Submit request",
                    }[dialog]}
              </Button>
            </div>
          </Dialog>
        )}
      {dialog === "label" && (
        <Dialog
          title="Asset label"
          onClose={() => {
            setDialog("");
            setLabel("");
          }}
        >
          <div className="qr-label">
            <img src={label} alt={`QR code label for ${selectedAsset?.name}`} />
            <b>{selectedAsset?.name}</b>
            <span>{selectedAsset?.assetTag}</span>
          </div>
          <div className="dialog__footer">
            <Button onClick={() => setDialog("")}>Close</Button>
            <Button
              variant="primary"
              icon="download"
              onClick={() => {
                const w = window.open("", "_blank", "noopener");
                if (w) {
                  const title = w.document.createElement("title");
                  title.textContent = "Asset label";
                  const image = w.document.createElement("img");
                  image.src = label;
                  image.alt = "QR code";
                  image.style.width = "240px";
                  const name = w.document.createElement("p");
                  name.textContent = `${selectedAsset?.name || ""} · ${selectedAsset?.assetTag || ""}`;
                  w.document.head.append(title);
                  w.document.body.append(image, name);
                  w.print();
                }
              }}
            >
              Print label
            </Button>
          </div>
        </Dialog>
      )}
      {dialog === "history" && (
        <Dialog
          title={`${selectedAsset?.name} history`}
          onClose={() => setDialog("")}
        >
          <div className="timeline">
            {history.length ? (
              history.map((item) => (
                <div className="timeline__item" key={item.id}>
                  <i />
                  <span>
                    <b>{item.title}</b>
                    <small>{item.description}</small>
                    <time>{dateLabel(item.createdAt)}</time>
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                icon="clipboard-check"
                title="No history recorded"
                description="Saved changes and lifecycle events will be listed here."
              />
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}

function AssetDetail({
  asset,
  workspace,
  navigate,
  canManage,
  onEdit,
  onAction,
  onLabel,
  onHistory,
}) {
  const {
    categories = [],
    locations = [],
    people = [],
    checkouts = [],
    activity = [],
  } = workspace;
  const person = people.find((p) => p.id === asset.assignedToId);
  const checkout = checkouts.find(
    (c) => c.assetId === asset.id && !c.returnedAt,
  );
  const history = activity
    .filter((item) => item.assetId === asset.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  return (
    <>
      <div className="breadcrumbs">
        <button onClick={() => navigate("assets")}>Assets</button>
        <Icon name="chevron-right" size={14} />
        <span>{asset.name}</span>
      </div>
      <PageHeading
        eyebrow={asset.assetTag}
        title={asset.name}
        description={`${categoryName(categories, asset.categoryId)}${asset.model ? ` · ${asset.model}` : ""}`}
        actions={
          <>
            {canManage && (
              <Button icon="pencil" onClick={onEdit}>
                Edit
              </Button>
            )}
            <Button icon="tag" onClick={onLabel}>
              Print label
            </Button>
            <Button icon="ellipsis" onClick={onHistory}>
              History
            </Button>
          </>
        }
      />
      <div className="asset-detail">
        <section className="asset-detail__visual">
          <AssetVisual
            type={categoryName(categories, asset.categoryId)}
            imageKey={asset.imageKey}
            name={asset.name}
            size={184}
          />
          <div className="asset-detail__tag">
            <Icon name="tag" size={14} />
            {asset.assetTag}
          </div>
        </section>
        <section className="asset-detail__facts">
          <div className="asset-detail__status">
            <span>Current status</span>
            <Status value={asset.status} />
          </div>
          <div className="fact-grid">
            <Fact label="Serial number" value={asset.serialNumber} />
            <Fact
              label="Category"
              value={categoryName(categories, asset.categoryId)}
            />
            <Fact label="Model" value={asset.model} />
            <Fact
              label="Location"
              value={locationName(locations, asset.locationId)}
            />
            <Fact label="Purchase date" value={dateLabel(asset.purchaseDate)} />
            <Fact label="Warranty end" value={dateLabel(asset.warrantyDate)} />
            <Fact
              label="Purchase cost"
              value={
                asset.purchaseCost
                  ? money(asset.purchaseCost, workspace.organization?.currency)
                  : "—"
              }
            />
            <Fact label="Assigned to" value={person?.name || "Unassigned"} />
            {checkout && (
              <Fact
                label="Expected return"
                value={dateLabel(checkout.expectedReturn)}
              />
            )}
          </div>
          {asset.notes && (
            <div className="asset-notes">
              <b>Notes</b>
              <p>{asset.notes}</p>
            </div>
          )}
        </section>
        <section className="asset-detail__actions">
          <h2>Lifecycle actions</h2>
          {canManage && asset.status === "AVAILABLE" && (
            <Button
              variant="primary"
              icon="arrow-right-left"
              onClick={() => onAction(asset, "checkout")}
            >
              Check out asset
            </Button>
          )}
          {canManage && asset.status === "ASSIGNED" && (
            <Button
              variant="primary"
              icon="check"
              onClick={() => onAction(asset, "return")}
            >
              Check in asset
            </Button>
          )}
          {canManage && asset.status !== "RETIRED" && (
            <Button icon="map-pin" onClick={() => onAction(asset, "transfer")}>
              Transfer location
            </Button>
          )}
          {asset.status !== "RETIRED" && (
            <Button icon="wrench" onClick={() => onAction(asset, "request")}>
              Report an issue
            </Button>
          )}
          {canManage && asset.status !== "RETIRED" && (
            <Button variant="quiet" onClick={() => onAction(asset, "retire")}>
              Retire asset
            </Button>
          )}
        </section>
        <section className="asset-detail__history">
          <div className="panel__header">
            <h2 className="panel__title">Recent history</h2>
            <button className="text-button" onClick={onHistory}>
              See full history
            </button>
          </div>
          {history.length ? (
            <div className="timeline">
              {history.map((item) => (
                <div className="timeline__item" key={item.id}>
                  <i />
                  <span>
                    <b>{item.title}</b>
                    <small>{item.description}</small>
                    <time>{dateLabel(item.createdAt)}</time>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">
              No history has been recorded for this asset yet.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
function Fact({ label, value }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
