# Contributing Guide

## Git Workflow

###  Branch Strategy

```bash
main        ← Production (protected)
│
develop     ← Integration branch (protected)
│
feature/*   ← New features
bugfix/*    ← Bug fixes
hotfix/*    ← Urgent fixes
```

---

##  Quy trình làm việc

### 1. Clone repo (lần đầu)

```bash
git clone https://github.com/NgocXuyen-ai/Code-for-glory-BE.git
yarn install
```

### 2. Luôn bắt đầu từ `develop` mới nhất

```bash
git checkout develop
git pull origin develop
```

### 3. Tạo branch mới

```bash
git checkout -b feature/ten-tinh-nang
# hoặc
git checkout -b bugfix/ten-loi
```

### 4. Code và commit

```bash
git add .
git commit -m "feat: add users api"
```

### 5. Push lên remote

```bash
git push origin feature/ten-tinh-nang
```

### 6. Tạo Pull Request trên GitHub

* Base: `develop`
* Compare: `feature/ten-tinh-nang`

### 7. Sau khi merge

```bash
git checkout develop
git pull origin develop
git branch -d feature/ten-tinh-nang
```

---

##  Commit Message Convention

**Format:**

```
type: message
```

| Type     | Mô tả                |
| -------- | -------------------- |
| feat     | Tính năng mới        |
| fix      | Sửa lỗi              |
| refactor | Refactor code        |
| docs     | Documentation        |
| test     | Thêm/sửa tests       |
| chore    | Config, dependencies |

### Ví dụ

```bash
feat: add users api
fix: resolve login issue
docs: update README
```

---

##  Code Review

* Mỗi PR cần **ít nhất 1 approval**
* CI phải pass (lint, test, typecheck)
* Resolve tất cả comments trước khi merge

---

##  Getting Started

### Cài dependencies

```bash
yarn install
```

### Start development

```bash
yarn start:dev
```

 API chạy tại: http://localhost:3000

---

##  Project Structure

```bash
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts   # API layer
│       ├── users.service.ts      # business logic
│       ├── schemas/              # MongoDB schema
│       │   └── user.schema.ts
│       └── dto/                  # optional
│           └── create-user.dto.ts
│
├── .husky/
├── .gitignore
├── package.json
├── tsconfig.json
```

---

##  Code Style

* Sử dụng **TypeScript strict mode**
* Follow **ESLint + Prettier**
* Dùng **feature-based structure** (`src/users`)

###  Không push

* `node_modules`
* `dist`
