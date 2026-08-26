# APP_v1.3 Constitution

## 01. Product Vision

- Clone business logic của TheLight.
- Không clone source code.
- MVP trước.
- Không refactor nếu Product Owner chưa yêu cầu.

## 02. Documentation

Mỗi module đều có thư mục riêng trong /docs.

Ví dụ:

docs/Sale/
docs/Purchase/
docs/Inventory/
docs/Product/

BusinessLogic.md của từng module là nguồn chân lý (Single Source of Truth).

Nếu source code khác BusinessLogic.md:

→ sửa source code.

Không sửa ngược BusinessLogic.md.

## 03. Development Rules

- Không tự ý đổi Database.
- Không tự ý đổi API.
- Không tự ý đổi DTO.
- Không tự ý thêm Business Rule.
- Không tự ý refactor.

## 04. Workflow: Báo cáo & Đồng bộ code

- Project này không có `clasp`/`appsscript.json` — không có pipeline tự động push lên Google Apps Script. Mọi đồng bộ lên Apps Script Editor (script.google.com) đều phải làm thủ công.
- Vì vậy, sau khi hoàn thành bất kỳ thay đổi code nào (kể cả sửa nhỏ), phải liệt kê rõ **danh sách file đã sửa** (đường dẫn đầy đủ) ở cuối phản hồi, và nhắc người dùng đẩy/paste các file đó lên Apps Script Editor.

## 05. Toàn bộ Master Data modules phải sử dụng Core Style của APP_v1.3.

Không được copy CSS từ TheLight.
Không được tạo UI framework mới.
TheLight chỉ là tài liệu tham chiếu về:
- Layout
- Workflow
- Business Logic
- Keyboard Flow
- Focus Flow
- User Experience
Không phải nguồn CSS.