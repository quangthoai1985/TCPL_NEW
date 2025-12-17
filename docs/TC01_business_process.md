# Quy trình nghiệp vụ: Chỉ tiêu 1 - Ban hành VBQPPL

Tài liệu này mô tả chi tiết quy trình nghiệp vụ cho Chỉ tiêu 1 ("Ban hành VBQPPL của HĐND, UBND cấp xã...") thuộc Tiêu chí 1, một trong những chỉ tiêu có logic xử lý phức tạp và tự động hóa cao nhất trong hệ thống.

## Giai đoạn 1: Admin cấu hình và giao nhiệm vụ

Đây là bước khởi đầu, quyết định "luật chơi" cho toàn bộ các đơn vị cấp xã trong một kỳ đánh giá.

1.  **Truy cập**: Admin vào trang **Quản lý Tiêu chí**.
2.  **Mở Tiêu chí 1**: Admin mở rộng mục "Tiêu chí 1: Ban hành văn bản quy phạm pháp luật".
3.  **Chọn loại hình giao nhiệm vụ**: Admin có hai lựa chọn trong phần "Cấu hình đặc biệt":
    *   **Giao nhiệm vụ cụ thể (Specific Assignment)**:
        *   **Mục đích**: Áp dụng khi Tỉnh/Huyện có một danh sách văn bản cụ thể, định danh trước mà các xã phải ban hành.
        *   **Hành động**:
            1.  Admin chọn "Giao nhiệm vụ cụ thể".
            2.  Nhập vào **"Số lượng văn bản được giao"** (ví dụ: 5).
            3.  Hệ thống sẽ tự động tạo ra 5 khối thông tin chi tiết.
            4.  Với mỗi khối, Admin điền đầy đủ: Tên văn bản, Trích yếu, Ngày ban hành (dự kiến), và Thời hạn ban hành (số ngày kể từ ngày ban hành dự kiến).
    *   **Giao theo số lượng (Quantity Assignment)**:
        *   **Mục đích**: Áp dụng khi Tỉnh/Huyện chỉ yêu cầu mỗi xã ban hành một số lượng văn bản nhất định trong năm, nhưng không định danh trước đó là văn bản nào.
        *   **Hành động**:
            1.  Admin chọn "Giao theo số lượng".
            2.  Nhập vào **"Số lượng VBQPPL được giao ban hành trong năm"**.
4.  **Lưu cấu hình**: Admin nhấn "Lưu Cấu hình". Dữ liệu này sẽ được áp dụng cho tất cả các xã trong kỳ đánh giá đang hoạt động.

## Giai đoạn 2: Cán bộ xã thực hiện tự chấm điểm

Sau khi Admin đã cấu hình, cán bộ xã sẽ thấy giao diện tương ứng tại trang "Tự Chấm điểm".

1.  **Truy cập**: Cán bộ xã vào trang **Tự Chấm điểm** và mở rộng "Tiêu chí 1".
2.  **Hiển thị nhiệm vụ**:
    *   Nếu Admin chọn **"Giao nhiệm vụ cụ thể"**: Giao diện sẽ hiển thị chi tiết từng văn bản mà Admin đã giao (Tên, Trích yếu, Ngày ban hành...).
    *   Nếu Admin chọn **"Giao theo số lượng"**: Giao diện sẽ yêu cầu xã phải tự kê khai thông tin cho từng văn bản mà mình đã ban hành (Tên, Ngày ban hành...).
3.  **Nhập kết quả tự đánh giá**:
    *   Cán bộ xã nhập vào ô **"Tổng số VBQPPL đã ban hành"**. Con số này phải khớp với số lượng văn bản được giao và số lượng minh chứng tải lên.
4.  **Tải minh chứng**:
    *   Với mỗi văn bản được giao (hoặc tự kê khai), sẽ có một khu vực tải tệp riêng.
    *   Cán bộ xã phải tải lên tệp **PDF** của văn bản tương ứng. Tệp này **bắt buộc phải có chữ ký số hợp lệ**.
5.  **Ghi chú và Giải trình**: Cán bộ xã có thể điền thêm các ghi chú, giải trình nếu cần thiết.

## Giai đoạn 3: Hệ thống tự động kiểm tra (Phía Backend)

Đây là phần "thông minh" của hệ thống, diễn ra ngầm sau khi cán bộ xã tải tệp PDF lên.

1.  **Kích hoạt (Trigger)**: Ngay khi một tệp PDF được tải lên đúng vào thư mục của Chỉ tiêu 1 trong Firebase Storage, một Cloud Function (`verifyPDFSignature`) sẽ được tự động kích hoạt.
2.  **Trích xuất thông tin**:
    *   Function sẽ đọc nội dung tệp PDF.
    *   Nó phân tích và trích xuất thông tin chữ ký số, quan trọng nhất là **thời gian ký (Signing Time)**.
3.  **Đối chiếu thời hạn**:
    *   Function truy vấn vào Firestore để lấy lại cấu hình mà Admin đã thiết lập cho văn bản đó (dựa vào `docIndex`).
    *   Nó lấy ra `issueDate` (ngày ban hành dự kiến) và `issuanceDeadlineDays` (số ngày cho phép) để tính ra **ngày hết hạn cuối cùng (Deadline)**.
4.  **So sánh và cập nhật**:
    *   Hệ thống so sánh `signingTime` (thời gian ký thực tế) với `deadline` (hạn chót).
    *   Kết quả (`valid` hoặc `invalid`) cùng lý do (ví dụ: "Ký sau thời hạn") sẽ được tự động cập nhật vào trạng thái của chính tệp minh chứng đó.
5.  **Hiển thị kết quả cho xã**: Cán bộ xã sẽ ngay lập tức thấy kết quả kiểm tra chữ ký trên giao diện:
    *   **Hợp lệ (Valid)**: Nếu ký đúng hạn.
    *   **Không hợp lệ (Invalid)**: Nếu ký sau thời hạn.
    *   **Lỗi (Error)**: Nếu tệp PDF không có chữ ký hoặc bị lỗi.

## Giai đoạn 4: Đánh giá cuối cùng

- Trạng thái "Đạt" hay "Không đạt" của toàn bộ Chỉ tiêu 1 sẽ được hệ thống tự động tính toán dựa trên:
    1.  Số lượng văn bản ban hành có khớp với số lượng được giao không.
    2.  Tất cả các tệp minh chứng tải lên có chữ ký số hợp lệ và đúng hạn hay không.

---

Quy trình khép kín này giúp tự động hóa hoàn toàn việc kiểm tra tính tuân thủ về mặt thời gian, giảm thiểu sai sót và đảm bảo tính khách quan cho một trong những chỉ tiêu quan trọng nhất.
