# Hệ Thống Đánh Giá Chuẩn Tiếp Cận Pháp Luật (TCPL)

![Status](https://img.shields.io/badge/status-active-success.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748)

## 📖 Giới thiệu
Hệ thống phần mềm hỗ trợ quản lý, đánh giá và công nhận xã, phường, thị trấn đạt chuẩn tiếp cận pháp luật. Dự án được thiết kế lại toàn diện nhằm tối ưu hóa quy trình nghiệp vụ, nâng cao trải nghiệm người dùng và đảm bảo tính chính xác, bảo mật của dữ liệu.

Hệ thống hoạt động độc lập trên nền tảng **Next.js** và **PostgreSQL**, cung cấp giải pháp số hóa toàn trình cho công tác đánh giá tiếp cận pháp luật.

## 🚀 Công nghệ sử dụng

Dự án sử dụng các công nghệ tiên tiến nhất hiện nay:

- **Frontend & Backend Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) kết hợp với [Shadcn UI](https://ui.shadcn.com/) cho giao diện hiện đại, nhất quán.
- **Database ORM:** [Prisma](https://www.prisma.io/) giúp tương tác với cơ sở dữ liệu an toàn và hiệu quả.
- **Database:** [PostgreSQL](https://www.postgresql.org/) - Cơ sở dữ liệu quan hệ mạnh mẽ.
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) quản lý xác thực và phân quyền người dùng.
- **Form Handling:** React Hook Form + Zod validation.
- **Animation:** Framer Motion.

## ✨ Tính năng nổi bật

- **⚡ Tự đánh giá thông minh:** Giao diện chấm điểm các tiêu chí (TC1 - TC5) trực quan, tự động tính toán điểm số và tiến độ.
- **📂 Quản lý minh chứng số:** Hỗ trợ upload, xem trước và quản lý tập trung các tài liệu minh chứng cho từng chỉ tiêu.
- **📊 Dashboard trực quan:** Báo cáo thống kê tình hình thực hiện bằng biểu đồ, giúp lãnh đạo dễ dàng theo dõi và chỉ đạo.
- **🔐 Phân quyền đa cấp:** Hệ thống phân quyền chi tiết cho cán bộ cấp Xã, Huyện và Tỉnh.
- **📱 Responsive:** Tương thích hoàn hảo trên mọi thiết bị (Desktop, Tablet, Mobile).

## 🛠️ Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js 18.17 trở lên
- PostgreSQL 15+
- Git

### Các bước triển khai

1. **Clone dự án**
   ```bash
   git clone https://github.com/quangthoai1985/TCPL_NEW.git
   cd TCPL_NEW
   ```

2. **Cài đặt thư viện**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**
   Tạo file `.env` tại thư mục gốc và cấu hình các biến môi trường cần thiết (tham khảo `.env.example`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/tcpl_db?schema=public"
   NEXTAUTH_SECRET="your-secret-key-at-least-32-chars"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Khởi tạo cơ sở dữ liệu**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Chạy ứng dụng (Development)**
   ```bash
   npm run dev
   ```
   Truy cập `http://localhost:9003` để trải nghiệm.

6. **Build cho Production**
   ```bash
   npm run build
   npm start
   ```

## 🤝 Đóng góp
Dự án được phát triển nội bộ. Mọi đóng góp vui lòng tạo Pull Request hoặc gửi Issue trên Repository này.

## 📄 Bản quyền
Bản quyền thuộc về đội ngũ phát triển dự án TCPL.
x.