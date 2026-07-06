import React from "react";
import { HelpCircle } from "lucide-react";

export default function EmptyState({
  title = "No Data Available",
  description = "There is no information to display here at the moment.",
  icon: Icon = HelpCircle,
  actionButton
}) {
  return (
    <div className="empty-state" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "48px 24px",
      borderRadius: "16px",
      backgroundColor: "var(--bg-surface)",
      border: "1px dashed var(--border-color)",
      gap: "16px",
      width: "100%",
      minHeight: "220px"
    }}>
      <div style={{
        padding: "16px",
        borderRadius: "50%",
        backgroundColor: "var(--bg-main)",
        color: "var(--text-muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <Icon size={32} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h4 style={{
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: "600",
          color: "var(--text-primary)",
          margin: 0
        }}>
          {title}
        </h4>
        <p style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          maxWidth: "360px",
          margin: "0 auto",
          lineHeight: "1.5"
        }}>
          {description}
        </p>
      </div>
      {actionButton && (
        <div style={{ marginTop: "8px" }}>
          {actionButton}
        </div>
      )}
    </div>
  );
}
