# DocVault - Premium Document Management System

A full-stack, professional Document Management System built with React, Node.js, Express, and MongoDB.

## Features
- **Sleek Landing Page**: Modern design with animations and glassmorphism.
- **Secure Authentication**: JWT-based login/register with protected routes.
- **Document Management**: Upload, preview, download, and delete files.
- **Dashboard**: Advanced sidebar navigation, search, and document grid/list views.
- **Sharing**: Internal document sharing with other users.
- **Dark Mode**: High-quality dark mode support for all components.
- **Responsive**: Fully optimized for mobile, tablet, and desktop.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Axios, React Hot Toast, React Dropzone.
- **Backend**: Node.js, Express, Mongoose (MongoDB), JWT, Bcrypt, Multer.

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally (or Atlas URI)

### Backend Setup
1. Navigate to `/server`.
2. Install dependencies: `npm install`.
3. Create a `.env` file (one has been provided for you).
4. Start the server: `node server.js`.

### Frontend Setup
1. Navigate to `/client`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## Project Structure
- `/client`: React frontend code.
- `/server`: Node/Express backend code.
- `/server/uploads`: Local storage for uploaded documents.
