"use client";

import Sidebar from "../components/admin-sidebar/page";
import { CssBaseline } from "@mui/material";
import { ColorModeContext } from "../layout"; // correct path

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1, padding: "24px", marginLeft: "280px", backgroundColor: "background.default", minHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
}
