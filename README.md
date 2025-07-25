# School Learning Management System (LMS) – President’s College Minuwangoda

A full-stack web-based Learning Management System (LMS) developed as a final year university project, specifically designed for government schools in Sri Lanka. This LMS aims to digitalize school operations including lesson delivery, assignment management, attendance tracking, student performance monitoring, and parent-teacher communication.

---

##  Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Installation Guide](#installation-guide)
- [Future Enhancements](#future-enhancements)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [Author](#Author)

---

##  Project Overview

This LMS is developed to address the digital divide in Sri Lankan government schools by offering a localized, role-based, and fully functional learning and administration platform. Initially designed for **President’s College Minuwangoda**, it is scalable for use across any school in Sri Lanka.

**Goals:**
- Streamline academic and administrative processes
- Bridge gaps in communication among students, teachers, parents, and school management
- Promote digital learning inclusivity in low-resource environments

---

##  Key Features

-  **User Management** (Admin-controlled role-based access)
-  **Lesson & Content Sharing** (by subject and grade)
-  **Assignment Management** (upload, submit, grade)
-  **Student Performance Tracking**
-  **Attendance Management**
-  **Announcements & Notifications**
-  **Internal Messaging System**
-  **Parent Monitoring Access**
-  **Mobile-responsive Interface**

---

##  Technology Stack

| Layer         | Technology                      |
|--------------|----------------------------------|
| Frontend      | HTML5, Tailwind CSS, JavaScript |
| Backend       | Node.js, Express.js             |
| Database      | MongoDB                         |
| Design & UI   | Figma                           |
| Version Ctrl  | Git, GitHub                     |
| Research      | Google Forms                    |

---

##  System Architecture

A modular full-stack JavaScript system using RESTful API design:

- **Frontend:** Static SPA-like pages rendered using HTML + Tailwind
- **Backend:** Node.js with Express.js routing and middleware
- **Database:** MongoDB schema for users, assignments, attendance, etc.
- **Role-based Authentication & Authorization**

---

##  User Roles

1. **Administrator**
   - Manage all users and data
   - Post announcements, view activity
2. **Teacher**
   - Upload lessons, mark attendance, manage assignments
3. **Student**
   - Access materials, submit work, view grades
4. **Parent**
   - Monitor child’s performance and attendance

---

##  Installation Guide

### Prerequisites
- Node.js
- MongoDB (local or Atlas)
- Git

### Clone and Setup

using Git bash

git clone https://github.com/KavindudilshanAberathna/LMS.git
cd lms-project
npm install
npm run dev

# Open in browser
http://localhost:5000


### Clone and Setup

download .zip folder and unzip it
open with vs code
cd lms-project
npm install
npm run dev

# Open in browser
http://localhost:5000

### Future Enhancements

Mobile App with push notifications & offline support
Sinhala & Tamil language support
Nationwide deployment via cloud platform
Integration with Ministry platforms like e-Thaksalawa
Performance optimization & analytics

### Acknowledgements

Mrs. Nethmi Weerasingha – Supervisor
NSBM Green University lecturers
Students, parents & teachers of President’s College
Tuition students for testing & feedback
Open-source developers & communities (MongoDB, Express, Tailwind, Figma)

### License

This project was developed as part of the final year university curriculum and is intended for educational and developmental use.

### Author

Dewmi Umayangana Thathsarani Liyanawaduge
Faculty of Computing, Plymouth University


