My Cattle Manager is a fully client-side farm management system built with vanilla HTML, CSS, and JavaScript. It runs entirely in the browser using localStorage for data persistence, requiring no server or database setup.
Features:

Cattle Registry — Add, view, and manage individual cattle with details like breed, age, weight, health status, and feeding preferences
Milk Production Tracking — Log milk yield, fat %, protein %, and pH per session per animal
Farmer Management — Register and manage farmers linked to specific cattle
Financial Transactions — Track income and expenses with categorisation
Events & Jobs — Schedule and assign farm events and worker tasks
Reports & Analytics — View farm-wide summaries with PDF export support
Role-Based Access — Owner (admin) and Worker roles with protected routes and UI restrictions
Worker Chat — Real-time-like cross-tab messaging between admin and workers via localStorage sync
Security Audit Logs — Login attempt logging with downloadable TXT reports
Data Import/Export — Full database export to Excel (.xlsx) and JSON backup/restore

Tech Stack: HTML5 · CSS3 · Vanilla JavaScript · localStorage · html2pdf.js · SheetJS (xlsx)
