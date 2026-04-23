CONTRIBUTING.md (Backend Express + TypeScript)
# Hướng dẫn đóng góp - Backend (Express + TypeScript)

Dự án backend sử dụng Node.js, Express và TypeScript theo kiến trúc module rõ ràng.

---

##  Yêu cầu trước khi bắt đầu

- Node.js >= 18
- npm >= 9
- Git

---

##  Quy trình Git

### Chiến lược nhánh


main → Production (ổn định, không sửa trực tiếp)
develop → Nhánh phát triển chính
feature/* → Tính năng mới
bugfix/* → Sửa lỗi
hotfix/* → Sửa lỗi gấp trên production


---

##  Quy trình làm việc

### 1. Clone project

```bash
git clone <repo-url>
cd backend
npm install
2. Luôn cập nhật từ develop
git checkout develop
git pull origin develop
3. Tạo nhánh mới
git checkout -b feature/ten-tinh-nang
# hoặc
git checkout -b bugfix/ten-loi
4. Code theo nguyên tắc
Viết code sạch, dễ hiểu
Không viết logic trong routes
Tách rõ:
routes → chỉ định tuyến API
controllers → xử lý request/response
services → xử lý logic chính
Dùng async/await
5. Commit code
git add .
git commit -m "feat: thêm chức năng đăng nhập"
 Quy ước commit
Loại	Ý nghĩa
feat	Thêm tính năng mới
fix	Sửa lỗi
refactor	Tối ưu lại code
docs	Cập nhật tài liệu
test	Thêm/sửa test
chore	Cấu hình, thư viện
Ví dụ:
feat: thêm API đăng nhập
fix: sửa lỗi validate token
refactor: tách logic sang service
docs: cập nhật tài liệu API
 Push code & tạo Pull Request
git push origin feature/ten-nhanh

Sau đó tạo Pull Request trên GitHub:

Base: develop
Compare: feature/ten-nhanh
 Quy tắc review code
Cần ít nhất 1 người review
Không được merge trực tiếp vào main
CI phải pass (nếu có)
Phải xử lý hết comment trước khi merge
 Cấu trúc project
backend/
└── src/
    ├── routes/        # Định nghĩa API
    ├── controllers/   # Xử lý request/response
    ├── services/      # Logic nghiệp vụ
    ├── middleware/    # Middleware (auth, validate,...)
    ├── config/        # Cấu hình môi trường
    ├── utils/         # Hàm hỗ trợ
    ├── types/         # TypeScript types
    └── server.ts      # Điểm khởi chạy
🚫 Không được làm
❌ Push trực tiếp lên main
❌ Commit node_modules hoặc dist
❌ Đẩy file .env lên GitHub
❌ Viết business logic trong routes
🔐 File môi trường (.env)
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key