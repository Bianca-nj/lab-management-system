# Lab Management System

A web-based system for managing university computer labs, borrowing of items, and issue tracking.

## Tech Stack
- Node.js
- MySQL
- HTML, CSS, JavaScript

## Features
- User authentication
- Lab and floor tracking
- Computer management with status tracking
- Inventory management
- Borrower system with return tracking
- Issue reporting and tracking system

## Environment Variables
Create a `.env` file in the root folder with:
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lab_management

## Setup
1. Clone the repo
2. Run `npm install`
3. Create a `.env` file (see Environment Variables above)
4. Import the database tables into MySQL using phpMyAdmin
5. Run `node server.js`
6. Open `http://localhost:3000` in your browser

## Database
The project uses a MySQL database named `lab_management` with the following tables:

### 1. users
Stores system users.
- id (Primary Key)
- username
- password (hashed using bcrypt)
- phone_number

### 2. floors
Stores building floors.
- id
- name

### 3. labs
Stores labs linked to floors.
- id
- name
- floor_id (Foreign Key → floors)

### 4. computers
Stores computers in each lab.
- id
- lab_id (Foreign Key → labs)
- specs (computer details e.g. Intel i5, 8GB RAM)
- comment
- side (left or right)
- position
- os (operating system)
- status (Working, Has Issue, Out of Service)

### 5. items
Stores lab inventory items.
- id
- item (item type e.g. Projector)
- item_name (specific name e.g. Projector 1)

### 6. borrowers
Tracks borrowed items.
- id
- name (borrower's name)
- item (item type)
- itemName (specific item)
- timeGiven (date and time borrowed)
- returnTime (date and time returned)

### 7. messages
Stores reported issues and responses.
- id
- sender
- content
- reply
- status (Open, Resolved)
- lab_reference
- resolved_by
- resolved_at
- created_at
