# EdTrack - Student Insight & Dropout Prevention System

EdTrack is a comprehensive educational dashboard designed to monitor student performance, attendance, and risk factors. It helps educators identify "at-risk" students early using data visualization and provides tools to generate reports and send automated email alerts.


## 🚀 Features

* **Interactive Dashboard:** Real-time visualization of Average Attendance, GPA, and Risk Distribution.
* **Risk Analysis:** Categorizes students into Low, Medium, and High risk based on academic and attendance data.
* **Report Generation:** Export student data as **PDF**, **Excel**, or **CSV**.
* **Email System:** Integrated email functionality to send reports and alerts directly to users (via Nodemailer).
* **Authentication:** Secure login for Admins, Counselors, and Teachers.
* **Responsive UI:** Built with React, Tailwind CSS, and Shadcn UI.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, Shadcn UI
* **Icons:** Lucide React
* **Charts:** Recharts

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **Database:** MongoDB (Mongoose)
* **Email Service:** Nodemailer (Gmail SMTP)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/edtrack.git](https://github.com/your-username/edtrack.git)
cd edtrack
2. Backend Setup
Navigate to the backend folder and install dependencies.

Bash

cd backend
npm install
Configuration (.env): Create a .env file in the backend/ directory and add the following credentials:

Code snippet

PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_ORIGIN=http://localhost:5173

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_16_char_app_password
(Note: For Gmail, use an App Password, not your login password.)

3. Frontend Setup
Navigate to the frontend folder and install dependencies.

Bash

cd ../frontend
npm install
🏃‍♂️ Running the Project
You need to run the Backend and Frontend in separate terminal windows.

1. Start Backend Server

Bash

cd backend
npm run dev
# Server should run on http://localhost:8080
2. Start Frontend Application

Bash

cd frontend
npm run dev
# App should run on http://localhost:5173
📂 Project Structure
edtrack/
├── backend/
│   ├── src/
│   │   ├── config/         # DB and Email configuration
│   │   ├── models/         # Mongoose Schemas (User, Student)
│   │   ├── routes/         # API Routes (auth, data, email)
│   │   └── index.ts        # Server entry point
│   └── .env                # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Main pages (Dashboard, Reports)
    │   └── lib/            # Utilities (utils.ts)
    └── package.json
📧 How the Email Feature Works
Frontend: The user clicks "Email Report" on the Reports page.

API Call: React sends a POST request to http://localhost:8080/email/send-report.

Backend: The server uses nodemailer with the credentials in .env to authenticate with Gmail.

Delivery: The HTML report is generated and sent to the logged-in user's email address.

🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request for any feature updates.

📄 License
This project is licensed under the MIT License.
