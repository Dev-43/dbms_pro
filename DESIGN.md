# DESIGN.md — Base Design (Universal Frontend Reference)

> ⚠️ AGENT INSTRUCTIONS: Every page and component in this project MUST use ONLY the tokens, class names, components and page templates defined in this file. Do not invent colors, fonts, spacing values, new CSS classes, or new layouts. Do not add any CSS framework or UI library. If a needed style does not exist here, output `// UNCLEAR: [what is missing]` and stop.

This file is the single source of truth for how the frontend looks. The CSS lives in `src/app/globals.css` (copied verbatim from the block at the bottom of this file). It is **frozen**: only Person A may edit it, and only by editing this file first.

---

## 1. Design Principles
- Reference look: BoxCars car-marketplace style (light blue-grey page, bright blue accent, large rounded white cards, pill buttons, underline tabs, vehicle cards with tag / spec row / price / "View Details ↗").
- Simple and consistent: table-and-form pages, one accent color, status shown only with badge colors. No animations, no gradients except the login backdrop, no shadows, no icon libraries, no photos (vehicle cards use the gradient `vehicle-img` block).
- Every list page = page header + optional tabs/filters + table (or `vehicle-grid` on the Vehicles page). Every create/edit page = page header + one card with a 2-column form.
- Plain CSS only (`globals.css`). No Tailwind, no CSS modules, no inline `style=`.
- The static preview of every template lives in `ui-kit/` (`login.html`, `dashboard.html`, `vehicles.html`, `bookings.html`, `form.html`, all using `ui-kit/styles.css`, which is identical to `src/app/globals.css`). When in doubt, copy markup from there.

## 2. Color Tokens (CSS variables)
| Token | Hex | Use |
|---|---|---|
| `--bg` | #f5f7fc | Page background |
| `--surface` | #ffffff | Cards, tables, sidebar, inputs |
| `--border` | #e6e9f2 | All borders |
| `--text` | #050b20 | Body text, headings |
| `--muted` | #5e6a85 | Labels, hints, table headers, inactive nav |
| `--primary` | #405ff2 | Primary buttons, links, active nav, active tab |
| `--primary-hover` | #2f49c9 | Primary button hover |
| `--primary-soft` | #e9edff | Active nav bg, focus ring, info badge |
| `--dark` | #0f1b3d | Login backdrop only |
| `--success` / `--success-soft` | #1f8a4c / #e2f5ea | Positive status |
| `--warning` / `--warning-soft` | #b86a08 / #fdf0d9 | Attention status |
| `--danger` / `--danger-soft` | #c0392b / #fce8e5 | Errors, destructive actions |
| `--neutral-soft` | #eef0f6 | Hover bg, neutral badge |

## 3. Typography
- Font: `--font` = "DM Sans" with system fallbacks. Load it once in the root layout with `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">`. Base size 14px, line-height 1.5.
- Page title: `<h1>` (26px, bold). Section title inside a card: `<h2>` (18px, bold). Nothing else uses headings.
- Table headers: 12px, bold, `--muted`.

## 4. Spacing & Shape
- Spacing scale ONLY: `--s1` 4px, `--s2` 8px, `--s3` 12px, `--s4` 16px, `--s5` 24px, `--s6` 32px.
- Radius: cards, tables and vehicle cards `--radius` (12px); inputs and nav items `--radius-sm` (8px); buttons and badges `--radius-pill`. Login card is 20px.

## 5. Class Reference (the complete list — nothing else exists)
| Class | Element | Purpose |
|---|---|---|
| `app-shell` | div | Root wrapper of the logged-in layout (sidebar + main) |
| `sidebar`, `brand`, `spacer`, `active` | aside, a | Left navigation |
| `main` | main | Page content area |
| `page-header` | div | Row: `<h1>` on the left, action button(s) on the right |
| `card` | div | White bordered box |
| `stat-grid`, `stat`, `label`, `value` | div | Dashboard number tiles |
| `btn`, `btn-primary`, `btn-danger` | button / a | Pill buttons (`btn` alone = secondary) |
| `tabs`, `tab`, `active` | div, a | Underline tabs above a list (e.g. status tabs on Vehicles) |
| `vehicle-grid`, `vehicle-card`, `vehicle-img`, `vehicle-body`, `vehicle-title`, `vehicle-sub`, `spec-row`, `vehicle-foot`, `price` | div | Vehicle card grid (Vehicles page only). `vehicle-img` holds a `badge` (status) and the category name. `spec-row` has three `<span>`s: odometer, category, year. `vehicle-foot` has `price` (`₹1,500 <small>/ day</small>`) and a "View Details ↗" link. |
| `table-wrap`, `table`, `num`, `empty` | div, table, td, td | Data tables. `num` right-aligns numbers/money. `empty` is used on a single `<td colspan>` when there are no rows with text "No records found." |
| `form-grid`, `field`, `hint`, `form-actions` | div | 2-column form layout |
| `filters` | div | Row of select/inputs above a table |
| `alert`, `alert-error`, `alert-success` | div | Messages shown at the top of the card/page |
| `badge`, `badge-success`, `badge-primary`, `badge-warning`, `badge-danger`, `badge-neutral` | span | Status pills |
| `login-wrap`, `login-card`, `brand`, `sub` | div | Login page only |

## 6. Status → Badge Mapping (exact)
| Entity | Value | Badge class |
|---|---|---|
| Vehicle | Available | `badge-success` |
| Vehicle | Rented | `badge-primary` |
| Vehicle | In Shop | `badge-warning` |
| Vehicle | Retired | `badge-neutral` |
| Booking | Reserved | `badge-warning` |
| Booking | Active | `badge-primary` |
| Booking | Completed | `badge-success` |
| Booking | Cancelled | `badge-neutral` |
| Maintenance | Open (closed_on is null) | `badge-warning` |
| Maintenance | Closed | `badge-success` |

## 7. Shared Components (owned by Person A, in `src/components/`)
Every page MUST use these instead of writing its own markup.

| Component file | Props | Renders |
|---|---|---|
| `Sidebar.js` | `role` (string) | Brand "FLEET MANAGER", links in the order of section 9, logout button at the bottom (`spacer` before it). Highlights current route with `active`. |
| `PageHeader.js` | `title` (string), `actionHref` (string, optional), `actionLabel` (string, optional) | `page-header` with `<h1>` and optional `btn btn-primary` link |
| `DataTable.js` | `columns` (array of `{key, label, numeric?, render?}`), `rows` (array), `emptyText` (string, default "No records found.") | `table-wrap > table`. `numeric: true` adds class `num`. `render(row)` returns a custom cell. |
| `StatusBadge.js` | `value` (string) | `badge` with class from section 6. Unknown value → `badge-neutral`. |
| `FormField.js` | `label`, `name`, `type` (default "text"), `value`, `onChange`, `options` (for select, array of `{value,label}`), `hint` (optional), `required` (bool) | `field` div with label + input/select/textarea |
| `Alert.js` | `type` ("error" or "success"), `message` | `alert alert-error` / `alert alert-success`; renders nothing if `message` is empty |

Formatting helpers in `src/lib/format.js` (Person A): `formatDate(d)` → `DD-MM-YYYY`, `formatMoney(n)` → `₹` + Indian grouping with 2 decimals (e.g. `₹12,500.00`).

## 8. Page Templates

### 8.1 List page (all list pages)
```jsx
<>
  <PageHeader title="Vehicles" actionHref="/vehicles/new" actionLabel="Add Vehicle" />
  <Alert type="error" message={error} />
  <div className="filters">{/* optional: select / input using FormField-less plain <select> inside .field is NOT allowed; use FormField */}</div>
  <DataTable columns={columns} rows={rows} />
</>
```

On the Vehicles page the `DataTable` is replaced by `tabs` (All, Available, Rented, In Shop) followed by a `vehicle-grid` of `vehicle-card`s (see `ui-kit/vehicles.html`). Person A builds a `VehicleCard` markup inline in that page; no new shared component.

### 8.2 Create / Edit page (all forms)
```jsx
<>
  <PageHeader title="Add Vehicle" />
  <div className="card">
    <Alert type="error" message={error} />
    <form onSubmit={handleSubmit}>
      <div className="form-grid">{/* FormField x N */}</div>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Save</button>
        <a className="btn" href="/vehicles">Cancel</a>
      </div>
    </form>
  </div>
</>
```
Rules: show `error` from the API (`error.message`) exactly as returned; on success redirect to the list page; disable the Save button while the request is running.

### 8.3 Detail page
`PageHeader` + one `card` with an `<h2>` and a two-column `form-grid` of read-only `field` blocks (`<label>` + plain text in a `<div>`), followed by related-records `DataTable`s each inside its own `card` with an `<h2>`.

### 8.4 Dashboard
`PageHeader title="Dashboard"` + one `stat-grid` of `card stat` tiles (`label` + `value`) + one `card` containing an `<h2>` and a `DataTable`.

### 8.5 Login page
`login-wrap > card login-card` with `brand` "FLEET MANAGER", `<h2>` "Staff Login", `sub` line, `Alert`, two `FormField`s (email, password), one `btn btn-primary` "Login" (full width via CSS). No sidebar. See `ui-kit/login.html`.

## 9. Navigation (order, labels, routes)
1. Dashboard — `/dashboard`
2. Vehicles — `/vehicles`
3. Customers — `/customers`
4. Bookings — `/bookings`
5. Payments — `/payments`
6. Maintenance — `/maintenance`
7. Fuel Logs — `/fuel`
8. Reports — `/reports`
9. Categories — `/categories` (shown only when role = `admin`)
10. Users — `/users` (shown only when role = `admin`)

## 10. DO NOT
- Do not add colors, fonts, spacing, classes, icons, photos, animations, or dark mode.
- Do not write custom CSS in a page or component. Do not add `style={{}}`.
- Do not create a second table/form/alert component. Reuse section 7.
- Do not change `globals.css` or any file in `src/components/` unless you are Person A.

---

## Appendix — `src/app/globals.css` (copy verbatim)
```css
/* ===== Fleet Manager — base theme (reference: BoxCars look). FROZEN: edit only via DESIGN.md ===== */
:root {
  --bg: #f5f7fc;
  --surface: #ffffff;
  --border: #e6e9f2;
  --text: #050b20;
  --muted: #5e6a85;
  --primary: #405ff2;
  --primary-hover: #2f49c9;
  --primary-soft: #e9edff;
  --dark: #0f1b3d;
  --success: #1f8a4c;
  --success-soft: #e2f5ea;
  --warning: #b86a08;
  --warning-soft: #fdf0d9;
  --danger: #c0392b;
  --danger-soft: #fce8e5;
  --neutral-soft: #eef0f6;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-pill: 999px;
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px;
  --font: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --sidebar-w: 230px;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: var(--font); font-size: 14px; line-height: 1.5; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }
h1 { font-size: 26px; font-weight: 700; margin: 0; }
h2 { font-size: 18px; font-weight: 700; margin: 0 0 var(--s3); }

/* Layout */
.app-shell { display: flex; min-height: 100vh; }
.sidebar { width: var(--sidebar-w); background: var(--surface); border-right: 1px solid var(--border); padding: var(--s5) var(--s4); display: flex; flex-direction: column; gap: var(--s1); }
.sidebar .brand { font-weight: 700; font-size: 17px; letter-spacing: .06em; color: var(--text); margin-bottom: var(--s5); padding: 0 var(--s3); }
.sidebar a { display: block; padding: var(--s3); border-radius: var(--radius-sm); color: var(--muted); font-weight: 500; }
.sidebar a:hover { background: var(--neutral-soft); color: var(--text); text-decoration: none; }
.sidebar a.active { background: var(--primary-soft); color: var(--primary); font-weight: 700; }
.sidebar .spacer { flex: 1; }
.main { flex: 1; padding: var(--s6); max-width: 1240px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--s5); }

/* Card */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--s5); margin-bottom: var(--s5); }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: var(--s4); margin-bottom: var(--s5); }
.stat-grid .card { margin-bottom: 0; }
.stat .label { color: var(--muted); font-size: 13px; }
.stat .value { font-size: 30px; font-weight: 700; }

/* Buttons (pill, like the reference search button) */
.btn { display: inline-block; padding: 10px var(--s5); border-radius: var(--radius-pill); border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-weight: 600; cursor: pointer; }
.btn:hover { background: var(--neutral-soft); text-decoration: none; }
.btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-hover); }
.btn-danger { background: var(--danger); border-color: var(--danger); color: #fff; }
.btn-danger:hover { background: #a22e22; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

/* Tabs (like "In Stock / New Cars / Used Cars") */
.tabs { display: flex; gap: var(--s5); border-bottom: 1px solid var(--border); margin-bottom: var(--s5); }
.tab { padding: var(--s2) 0 var(--s3); color: var(--muted); font-weight: 600; border-bottom: 2px solid transparent; }
.tab:hover { color: var(--text); text-decoration: none; }
.tab.active { color: var(--text); border-bottom-color: var(--primary); }

/* Table */
.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.table { width: 100%; border-collapse: collapse; }
.table th { text-align: left; font-size: 12px; font-weight: 700; color: var(--muted); background: var(--bg); padding: var(--s3) var(--s4); border-bottom: 1px solid var(--border); }
.table td { padding: var(--s3) var(--s4); border-bottom: 1px solid var(--border); }
.table tr:last-child td { border-bottom: none; }
.table .num { text-align: right; font-variant-numeric: tabular-nums; }
.empty { text-align: center; color: var(--muted); padding: var(--s5); }

/* Vehicle cards (like "Explore All Vehicles") */
.vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--s5); }
.vehicle-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.vehicle-img { position: relative; height: 140px; background: linear-gradient(135deg, #cfd8f6, #a9b8ee); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 18px; }
.vehicle-img .badge { position: absolute; top: var(--s3); left: var(--s3); }
.vehicle-body { padding: var(--s4); }
.vehicle-title { font-weight: 700; font-size: 15px; }
.vehicle-sub { color: var(--muted); font-size: 12px; margin-bottom: var(--s3); }
.spec-row { display: flex; justify-content: space-between; gap: var(--s2); padding: var(--s3) 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); color: var(--muted); font-size: 12px; }
.vehicle-foot { display: flex; justify-content: space-between; align-items: center; margin-top: var(--s3); }
.price { font-size: 17px; font-weight: 700; }
.price small { color: var(--muted); font-weight: 500; font-size: 12px; }

/* Forms */
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s4); }
.field { display: flex; flex-direction: column; gap: var(--s1); }
.field label { font-weight: 600; font-size: 13px; }
.field input, .field select, .field textarea { font: inherit; padding: 10px var(--s4); border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text); }
.field input:focus, .field select:focus, .field textarea:focus { outline: 3px solid var(--primary-soft); border-color: var(--primary); }
.field .hint { color: var(--muted); font-size: 12px; }
.form-actions { display: flex; gap: var(--s3); margin-top: var(--s5); }
.filters { display: flex; gap: var(--s3); margin-bottom: var(--s4); flex-wrap: wrap; }

/* Alerts */
.alert { padding: var(--s3) var(--s4); border-radius: var(--radius-sm); margin-bottom: var(--s4); border: 1px solid; }
.alert-error { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
.alert-success { background: var(--success-soft); border-color: var(--success); color: var(--success); }

/* Status badges */
.badge { display: inline-block; padding: 2px 10px; border-radius: var(--radius-pill); font-size: 12px; font-weight: 700; }
.badge-success { background: var(--success-soft); color: var(--success); }
.badge-primary { background: var(--primary-soft); color: var(--primary); }
.badge-warning { background: var(--warning-soft); color: var(--warning); }
.badge-danger  { background: var(--danger-soft);  color: var(--danger); }
.badge-neutral { background: var(--neutral-soft); color: var(--muted); }

/* Login (dark hero-style backdrop like the reference header) */
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(160deg, #0f1b3d 0%, #27407f 55%, #405ff2 100%); }
.login-card { width: 380px; border-radius: 20px; padding: var(--s6); }
.login-card .brand { font-weight: 700; letter-spacing: .06em; margin-bottom: var(--s2); }
.login-card .sub { color: var(--muted); margin-bottom: var(--s5); }
.login-card .field + .field { margin-top: var(--s3); }
.login-card .btn { display: block; width: 100%; text-align: center; margin-top: var(--s4); }

@media (max-width: 800px) {
  .app-shell { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; }
  .main { padding: var(--s4); }
  .form-grid { grid-template-columns: 1fr; }
}
```
