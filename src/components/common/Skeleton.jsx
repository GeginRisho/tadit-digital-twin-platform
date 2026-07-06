import React from "react";

export function SkeletonBase({ className = "", style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        backgroundColor: "var(--border-color)",
        borderRadius: "4px",
        position: "relative",
        overflow: "hidden",
        ...style
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBase style={{ width: "40%", height: "24px" }} />
        <SkeletonBase style={{ width: "20%", height: "16px" }} />
      </div>
      <SkeletonBase style={{ width: "100%", height: "120px", borderRadius: "8px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <SkeletonBase style={{ width: "80%", height: "16px" }} />
        <SkeletonBase style={{ width: "60%", height: "14px" }} />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card skeleton-profile-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "var(--bg-surface)", borderColor: "var(--border-color)" }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <SkeletonBase style={{ width: "64px", height: "64px", borderRadius: "50%" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <SkeletonBase style={{ width: "60%", height: "20px" }} />
          <SkeletonBase style={{ width: "40%", height: "14px" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: "12px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
            <SkeletonBase style={{ width: "50%", height: "12px", marginBottom: "8px" }} />
            <SkeletonBase style={{ width: "70%", height: "18px" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <SkeletonBase style={{ width: "30%", height: "16px" }} />
        <SkeletonBase style={{ width: "100%", height: "100px", borderRadius: "8px" }} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
        <SkeletonBase style={{ width: "30%", height: "16px" }} />
        <SkeletonBase style={{ width: "20%", height: "16px" }} />
        <SkeletonBase style={{ width: "20%", height: "16px" }} />
        <SkeletonBase style={{ width: "15%", height: "16px" }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
          <SkeletonBase style={{ width: "25%", height: "14px" }} />
          <SkeletonBase style={{ width: "15%", height: "14px" }} />
          <SkeletonBase style={{ width: "18%", height: "14px" }} />
          <SkeletonBase style={{ width: "10%", height: "18px", borderRadius: "10px" }} />
        </div>
      ))}
    </div>
  );
}
