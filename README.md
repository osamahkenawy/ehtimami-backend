# Ehtimami Backend

This is the backend service for the **Ehtimami School Management System**, built with **Node.js (Express), Prisma, MySQL, and MongoDB**.

## 🚀 Features
- User Authentication (Login, Registration)
- Database Management with Prisma ORM
- Role-Based Access Control (Admin, Teachers, Students, Parents)
- Localization Support (Arabic & English)
- School & Class Management API

---

## 📦 Tech Stack
- **Backend:** Node.js (Express)
- **ORM:** Prisma
- **Databases:** MySQL & MongoDB
- **Authentication:** JWT
- **Caching:** Redis (Optional)

---

## ⚡️ Getting Started

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/yourusername/ehtimami-backend.git
cd ehtimami-backend
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Setup Environment Variables
Create a `.env` file in the project root and add:

```env
DATABASE_URL="mysql://root:yourpassword@127.0.0.1:3306/ehtimami_db"
MONGO_URI="mongodb://localhost:27017/ehtimami"
JWT_SECRET="your-secret-key"
PORT=5000
```

---

## 🐄 Database Setup with Prisma

### **🔹 1. Initialize Prisma**
If this is the first time setting up Prisma, run:

```sh
npx prisma init
```

This will generate the `prisma/schema.prisma` file.

---

### **🔹 2. Run Migrations**
After setting up your `.env` file, run:

```sh
npx prisma migrate dev --name init
```

This will create the database tables in MySQL.

---

### **🔹 3. Generate Prisma Client**
```sh
npx prisma generate
```

This ensures Prisma can interact with the database.

---

### **🔹 4. Seed Database (Optional)**
If you have seed data, run:

```sh
npx prisma db seed
```

---

## 🚀 Running the Backend

### **1️⃣ Start the Server**
```sh
npm run dev
```

The API will run on `http://localhost:5000/`.

---

## 🛠 API Endpoints

### **🔹 Authentication**
| Method | Endpoint         | Description            |
|--------|-----------------|------------------------|
| POST   | `/auth/login`   | User Login            |
| POST   | `/auth/register` | User Registration     |

### **🔹 User Management**
| Method | Endpoint         | Description            |
|--------|-----------------|------------------------|
| GET    | `/users`        | Get all users         |
| GET    | `/users/:id`    | Get user by ID        |

---

## 📺 Additional Commands

| Command | Description |
|---------|-------------|
| `npx prisma studio` | Open Prisma Studio for database management |
| `npx prisma db pull` | Sync Prisma schema with database |
| `npx prisma db push` | Push Prisma schema without migration |

---

## 📌 Notes
- Ensure **MySQL is running** before running migrations.
- Use **Postman or Insomnia** to test API endpoints.
- Modify `schema.prisma` if you need to add new models.

---

## 📞 Contact
For support or feature requests, reach out to **Osamah Kenawy**.

---

