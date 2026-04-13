# DSV Air & Sea Mobile - Replica Specification

**Source**: https://air-and-sea-mobile.dsv.com
**Version**: v.3.3.2
**Auth**: Keycloak SSO (OpenID Connect) via sso.dsv.com
**Backend**: Java/Spring MVC (.do endpoints)
**Frontend**: jQuery 3.5.1, Bootstrap 4, DataTables, Dropzone.js, bootstrap-datepicker, bootstrap-clockpicker
**User**: Dolphin (account: 6402465444)

---

## Authentication Flow

### SSO Login
- **Identity Provider**: `sso.dsv.com/auth/realms/DSVdelivers`
- **Protocol**: OpenID Connect
- **Client ID**: `dsvdeliversclient`
- **Scopes**: `openid profile email`
- **Redirect URI**: `https://air-and-sea-mobile.dsv.com/login/oauth2/code/keycloak`
- **Form Fields**:
  - `username` (text) - Login ID
  - `password` (password)
- **Form Action**: POST to `/auth/realms/DSVdelivers/login-actions/authenticate`
- **CSRF**: Keycloak built-in

---

## Page Map & Endpoints

| Page | URL | Method | Description |
|------|-----|--------|-------------|
| Home | `/home.do` | GET | Landing page with 4 card navigation |
| New Event - Search | `/eventList.do` | GET | Job reference search + QR upload |
| Search Shipment | `/searchShipmentAndConsolShipment.do?referencetype=SID&jobref={ref}` | GET | AJAX search |
| Search Shipment Alt | `/searchShipment.do?referencetype=SID&jobref={ref}` | GET | AJAX search fallback |
| Init Event | `/initEvent.do` | POST | Event form (loaded after search) |
| Create Event | `/createEvent.do` | POST | **SUBMIT** - Creates event |
| Multi Event Step 1 | `/multiEventStep1.do` | GET | Multi-shipment selection wizard |
| Reference Selector | `/ReferenceSelector.do?serviceType=SHIPMENT&searchType=SHIPMENT_REFERENCE&searchNumber={ref}` | GET | AJAX - loads shipment details |
| Add Selected Ref | `/addSelectedReference.do?contno=&consol=` | GET | AJAX - adds ref to multi-event list |
| Selected References | `/SelectedReferences.do` | GET | AJAX - polls selected references |
| Multi Event Step 2 | `/multiEventStep2.do` | GET | Multi-event form |
| Create Multi Events | `/createMultiEventsForm` (form id) | POST | **SUBMIT** - Creates multi events |
| Dashboard | `/dashboard.do` | GET | Analytics dashboard |
| Logout | via dialog confirmation | - | Logout flow |

---

## Writable Elements - KEY FOCUS AREAS

### 1. EVENT DATE (Date Picker)

**Location**: New Event form (`/initEvent.do`) and Multi Event Step 2 (`/multiEventStep2.do`)

| Field | Name | Type | Format | Widget | Writable |
|-------|------|------|--------|--------|----------|
| Event Date | `eventdate` | text | `YYYY-MM-DD` | bootstrap-datepicker | YES |
| Event Time | `eventtime` | text | `HH:MM` | bootstrap-clockpicker | YES |
| GMT Offset | `gmtOffset` | hidden | e.g. `-05:00` | auto-set | YES (hidden) |

**Libraries**:
- `/dist/js/bootstrap-datepicker.js`
- `/dist/js/bootstrap-clockpicker.min.js`
- `/jsp/event/js/gmtOffSet.js`

**CSS**:
- `/dist/css/bootstrap-datepicker-min.css`
- `/dist/css/bootstrap-clockpicker.min.css`

### 2. DOCUMENT UPLOAD (Dropzone)

**Location**: New Event form, Multi Event Step 2, and Event List (QR/Barcode upload)

#### Event Form Dropzone (attachment upload)
| Config | Value |
|--------|-------|
| Method | POST |
| Param Name | `file` |
| Max File Size | 5 MB |
| Max Files | 5 |
| Accepted Files | `image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.tsv,.ppt,.pptx,.pages,.odt,.rtf` |
| Default Message | "Drop files here to upload." |

#### Event List Dropzone (QR/Barcode scan)
| Config | Value |
|--------|-------|
| Method | POST |
| Max File Size | 10 MB |
| Accepted Files | `.png,.jpg,.pdf` |
| Param Name | `file` |

**Libraries**:
- `/dist/dropzone/min/dropzone.min.js`
- `/dist/dropzone/min/dropzone.min.css`

**Attachment Types** (from Dashboard): Damaged Report/Pictures, Interim Receipt, Photograph, Proof of Delivery, Proof of Pick Up

### 3. EVENT TYPE (Select Dropdown)

**Location**: New Event form, Multi Event Step 2

| Field | Name | Type | Options Observed |
|-------|------|------|-----------------|
| Event Type | `eventtype` | select | `DLV` = Delivery |

**Note**: Only "Delivery" was observed for this user/shipment. Other possible event types (from Dashboard chart): `DCF` (appears in Events by Type chart). The dropdown options are populated server-side based on the shipment context.

### 4. COMMENTS & SIGNATORY

| Field | Name | Type | Writable |
|-------|------|------|----------|
| Comments | `comments` | textarea | YES |
| Name of Signatory | `contact` | text | YES |

---

## All Form Fields - New Event (`createEventForm`)

**Action**: POST `/createEvent.do`
**CSRF**: `_csrf` hidden field

### Visible (User-Editable) Fields
| Label | Field Name | Type | Writable | Notes |
|-------|-----------|------|----------|-------|
| Shipment/Container Radio | `radioShip` | radio | YES | Values: `SHP` (Shipment), `CNT` (Container) |
| Job Reference | `jobreference` | text | READ-ONLY | Auto-populated from search |
| Container Number | `container` | select | YES (when CNT radio) | Disabled when SHP radio selected |
| Event Type | `eventtype` | select | YES | Options loaded server-side |
| Comments | `comments` | textarea | YES | Free text |
| Name of Signatory | `contact` | text | YES | Free text |
| Gross Weight | `grossweight` | text | READ-ONLY | From shipment data |
| Number of Packages | `package` | text | READ-ONLY | From shipment data |
| Origin | `origin` | text | READ-ONLY | From shipment data |
| Destination | `destination` | text | READ-ONLY | From shipment data |
| Event Date | `eventdate` | text | YES | YYYY-MM-DD, datepicker |
| Event Time | `eventtime` | text | YES | HH:MM, clockpicker |
| File Upload | (file input) | file | YES | Via Dropzone |

### Hidden Fields
| Field Name | Purpose | Example Value |
|-----------|---------|--------------|
| `locationCode` | Branch location | (empty) |
| `branch` | Branch code | (empty) |
| `jobtype` | SHP or CNT | `SHP` |
| `contno` | Container number | (empty when SHP) |
| `consol` | Consolidation ref | (empty) |
| `serviceType` | Service category | `SHIPMENT` |
| `searchType` | How ref was found | `SHIPMENT_REFERENCE` |
| `searchNumber` | The searched ref | e.g. `SGVA0134084` |
| `singleContainerNumber` | Single container | (empty) |
| `singleConsolNumber` | Single consol | (empty) |
| `containerStatus` | Container state flag | `false` |
| `selectedShipments` | Multi-select refs | (empty) |
| `noContainerEventTypeCode` | Event code override | (empty) |
| `noContainerEventType` | Event type override | (empty) |
| `containersCount` | Number of containers | `1` |
| `gmtOffset` | Timezone offset | `-05:00` |
| `_csrf` | CSRF token | UUID |

### Buttons
| Button | ID | Type | Action |
|--------|-----|------|--------|
| Cancel | `cancelCreateEventButton` | button | Returns to event list |
| Submit Event | `createMultiEventsButton` | button | Submits event form |

---

## All Form Fields - Multi Event Step 2 (`createMultiEventsForm`)

**Action**: POST (form id: `createMultiEventsForm`)

### Visible Fields
| Label | Field Name | Type | Writable |
|-------|-----------|------|----------|
| Event Type | `eventtype` | select | YES |
| Comments | `comments` | textarea | YES |
| Name of Signatory | `contact` | text | YES |
| Event Date | `eventdate` | text | YES |
| Event Time | `eventtime` | text | YES |
| File Upload | (file input) | file | YES |

### Hidden Fields
| Field Name | Purpose |
|-----------|---------|
| `gmtOffset` | Timezone offset |
| `_csrf` | CSRF token |

---

## Dashboard (`/dashboard.do`)

**Read-only analytics page** - no writable fields.

### Interactive Elements
| Element | Handler | Description |
|---------|---------|-------------|
| Today card | `showToday()` | Filter to today's events |
| Last 7 days card | `showWeek()` | Filter to 7-day window |
| Last 30 days card | `showMonth()` | Filter to 30-day window |
| Last 365 days card | `showYear()` | Filter to yearly view |
| Download button | `download()` | Export dashboard data |

### Charts
- **Amount of events**: Line chart (time series)
- **Events by Type**: Donut chart (DCF, DLV)
- **Events by Device**: Donut chart (Web)
- **Attachments #**: Bar/donut chart by category

---

## Static Assets

### JavaScript
| Path | Purpose |
|------|---------|
| `/dist/js/jquery-3.5.1.js` | jQuery core |
| `/dist/js/bootstrap.min.js` | Bootstrap 4 |
| `/dist/js/bootstrap-notify.js` | Toast notifications |
| `/dist/js/jquery.dataTables.min.js` | DataTables core |
| `/dist/js/dataTables.bootstrap4.min.js` | DataTables Bootstrap theme |
| `/dist/dropzone/min/dropzone.min.js` | File upload |
| `/dist/js/bootstrap-datepicker.js` | Date picker |
| `/dist/js/bootstrap-clockpicker.min.js` | Time picker |
| `/dist/js/users/newUser.js` | User session management |
| `/dist/js/jQueryDialog.js` | Modal dialogs |
| `/jsp/event/js/gmtOffSet.js` | Timezone offset detection |

### CSS
| Path | Purpose |
|------|---------|
| `/dist/css/bootstrap.css` | Bootstrap 4 |
| `/dist/css/dataTables.bootstrap4.min.css` | DataTables theme |
| `/dist/css/bootstrap-datepicker-min.css` | Date picker styles |
| `/dist/css/bootstrap-clockpicker.min.css` | Clock picker styles |
| `/dist/font-awesome/css/all.css` | Font Awesome icons |
| `/dist/dropzone/min/dropzone.min.css` | Dropzone styles |
| `/assets/css/base.css` | Custom base styles |
| `/dist/css/jQueryDialog.css` | Dialog styles |

### Images
| Path | Purpose |
|------|---------|
| `/assets/img/brand/dsv-logo-small.jpg` | DSV logo |
| `/assets/img/favicons/logout-blue.png` | Logout icon |
| `/dist/ic_qr_code_blue.png` | QR code icon |
| `/images/web-logo.png` | Web logo |

---

## Replica Implementation Notes

### Priority Writable Endpoints (automation targets)
1. **`POST /createEvent.do`** - Single event creation (dates, comments, signatory, attachments)
2. **`POST /createMultiEventsForm`** - Multi event creation (same fields, multiple shipments)
3. **Dropzone POST** - File/document upload (attachments to events)
4. **`GET /searchShipment.do`** - Shipment lookup by reference

### Key Behaviors to Replicate
1. **Date picker**: bootstrap-datepicker with `YYYY-MM-DD` format
2. **Clock picker**: bootstrap-clockpicker with `HH:MM` format
3. **Dropzone file upload**: Max 5 files, 5MB each, accepts images/docs/PDFs
4. **Radio toggle**: SHP/CNT radio buttons enable/disable the container dropdown
5. **Event type dropdown**: Options populated dynamically based on shipment/container context
6. **CSRF protection**: Every form includes `_csrf` hidden token
7. **Session management**: Keycloak OAuth2 session with CSRF tokens
8. **jQuery click handlers**: Home page cards use jQuery `.on('click')` (not HTML onclick)
9. **AJAX flows**: Reference search, add-to-list, selected-references polling all use AJAX GET

### What Was NOT Found (not in this portal)
- **No RATES management** visible in this portal
- **No INVOICING** screens visible in this portal
- **No pricing/tariff** fields anywhere

The portal is focused on **event creation** (delivery confirmations with dates, signatures, comments, and document attachments). Rate/invoice management likely exists in a different DSV system or a different user role.
