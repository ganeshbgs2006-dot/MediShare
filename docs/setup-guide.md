# MediShare Local Setup & Development Guide

This guide is designed for beginners developing MediShare in Visual Studio Code.

---

## 1. System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: v18.0.0 or higher (Current environment: v24.21.0)
- **npm**: v10.0.0 or higher
- **MySQL Server 8.0** & **MySQL Workbench 8.0** (installed on local machine)
- **Visual Studio Code**

---

## 2. Running the Frontend (Phase 1)

1. Open your terminal in Visual Studio Code (`` Ctrl + ` `` or `Terminal -> New Terminal`).
2. Make sure you are in the project folder:
   ```powershell
   # If you are in the root directory:
   cd frontend
   ```
3. Start the Vite development web server:
   ```powershell
   npm run dev
   ```
4. You will see an output similar to:
   ```
     VITE v6.4.5  ready in 280 ms

     ➜  Local:   http://localhost:5173/
     ➜  Network: use --host to expose
   ```
5. Hold `Ctrl` and click the `http://localhost:5173/` link, or open your web browser and navigate to `http://localhost:5173`.

---

## 3. Important Tips for PowerShell on Windows

If running `npm` in PowerShell gives you a security error regarding script execution:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```
You can use `npm.cmd` instead:
```powershell
npm.cmd run dev
```
Alternatively, set the execution policy in PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## 4. How the Code is Structured

- `frontend/src/styles/variables.css`: Contains CSS variables for brand colors, border radius, shadows, and font settings.
- `frontend/src/components/common/`: Reusable components used across pages (`Button`, `Badge`, `Card`, `Input`, `Modal`, `EquipmentCard`).
- `frontend/src/components/layout/`: Global layout components (`Navbar` with mobile drawer and `Footer` with trust highlights).
- `frontend/src/pages/Home/`: The responsive landing page showcasing search, clinical categories, featured equipment, workflow steps, safety architecture, and community impact.
