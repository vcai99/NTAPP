# Master Data Runtime Store — Business Logic
## Technical Sprint: Product Master Preload & Shared Client Cache

### 1. Objective

Create a shared runtime data layer so frequently used Master Data—starting with `DM_SANPHAM`—is loaded once when the App Shell starts and reused by multiple modules.

Current architecture confirms modules such as Tồn kho call `ProductService.load()` and then enrich their own data from the returned Product Master. `apiProductLoad` is therefore already a shared source that can become the bootstrap source instead of each module independently reloading products. fileciteturn35file0L1-L8

### 2. Scope

Phase 1:
- Product Master only.
- Bootstrap Product Master when App Shell initializes.
- Store Product Master in a shared client-side `ProductStore`.
- Provide lookup/search methods.
- Modules consume the Store instead of repeatedly loading the Sheet.

Out of scope:
- Rewriting Product CRUD.
- Changing `DM_SANPHAM` schema.
- Changing Inventory Engine.
- Changing Sale/Purchase business logic.
- Preloading transaction data.
- Preloading `TK_KHO`.
- Creating a second Product database.

### 3. Source of Truth

Authoritative source remains:

`DM_SANPHAM`

Backend flow remains:

`DM_SANPHAM → ProductRepository → apiProductLoad`

The runtime Store is a cache/read model only. It is NOT the source of truth.

### 4. Product Master Shape

Use the existing DTO returned by `apiProductLoad`.

Do not invent a second incompatible Product schema.

If a lightweight projection is introduced, it must preserve the existing canonical fields used by current modules, including the already-audited field `dvtGoc` rather than inventing `baseUnit`. fileciteturn35file11L1-L4

### 5. App Bootstrap

Target flow:

`App Shell init`
→ `ProductStore.bootstrap()`
→ `apiProductLoad`
→ store products in memory
→ mark Store READY
→ App usable

Bootstrap must not block the entire App indefinitely.

Recommended state:

`IDLE → LOADING → READY`

and:

`LOADING → ERROR`

If bootstrap fails, modules may fall back to the existing ProductService/API path rather than leaving the whole App unusable.

### 6. ProductStore API

Minimum interface:

- `init()`
- `load()`
- `isReady()`
- `getAll()`
- `getById(maSP)`
- `getByBarcode(maVach)`
- `search(keyword)`
- `upsert(product)`
- `remove(maSP)`
- `invalidate()`
- `refresh()`

Exact naming may follow existing project conventions after audit.

### 7. Search

Search must operate in memory.

Examples:

`ProductStore.search("panadol")`

`ProductStore.getByBarcode("893...")`

No Google Sheets request for every keystroke.

No API request for every search result.

### 8. CRUD Synchronization

After Product Create succeeds:

`backend save → returned canonical product → ProductStore.upsert(product)`

After Product Update succeeds:

`backend update → returned canonical product → ProductStore.upsert(product)`

After Product Delete/Deactivate succeeds:

`backend success → ProductStore.remove()/update status`

Do NOT reload the entire product master after every CRUD operation unless the existing API contract makes that unavoidable.

### 9. Refresh

A full refresh is allowed through:

`ProductStore.refresh()`

This is the explicit recovery mechanism when:
- another user changed Product Master;
- stale data is suspected;
- user presses Refresh;
- application session is reinitialized.

### 10. Module Consumption

Modules that need Product Master should prefer:

`ProductStore`

instead of independently calling:

`apiProductLoad`

after the Store is READY.

Migration should be incremental.

Priority:
1. Product Editor
2. Bán hàng
3. Nhập hàng
4. Kiểm kê
5. Khách trả lại
6. Trả NCC
7. Tồn kho
8. Reports that need Product Master

### 11. Concurrency / Staleness

The Store is session-local.

It must not be treated as globally synchronized across users.

If another user edits Product Master, the current browser session may remain stale until refresh/invalidation.

This is acceptable for Phase 1.

### 12. Performance Rules

- One Product Master load per App session unless refresh/invalidation occurs.
- No Sheet read inside search loops.
- No N+1 product API calls.
- No module-level duplicate full Product loads after migration.
- Do not preload transaction tables.
- Do not preload `TK_KHO` merely to support Product lookup.

### 13. Regression Principle

The Store is an optimization layer.

If the Store is unavailable, existing APIs remain valid.

No existing business rule may depend on the cache.

### 14. Definition of Done

- Product Master can be loaded once at App startup.
- Store exposes existing Product DTO correctly.
- Product search works without API calls.
- Product lookup by ID/barcode works without API calls.
- Product Create/Update/Delete synchronizes Store.
- Modules can consume Store.
- Existing Product API remains backward compatible.
- No Product Search regression.
- No Sale/Purchase/Inventory regression.
