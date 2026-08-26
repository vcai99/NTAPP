# APP_v1.3 — Codex Handoff Context

Use this file as the working context for a new Codex chat. It describes the current project, the Product Owner's binding decisions, and the active inventory-by-lot implementation.

## 1. Project identity and runtime

- Project root: `C:\Users\VC\Documents\APP_code`
- Product: **APP_v1.3**, a Google Apps Script web application for a pharmacy (`Nhà thuốc An Phúc`).
- Runtime: Google Apps Script + Google Sheets backend; HTML/JavaScript frontend returned by `doGet()`.
- Entry points:
  - `code.gs`: `doGet(e)` creates `app.html`; `include(filename)` loads HTML fragments.
  - `app.html`: includes all page modules and client repositories/services.
  - `config.gs`: sheet names and shared `SS` reference.
  - `utils.gs`: `getSheet`, `sheetToObjects`, `nextId`, `fmtDate`, `now`.
- There is no visible `.clasp` configuration in this workspace. Deployment to Apps Script is performed outside this local folder.
- `bundle_app.ps1`/`bundle_app.py` generate `dist_app.html` for a flattened local preview. The Google Apps Script application uses `app.html` and its `include(...)` calls, not `dist_app.html`.

## 2. Architecture

The project follows a lightweight Clean Architecture split:

```text
Page module (mod_*.html)
  → client Service (*.html)
  → client Repository (*.html)
  → ApiClient
  → Apps Script API wrapper (backend/*_api.gs)
  → backend Service (backend/*_service.gs)
  → backend Repository (backend/*_repository.gs)
  → Google Sheets
```

Do not bypass this chain by writing a sheet from a page module or from a non-inventory service.

## 3. Main modules

| Domain | Backend | Frontend / UI |
|---|---|---|
| Product catalog | `backend_product_*` | `product_repository.html`, `product_service.html`, `mod_danhmuc.html` |
| Master units | `backend_dvt_*` | `dvt_repository.html`, `dvt_service.html`, `mod_donvitinh.html` |
| Purchase | `backend_purchase_*` | `purchase_repository.html`, `purchase_service.html`, `mod_nhaphang.html`, `mod_dsphieu.html` |
| Inventory | `backend_inventory_*` | `inventory_repository.html`, `inventory_service.html`, `mod_tonkho.html` |
| Sale/POS | `backend_sale_*` | `mod_banhang.html` |
| Customers | `backend_customer_*` | customer controls inside POS |
| Doctors | `backend_doctor_*` | doctor controls inside POS |

`api_client.html` is the single browser-to-Apps-Script gateway. It has mock data for several non-inventory offline flows; inventory mock data derived from purchase documents was deliberately removed.

## 4. Google Sheets names and key schemas

`config.gs` maps these sheet names:

```text
DM_SANPHAM       product master
SP_DONVITINH     product-specific units
DM_DONVITINH     master unit list
DM_NHACUNGCAP    suppliers
PN_PHIEUNHAP     purchase headers
PN_CHITIET       purchase lines
PB_PHIEUBAN      sale headers
PB_CHITIET       sale lines
TK_TONKHO        inventory by lot
TK_THEKHO        inventory log
DM_KHACHHANG     customers
DM_BACSI         doctors
CAIDAT           settings
```

### Authoritative inventory schema

`TK_TONKHO` must have this exact header sequence:

```text
TonKhoID | MaSP | TenSP | Kho | SoLo | HanDung | SLNhap | SLXuat | SLTon | NgayCapNhat
```

Business key:

```text
MaSP + Kho + SoLo + HanDung
```

`SLTon` must always equal `SLNhap - SLXuat`.

Purchase lines (`PN_CHITIET`) and sale lines (`PB_CHITIET`) both store `SoLo` and `HanDung`, but they are transaction history only; neither is a source for computing current stock.

## 5. Binding Product Owner decision: Sprint 5.5B Inventory by Lot

This decision is mandatory for future work:

1. `TK_KHO` is the **single source of truth** for current stock by lot.
2. `PN_CHITIET` is a purchase document; `PB_CHITIET` is a sale document. They are not stock lookup tables.
3. Never derive, rebuild, repair, sync, migrate, or initialize inventory from document history.
4. Never create an inventory migration, rebuild, repair, sync tool, one-time script, admin tool, or equivalent code.
5. If `TK_KHO` is absent or its header sequence does not match the schema, return `CONFIGURATION_ERROR`; do not create the sheet, add/reorder columns, or alter old data.
6. Product Owner prepares `TK_KHO` data manually. Old test data is intentionally out of scope.
7. Only `InventoryServiceBackend` may add, subtract, allocate, or roll back stock. Purchase and Sale services must call it; they must never write `TK_KHO` directly.
8. The Sale UI remains one user-entered product line. At save time, FEFO allocation may produce multiple `PB_CHITIET` rows, one per allocated lot. Do not store multiple lots as JSON or in one sale-detail row.

## 6. Current inventory implementation

### `backend/backend_inventory_repository.gs`

- `TK_HEADERS` contains the required `TK_KHO` schema above.
- `ensureHeaders_(sheetName, expectedHeaders)` now validates only. It throws `CONFIGURATION_ERROR` if the sheet is missing, lacks a header row, or differs from the required header sequence. It does **not** create or modify a sheet.
- `getStockList()` reads `TK_KHO` only.
- `getLotStocks(maSP, kho)` reads `TK_KHO` only; it filters exact `MaSP`, exact `Kho`, and `SLTon > 0`; returns `SoLo`, formatted `HanDung`, and `SLTon`; orders FEFO (expiry ascending, then lot ascending).
- `updateStock(...)` updates one lot row using the business key/TonKhoID. It inserts only an inbound new lot, prevents export/reversal for a nonexistent lot, and prevents negative stock.
- `TK_THEKHO` is an inventory log, not a current-stock source.

### `backend/backend_inventory_service.gs`

- `load()` returns stock from `TK_KHO`.
- `getLots(maSP, kho)` returns valid available lots from `TK_KHO`.
- `allocate(maSP, kho, needQty)` performs FEFO: `HanDung ASC`, then `SoLo ASC`; it returns allocations and fails if aggregate available stock is insufficient.
- `post(ticket)` is the only mutation entry point used by Purchase/Sale. It derives movement direction from `ticket.loaiChungTu === 'Xuất bán'`, calls `updateStock` for each lot, and writes an inventory log.
- `unpost(soPhieu)` is used by Purchase edit/delete to reverse a purchase movement through the inventory service.

### Inventory API/client API

```text
apiInventoryLoad()
apiInventoryLots({ maSP, kho })
apiInventoryPost(ticket)
apiInventoryUnpost(soPhieu)
```

Important: `ApiClient.call()` passes one payload argument. Therefore `apiInventoryLots` receives one object, not two positional arguments. `inventory_repository.html` correctly calls:

```js
ApiClient.call('apiInventoryLots', { maSP, kho });
```

## 7. Purchase flow

```text
mod_nhaphang
→ PurchaseService client
→ apiPurchaseCreate / apiPurchaseUpdate / apiPurchaseDelete
→ PurchaseServiceBackend
→ InventoryServiceBackend.post / unpost
→ TK_KHO
```

- A new purchase persists its document, then posts lot movements through `InventoryServiceBackend.post(payload)`.
- Updating a purchase unposts the old movement, writes the replacement document, then posts its new lot movements.
- Deleting a purchase unposts its movement before soft-deleting the document.
- Purchase repository owns `PN_PHIEUNHAP`/`PN_CHITIET`; it does not own current inventory.

## 8. Sale flow

```text
User selects product
→ mod_banhang calls InventoryService.getLots(maSP, 'Kho chính')
→ apiInventoryLots({ maSP, kho })
→ TK_KHO lots with SLTon > 0

User saves one product line
→ SaleServiceBackend.saveInvoice
→ InventoryServiceBackend.allocate (FEFO from TK_KHO)
→ SaleRepositoryBackend.save creates one PB_CHITIET row per allocated lot
→ InventoryServiceBackend.post subtracts every allocated lot from TK_KHO
```

- The lot dropdown is display/preference only. Final allocation is always server-side FEFO.
- `mod_banhang.html` sums all lot rows for a product when displaying product-level stock; do not overwrite the sum with the last lot row.
- The Sale service sends `kho`, not `khoNhap`, in its inventory post ticket. `InventoryServiceBackend.post` accepts both for compatibility.

## 9. Recent debugging context

- The user originally saw the POS dropdown status `Không tải được số lô`.
- The UI text indicates the `apiInventoryLots` call rejected; it is distinct from a successful empty response (`Không có lô còn tồn`).
- The sheet was later manually corrected to include valid lot rows for Panadol. Examples observed: lot `123` / expiry `2030-01-01`, and lot `456` / expiry `2031-01-01`.
- The user later said they had solved the immediate dropdown issue. Do not re-edit `mod_banhang.html` only to add diagnostic UI unless requested.
- When troubleshooting a recurrence, first verify that the deployed Apps Script version includes `apiInventoryLots(request)` and that the running web-app deployment is refreshed. Then verify exact `TK_KHO` headers, `MaSP`, `Kho`, and `SLTon > 0`.

## 10. Files changed during the Sprint 5.5B work

Current relevant changes are in:

```text
backend/backend_inventory_repository.gs
backend/backend_inventory_service.gs
backend/backend_inventory_api.gs
backend/backend_purchase_service.gs
backend/backend_sale_service.gs
inventory_repository.html
inventory_service.html
api_client.html
mod_banhang.html
```

`backend/backend_inventory_migration.gs` was deliberately deleted. Do not recreate it.

## 11. Guardrails for the next Codex session

- Treat Product Owner rules in section 5 as higher priority than convenience fixes.
- Do not run destructive changes against a live Google Sheet without a clearly identified target and explicit user authorization.
- Keep changes in the existing service/repository boundaries. Avoid broad refactors.
- Do not modify `dist_app.html` manually; regenerate it only when a local flattened preview is needed.
- The local workspace does not automatically deploy Apps Script. After code changes, the user must save/deploy a new Apps Script web-app version and refresh the browser.
- Preserve unrelated user changes in the workspace; it may be a dirty worktree.

## 12. Suggested prompt for a new Codex chat

```text
Read CODEX_HANDOFF.md first. This is APP_v1.3, a Google Apps Script pharmacy system. Follow the binding Sprint 5.5B rule that TK_KHO is the sole inventory source of truth by lot. Never add a migration, rebuild, repair, sync, or historical-document-derived inventory mechanism. Keep changes scoped and preserve the existing Clean Architecture boundaries. I need help with: <describe the next task>.
```

## 13. Binding Product Owner decision: Sprint 5.5C Sale Price

`DM_SANPHAM.GiaBanLe` is the **single source of truth** for the default sale price.

- Only the Product Catalog module may update `DM_SANPHAM.GiaBanLe`.
- Purchase stores purchase-line prices in `PN_CHITIET` but must never update product-master prices.
- Inventory, lots, expiry dates, FEFO, and `TK_KHO` never supply or alter sale prices.
- Sale loads the default from `DM_SANPHAM.GiaBanLe`. A seller may edit the price on an invoice line; that is an invoice-only value and must not update the product master.
- When Sale allocation splits one UI line into several lot rows, every resulting `PB_CHITIET` row retains the original `line.donGia`.
- Do not add a pricing engine, price history, promotion engine, lot/warehouse/customer pricing, or new pricing tables.

Implementation status:

- `backend_product_repository.gs:getAll()` exposes `giaBanLe` from `DM_SANPHAM.GiaBanLe`, no longer from the default product UOM.
- `mod_banhang.html` loads that master price when a product is selected; changing UOM or lot does not replace it.
- The POS invoice grid supports editable quantity and invoice price, recalculating line amount and invoice totals in real time.
