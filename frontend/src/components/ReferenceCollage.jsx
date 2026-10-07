import { Icon } from "./Icon.jsx";
import "./ReferenceCollage.css";

const navigation = [
  ["layout-dashboard", "Dashboard"],
  ["box", "Assets"],
  ["map-pin", "Locations"],
  ["users", "People"],
  ["clipboard-check", "Requests"],
  ["tag", "Categories"],
  ["chart-no-axes-combined", "Audits"],
  ["file-text", "Reports"],
  ["settings", "Settings"],
];

function MiniNavigation({ active }) {
  return (
    <aside className="collage-rail">
      {navigation.map(([icon, label]) => (
        <span
          className={`collage-rail__item${active === label ? " is-active" : ""}`}
          key={label}
        >
          <Icon name={icon} size={9} />
          {label}
        </span>
      ))}
    </aside>
  );
}

function MiniHeader() {
  return (
    <header className="collage-topbar">
      <span className="collage-topbar__org">
        <Icon name="box" size={13} /> Acme Corp
      </span>
      <span className="collage-topbar__search">
        <Icon name="search" size={9} /> Search assets, people, or requests…
      </span>
      <span className="collage-topbar__actions">
        <Icon name="bell" size={11} /> <i>JD</i>
      </span>
    </header>
  );
}

function ScreenFrame({ name, active, className = "", children }) {
  return (
    <article className={`collage-panel collage-screen ${className}`}>
      <MiniHeader />
      <div className="collage-workspace">
        <MiniNavigation active={active} />
        <section className="collage-screen__body" aria-label={name}>
          {children}
        </section>
      </div>
    </article>
  );
}

function ScreenHeading({ title, note, action }) {
  return (
    <div className="collage-screen__heading">
      <span>
        <strong>{title}</strong>
        {note && <small>{note}</small>}
      </span>
      {action && <b>{action}</b>}
    </div>
  );
}

function Status({ children, tone = "green" }) {
  return <i className={`collage-status is-${tone}`}>{children}</i>;
}

function ProductPreview() {
  return (
    <div className="reference-collage" aria-hidden="true">
      <article className="collage-panel collage-organizations">
        <strong>Switch organization</strong>
        <span className="collage-search">
          <Icon name="search" size={10} /> Search organizations…
        </span>
        {[
          ["Acme Corp", "you@acme.com", "green"],
          ["Orbit Labs", "you@orbitlabs.com", "blue"],
          ["Pinecrest Health", "you@pinecrest.com", "sand"],
          ["Summit Schools", "you@summit.edu", "mint"],
        ].map(([name, email, tone], index) => (
          <div className="collage-org" key={name}>
            <i className={`collage-org__mark is-${tone}`}>
              <Icon name="box" size={13} />
            </i>
            <span>
              <b>{name}</b>
              <small>{email}</small>
            </span>
            {index === 0 && <Icon name="check" size={13} />}
          </div>
        ))}
      </article>

      <ScreenFrame
        name="Dashboard preview"
        active="Dashboard"
        className="collage-dashboard"
      >
        <div className="collage-greeting">
          <span>
            <strong>Good morning, Jordan.</strong>
            <small>Here’s what’s happening in Acme Corp.</small>
          </span>
          <i>Last 30 days⌄</i>
        </div>
        <div className="collage-metrics">
          {[
            ["Total assets", "1,482", "↑ 12%", "box"],
            ["Assigned", "1,125", "76%", "users"],
            ["Available", "287", "19%", "circle"],
            ["Maintenance", "70", "↑ 8%", "wrench"],
          ].map(([label, value, note, icon]) => (
            <div className="collage-metric" key={label}>
              <span>{label}</span>
              <Icon name={icon} size={12} />
              <b>{value}</b>
              <small>{note}</small>
            </div>
          ))}
        </div>
        <div className="collage-dashboard__lower">
          <div className="collage-chart">
            <strong>Asset activity</strong>
            <svg viewBox="0 0 320 108" role="presentation">
              <path d="M0 87H320M0 60H320M0 33H320" />
              <path className="collage-chart__line" d="M5 87 C25 61 35 77 60 57 S91 82 116 55 S151 72 177 42 S209 67 234 34 S271 59 291 22 S309 39 318 18" />
              <path className="collage-chart__area" d="M5 87 C25 61 35 77 60 57 S91 82 116 55 S151 72 177 42 S209 67 234 34 S271 59 291 22 S309 39 318 18 V108 H5Z" />
            </svg>
            <div><span>Sep 1</span><span>Sep 8</span><span>Sep 15</span><span>Sep 22</span><span>Sep 30</span></div>
          </div>
          <div className="collage-activity">
            <strong>Recent activity</strong>
            <p><i className="is-green" />MacBook Pro checked out <small>2h ago</small></p>
            <p><i className="is-red" />Maintenance request created <small>4h ago</small></p>
            <p><i className="is-blue" />Asset moved to Floor 2 <small>1d ago</small></p>
            <p><i className="is-green" />New asset added <small>1d ago</small></p>
          </div>
        </div>
      </ScreenFrame>

      <article className="collage-panel collage-notifications">
        <div className="collage-panel__title">
          <strong>Notifications</strong><Icon name="x" size={12} />
        </div>
        <div className="collage-tabs"><b>All</b><span>Unread</span><span>Assignments</span><span>Requests</span></div>
        {[
          ["box", "MacBook Pro checked out", "Alex Rivera has checked out a MacBook Pro.", "2h ago", "green"],
          ["wrench", "Maintenance request created", "PR-348: Screen flickering", "4h ago", "gold"],
          ["clipboard-check", "Asset audit completed", "Quarterly IT audit has been completed.", "1d ago", "blue"],
          ["alert-circle", "Low stock alert", "Only 3 items left in Monitors category.", "1d ago", "red"],
          ["users", "New user added", "Taylor Kim has been added to Engineering.", "2d ago", "mint"],
        ].map(([icon, title, message, time, tone]) => (
          <div className="collage-notification" key={title}>
            <i className={`collage-notification__icon is-${tone}`}><Icon name={icon} size={11} /></i>
            <span><b>{title}</b><small>{message}</small></span>
            <time>{time}</time>
          </div>
        ))}
      </article>

      <ScreenFrame
        name="Asset register preview"
        active="Assets"
        className="collage-assets"
      >
        <ScreenHeading title="Assets" note="Manage and track all assets across your organization." action="＋ Add asset" />
        <div className="collage-filter-row"><span>⌕ Search assets…</span><span>All categories⌄</span><span>All locations⌄</span><span>All status⌄</span></div>
        <div className="collage-data-table collage-data-table--assets">
          <div className="collage-row collage-row--head"><span>Name</span><span>Category</span><span>Location</span><span>Status</span><span>Assigned to</span></div>
          {[
            ["MacBook Pro 14″", "Laptops", "HQ · Floor 3", "Assigned", "Alex Rivera"],
            ["Dell U2723QE", "Monitors", "HQ · Floor 2", "Assigned", "Priya Shah"],
            ["iPhone 15", "Mobile devices", "Remote", "Assigned", "Marcus Lee"],
            ["Logitech MX Master 3", "Accessories", "HQ · Floor 1", "Available", "—"],
            ["iPad Air", "Tablets", "HQ · Floor 3", "Maintenance", "—"],
          ].map(([name, category, location, status, person], index) => (
            <div className="collage-row" key={name}>
              <span><i className={`collage-device device-${index}`}><Icon name={index === 2 ? "smartphone" : index === 4 ? "tablet" : "laptop"} size={12} /></i>{name}</span>
              <span>{category}</span><span>{location}</span>
              <span><Status tone={status === "Available" ? "mint" : status === "Maintenance" ? "red" : "green"}>{status}</Status></span>
              <span>{person}</span>
            </div>
          ))}
        </div>
      </ScreenFrame>

      <ScreenFrame
        name="Asset details preview"
        active="Assets"
        className="collage-details"
      >
        <div className="collage-breadcrumb">Assets › MacBook Pro 14″</div>
        <div className="collage-detail-layout">
          <div className="collage-product-visual"><Icon name="laptop" size={42} /><span>MacBook Pro</span></div>
          <div className="collage-detail-copy">
            <div className="collage-detail-title"><strong>MacBook Pro 14″</strong><Status>Assigned</Status></div>
            <dl>
              <dt>Asset tag</dt><dd>ACM-1024</dd><dt>Serial number</dt><dd>C02X127JQ</dd>
              <dt>Category</dt><dd>Laptops</dd><dt>Model</dt><dd>MacBook Pro 14″ (M3, 2023)</dd>
              <dt>Location</dt><dd>HQ · Floor 3</dd><dt>Purchase date</dt><dd>Jan 15, 2024</dd>
              <dt>Warranty</dt><dd>Jan 15, 2027 (2 years)</dd>
            </dl>
          </div>
          <div className="collage-detail-actions"><b>↗ Check out</b><span>⇄ Transfer</span><span>♧ Report issue</span><span>More actions ⌄</span></div>
        </div>
      </ScreenFrame>

      <article className="collage-panel collage-checkout">
        <div className="collage-panel__title"><strong>Check out asset</strong><Icon name="x" size={12} /></div>
        <div className="collage-selected-asset"><i><Icon name="laptop" size={20} /></i><span><b>MacBook Pro 14″</b><small>ACM-1024</small></span></div>
        <label>Assign to <span>👤 Alex Rivera ⌄</span></label>
        <label>Check-out date <span>◷ Oct 1, 2024</span></label>
        <label>Expected return <span>Select date (optional) ⌄</span></label>
        <label>Notes <span className="collage-notes-box">Add a note…</span></label>
        <footer><i>Cancel</i><b>Check out</b></footer>
      </article>

      <ScreenFrame
        name="Maintenance requests preview"
        active="Requests"
        className="collage-maintenance"
      >
        <ScreenHeading title="Maintenance requests" note="Track and manage asset issues and maintenance." action="＋ New request" />
        <div className="collage-pills"><b>All</b><span>Open</span><span>In progress</span><span>Resolved</span></div>
        <div className="collage-data-table">
          <div className="collage-row collage-row--head"><span>ID</span><span>Asset</span><span>Issue</span><span>Status</span><span>Priority</span><span>Requested by</span><span>Created</span></div>
          {[
            ["PR-348", "MacBook Pro 14″", "Screen flickering", "Open", "High", "Alex Rivera", "Oct 1"],
            ["PR-347", "Dell U2723QE", "No display", "In progress", "Medium", "Priya Shah", "Sep 30"],
            ["PR-346", "iPhone 15", "Battery issue", "In progress", "Medium", "Marcus Lee", "Sep 28"],
            ["PR-345", "iPad Air", "Cracked screen", "Resolved", "Low", "Taylor Kim", "Sep 25"],
          ].map(([id, asset, issue, status, priority, person, date]) => (
            <div className="collage-row" key={id}><span>{id}</span><span>{asset}</span><span>{issue}</span><span><Status>{status}</Status></span><span>{priority}</span><span>{person}</span><span>{date}</span></div>
          ))}
        </div>
      </ScreenFrame>

      <ScreenFrame
        name="Categories preview"
        active="Categories"
        className="collage-categories"
      >
        <ScreenHeading title="Categories & tags" note="Organize assets with categories and tags." action="＋ Add category" />
        <div className="collage-pills"><b>Categories</b><span>Tags</span></div>
        <div className="collage-data-table">
          <div className="collage-row collage-row--head"><span>Name</span><span>Assets</span><span>Description</span></div>
          {[["Laptops", "428", "Portable computers"], ["Monitors", "312", "External displays"], ["Mobile Devices", "208", "Phones and tablets"], ["Accessories", "274", "Keyboards, etc."], ["Audio/Video", "110", "Audio and video equipment"]].map(([name, count, note]) => <div className="collage-row" key={name}><span>▣ {name}</span><span>{count}</span><span>{note}</span></div>)}
        </div>
      </ScreenFrame>

      <ScreenFrame
        name="Locations preview"
        active="Locations"
        className="collage-locations"
      >
        <ScreenHeading title="Locations" note="Manage your physical and virtual locations." action="＋ Add location" />
        <div className="collage-location-tree">
          <div>⌄ <b>Acme Corp</b><small>680</small></div>
          <div className="is-indented">⌄ Headquarters<small>650</small></div>
          <div className="is-nested">└ Floor 1<small>142</small></div>
          <div className="is-nested">└ Floor 2<small>156</small></div>
          <div className="is-nested">└ Floor 3<small>188</small></div>
          <div className="is-indented">⌄ Remote<small>32</small></div>
          <div className="is-indented">⌄ Warehouse<small>42</small></div>
          <div>⌄ New York Office<small>98</small></div>
          <div>⌄ London Office<small>44</small></div>
        </div>
      </ScreenFrame>

      <ScreenFrame
        name="People and permissions preview"
        active="People"
        className="collage-people"
      >
        <ScreenHeading title="Users & permissions" note="Manage workspace members and roles." action="＋ Invite user" />
        <div className="collage-pills"><b>Users</b><span>Roles</span><span>Permissions</span></div>
        <div className="collage-data-table">
          <div className="collage-row collage-row--head"><span>Name</span><span>Role</span><span>Access</span><span>Status</span></div>
          {[["Jordan Diaz", "Owner", "All workspaces"], ["Alex Rivera", "IT Manager", "Acme Corp"], ["Priya Shah", "Employee", "Acme Corp"], ["Marcus Lee", "Employee", "Engineering"]].map(([name, role, access]) => <div className="collage-row" key={name}><span><i className="collage-person">{name.slice(0, 1)}</i>{name}</span><span>{role} ⌄</span><span>{access}</span><span><Status>Active</Status></span></div>)}
        </div>
      </ScreenFrame>

      <ScreenFrame
        name="Asset audits preview"
        active="Audits"
        className="collage-audits"
      >
        <ScreenHeading title="Audits" note="Run and manage asset audits." action="＋ New audit" />
        <div className="collage-data-table">
          <div className="collage-row collage-row--head"><span>Name</span><span>Location</span><span>Status</span><span>Progress</span><span>Started</span><span>Completed</span></div>
          {[["Q3 2024 Audit", "Headquarters", "In progress", "68%"], ["Remote Devices", "Remote", "Completed", "100%"], ["Warehouse Stock", "Warehouse", "Planned", "0%"]].map(([name, location, status, progress]) => <div className="collage-row" key={name}><span>{name}</span><span>{location}</span><span><Status>{status}</Status></span><span><i className="collage-progress"><b style={{ width: progress }} /></i>{progress}</span><span>Sep 30</span><span>—</span></div>)}
        </div>
      </ScreenFrame>

      <ScreenFrame
        name="Reports preview"
        active="Reports"
        className="collage-reports"
      >
        <ScreenHeading title="Reports" note="Generate insights from your asset data." action="Export" />
        <div className="collage-report-tabs"><b>Asset overview</b><span>Lifecycle</span><span>Utilization</span><span>Costs</span></div>
        <div className="collage-report-metrics"><span>Total assets<b>1,482</b></span><span>Average age<b>1.8 years</b></span><span>Utilization rate<b>76%</b></span><span>Total value<b>₱47.3M</b></span></div>
        <div className="collage-report-visual"><div className="collage-donut"><b>1,482</b><small>Total</small></div><div className="collage-bars"><i style={{ height: "50%" }} /><i style={{ height: "82%" }} /><i style={{ height: "62%" }} /><i style={{ height: "95%" }} /><i style={{ height: "70%" }} /></div></div>
      </ScreenFrame>

      <ScreenFrame
        name="Settings preview"
        active="Settings"
        className="collage-settings"
      >
        <ScreenHeading title="Settings" note="Manage your organization settings." />
        <div className="collage-pills"><b>Organization</b><span>Billing</span><span>Integrations</span><span>Appearance</span></div>
        <div className="collage-setting-fields"><span>Organization name <b>Acme Corp</b></span><span>Workspace ID <b>acme-corp ⧉</b></span><span>Description <b>Technology for a better tomorrow.</b></span><span>Logo <b>▣ Change logo JPG, PNG up to 2MB</b></span></div>
      </ScreenFrame>
    </div>
  );
}

export default ProductPreview;
