# Master Data Runtime Store — Bug / Decision Log

## BUG-001 — Duplicate Product Master Loads

### Problem
Multiple modules independently call the full Product Master API when they only need the same `DM_SANPHAM` data.

### Risk
Slow module switching and repeated Google Sheets reads.

### Target
One App-session Product Master load + shared client Store.

### Status
**Phase A CODE DONE (2026-08-26), UAT PENDING.** `product_store.html` created
(`ProductStore` — state machine IDLE/LOADING/READY/ERROR, `_loadPromise`
race-condition guard, `getAll/getById/getByBarcode/search/upsert/remove/
invalidate/refresh`). Bootstrap wired ở `app.html::window.onload`
(`ProductStore.init()`, chạy song song với `goPage()`, không block).

**CHƯA migrate module nào** (Bán hàng/Nhập hàng/Kiểm kê/Khách trả/Tồn kho/
Danh mục SP/Reports đều CHƯA đổi — vẫn tự gọi `ProductService.load()` như
cũ). Do đó BUG-001 CHƯA thực sự hết (duplicate load giữa các module vẫn còn
nguyên tới khi migrate) — Phase A chỉ dựng xong nền tảng, chưa giải quyết
triệt để vấn đề gốc. Xem Phase B-J.

**Lưu ý duplicate TẠM THỜI tại bootstrap:** `app.html::window.onload` gọi cả
`ProductStore.init()` VÀ `NhaphangModule.loadCatalogBg()` (module Nhập hàng
chưa migrate, không được sửa trong Phase A) — 2 lệnh gọi `apiProductLoad()`
ĐỘC LẬP xảy ra 1 LẦN DUY NHẤT lúc mở App (không lặp lại/không tăng dần).
Chấp nhận được cho Phase A, sẽ hết khi Phase E migrate Nhập hàng.

---

## BUG-002 — Product Editor Sequential Loading

`ProductEditor.open()` previously loaded multiple independent data sources sequentially. This is a separate performance issue.

The Product Runtime Store may reduce the Product Master portion, but must not be assumed to solve every Product Editor delay.

### Status
Separate concern; keep existing fix/regression scope isolated.

---

## DEC-001 — Product Store is Cache, Not Source of Truth

LOCKED.

`DM_SANPHAM` remains authoritative.

ProductStore is session-local runtime state only.

---

## DEC-002 — Do Not Preload Transaction Data

LOCKED.

Do not preload:
- PB_PHIEUBAN
- PB_CHITIET
- PN_PHIEUNHAP
- PN_CHITIET
- TK_KHO
- TCCN_PHIEU
- KTL_PHIEU
- KTL_CHITIET

unless a separate feature explicitly requires it.

---

## DEC-003 — Do Not Create a Second Product Schema

LOCKED.

Reuse the canonical Product DTO returned by existing Product APIs.

Any projection must be additive and must not silently rename existing fields.

**Phase A implementation note:** 2 shape mismatches identified during audit (STEP 1 mục 3) resolved via client-side adapters INSIDE `ProductStore`, no backend change:
- `getAll()` embeds `uoms` inside each item; `getById()`/`ProductService.find()` returns `{product, uoms}` as siblings. → `ProductStore.normalizeFromFind()` merges them into the same flat shape (**PO DECISION 1, LOCKED**).
- CREATE/UPDATE response (`ProductRepositoryBackend.create/update`) echoes back the client payload WITHOUT `uoms`/recomputed `giaNhapMacDinh` — not a true canonical shape. → Future callers must run `ProductService.find(maSP)` → `ProductStore.normalizeFromFind()` → `ProductStore.upsert()` (**PO DECISION 2, LOCKED**, accepts 1 extra round-trip). NOT wired to any module in Phase A.

The existing audit already identified `dvtGoc` as the actual field used by Product data; do not reintroduce `baseUnit` as a fake canonical field. fileciteturn35file11L1-L4

---

## DEC-004 — App Bootstrap Failure

PROPOSED.

If Product bootstrap fails:
- App should not become permanently unusable.
- Existing API path may be used as fallback.
- User should receive a recoverable state.

Exact UX message can follow existing App Shell error convention.

---

## DEC-005 — Multi-user Staleness

ACCEPTED FOR PHASE 1.

ProductStore is browser-session local.

Changes from another user are not guaranteed to appear immediately.

Explicit Refresh/invalidation is the recovery mechanism.

---

## DEC-006 — Shared Store Migration

Do not migrate every module in one risky rewrite.

Use staged migration:
1. Establish Store.
2. Prove Product Search.
3. Migrate one module.
4. Regression.
5. Migrate next module.

---

## STOP CONDITIONS

Stop and report BLOCKED if audit finds:
- existing Product API has undocumented side effects;
- Product DTO differs materially between modules;
- a module requires transaction-specific Product data that cannot come from Master;
- Store integration would require changing business logic;
- bootstrap would materially delay App startup;
- a shared file change could break Sale/Purchase/Inventory without a safe compatibility layer.
