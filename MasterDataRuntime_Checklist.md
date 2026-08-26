# Master Data Runtime Store — Checklist

> **Cập nhật 2026-08-26 — PHASE A CODE DONE (Store + Bootstrap), UAT PENDING.**
> `product_store.html` (mới) + `app.html` (wiring). CHƯA migrate module nào
> (Bán hàng/Nhập hàng/Kiểm kê/Khách trả/Tồn kho/Danh mục SP/Reports) — mục
> G/H dưới đây vẫn `[ ]` cho tới các Phase C-J riêng. Trạng thái `[ ]` giữ
> nguyên tới khi có kết quả test tay trên Apps Script thật — không tự nhận
> PASS chỉ vì code review.

## A. Bootstrap
- [ ] A01 ProductStore initializes once.
- [ ] A02 `apiProductLoad` is called once during normal App startup.
- [ ] A03 Store reaches READY.
- [ ] A04 App remains usable if bootstrap fails.
- [ ] A05 No duplicate bootstrap requests.

## B. Product Data
- [ ] B01 Product count matches API result.
- [ ] B02 `MaSP` preserved.
- [ ] B03 `TenSP` preserved.
- [ ] B04 `MaVach` preserved.
- [ ] B05 `dvtGoc` preserved.
- [ ] B06 Existing UOM data preserved.
- [ ] B07 Existing fields used by Sale/Purchase preserved.

## C. Search
- [ ] C01 Search by product name works.
- [ ] C02 Search by product code works.
- [ ] C03 Search by barcode works.
- [ ] C04 Search is local/in-memory after bootstrap.
- [ ] C05 Typing does not generate one API request per keystroke.
- [ ] C06 Search result is identical to existing Product API result.

## D. Lookup
- [ ] D01 `getById()` works.
- [ ] D02 `getByBarcode()` works.
- [ ] D03 Missing product returns safe empty/null result.
- [ ] D04 No Sheet request for local lookup.

## E. CRUD Sync
- [ ] E01 Create Product updates Store.
- [ ] E02 Newly created Product is immediately searchable.
- [ ] E03 Update Product updates Store.
- [ ] E04 Updated Product is immediately searchable.
- [ ] E05 Delete/deactivate updates Store.
- [ ] E06 Failed CRUD does not corrupt Store.

## F. Refresh / Staleness
- [ ] F01 Explicit Refresh reloads Product Master.
- [ ] F02 Store is replaced atomically after successful refresh.
- [ ] F03 Failed refresh does not destroy current valid Store.
- [ ] F04 Refresh does not create duplicate entries.

## G. Module Migration
- [ ] G01 Product Editor can use Store where appropriate.
- [ ] G02 Bán hàng can use Store.
- [ ] G03 Nhập hàng can use Store.
- [ ] G04 Kiểm kê can use Store.
- [ ] G05 Khách trả lại can use Store.
- [ ] G06 Trả NCC can use Store.
- [ ] G07 Tồn kho can use Store.
- [ ] G08 Reports using Product Master can use Store where appropriate.

## H. Regression
- [ ] H01 Bán hàng Product Search still works.
- [ ] H02 Nhập hàng Product Search still works.
- [ ] H03 Kiểm kê Product Search still works.
- [ ] H04 Khách trả lại Product Search still works.
- [ ] H05 Trả NCC Product Search still works.
- [ ] H06 Tồn kho displays correct UOM.
- [ ] H07 Product Editor opens correctly.
- [ ] H08 Product Editor save/update works.
- [ ] H09 No shared Product API contract broken.
- [ ] H10 No Inventory Engine change.

## I. Performance
- [ ] I01 Measure startup Product load.
- [ ] I02 Measure Product Search before migration.
- [ ] I03 Measure Product Search after migration.
- [ ] I04 Switching modules does not trigger full Product reload.
- [ ] I05 No Sheet reads inside local Product search.
- [ ] I06 No N+1 Product API calls.

## J. Final
- [ ] J01 Console has no Store errors.
- [ ] J02 API errors handled.
- [ ] J03 Store state is observable/debuggable.
- [ ] J04 Documentation updated.
- [ ] J05 UAT completed by PO.
