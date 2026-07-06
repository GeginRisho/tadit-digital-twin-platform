// AIRecommendations.jsx - Hub for real-time anomaly alerts and AI response actions.
import React, { useState, useMemo } from "react";
import { Sparkles, ShieldAlert, CheckCircle2, Flame, AlertTriangle, Info, Clock, History, HelpCircle } from "lucide-react";

export default function AIRecommendations({
  alerts = [],
  executionHistory = [],
  onExecuteRecommendation,
  onDismissAlert,
  selectedBusinessId
}) {
  const [activeTab, setActiveTab] = useState("active"); // active, history

  // Filter alerts to show only recommendations for the active business
  const filteredAlerts = useMemo(() => {
    if (!selectedBusinessId) return [];
    return alerts.filter((alert) => alert.businessId === selectedBusinessId);
  }, [alerts, selectedBusinessId]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span style={{
            fontSize: "10px",
            fontWeight: "700",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "var(--color-red)",
            padding: "2px 8px",
            borderRadius: "4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px"
          }}>
            <Flame size={10} /> CRITICAL
          </span>
        );
      case "WARNING":
        return (
          <span style={{
            fontSize: "10px",
            fontWeight: "700",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "var(--color-amber)",
            padding: "2px 8px",
            borderRadius: "4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px"
          }}>
            <AlertTriangle size={10} /> WARNING
          </span>
        );
      default:
        return (
          <span style={{
            fontSize: "10px",
            fontWeight: "700",
            backgroundColor: "var(--primary-light)",
            color: "var(--primary)",
            padding: "2px 8px",
            borderRadius: "4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "3px"
          }}>
            <Info size={10} /> ADVISORY
          </span>
        );
    }
  };

  const getSeverityBorder = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "3px solid var(--color-red)";
      case "WARNING":
        return "3px solid var(--color-amber)";
      default:
        return "3px solid var(--primary)";
    }
  };

  return (
    <div className="card alerts-card" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)" }}>
      <div className="card-header" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "12px",
        marginBottom: "16px"
      }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} style={{ color: "var(--primary)" }} />
            <span>AI Recommendation Center & Response Playbooks</span>
          </h2>
          <p className="card-subtitle" style={{ fontSize: "13px" }}>Auto-generated playbooks generated from real-time NLP and GIS anomaly detection</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "4px", backgroundColor: "var(--bg-main)", padding: "3px", borderRadius: "8px" }}>
          <button
            onClick={() => setActiveTab("active")}
            style={{
              border: "none",
              background: activeTab === "active" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "active" ? "var(--text-primary)" : "var(--text-secondary)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: activeTab === "active" ? "var(--shadow-sm)" : "none"
            }}
          >
            <ShieldAlert size={12} />
            <span>Active Alerts ({filteredAlerts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              border: "none",
              background: activeTab === "history" ? "var(--bg-surface)" : "transparent",
              color: activeTab === "history" ? "var(--text-primary)" : "var(--text-secondary)",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: activeTab === "history" ? "var(--shadow-sm)" : "none"
            }}
          >
            <History size={12} />
            <span>Execution History ({executionHistory.length})</span>
          </button>
        </div>
      </div>

      <div className="alerts-body-container">
        {activeTab === "active" ? (
          filteredAlerts.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "var(--bg-main)",
              border: "1px dashed var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-muted)"
            }}>
              <CheckCircle2 size={32} style={{ color: "var(--color-green)", margin: "0 auto 12px" }} />
              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                {!selectedBusinessId ? "No active Twin selected" : "Twin Status: Healthy"}
              </h4>
              <p style={{ margin: 0, fontSize: "12px" }}>
                {!selectedBusinessId
                  ? "Please choose a registered business twin to review recommendations."
                  : "No anomalies or incident reports detected currently. Ready to inject alerts via Business twin profile side drawer."
                }
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-color)",
                    borderLeft: getSeverityBorder(alert.priority),
                    borderRadius: "8px",
                    padding: "14px",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    transition: "transform 0.15s"
                  }}
                  className="alert-card-hover"
                >
                  {/* Priority & Confidence */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {getPriorityBadge(alert.priority)}
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--primary)", backgroundColor: "var(--primary-light)", padding: "1px 6px", borderRadius: "4px" }}>
                      Confidence: {alert.confidence}%
                    </span>
                  </div>

                  {/* Target Entity details */}
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Target Twin</span>
                    <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{alert.businessName}</strong>
                    <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "block", marginTop: "4px", lineHeight: "1.4" }}>
                      {alert.description}
                    </span>
                  </div>

                  {/* AI Reasoning summary details */}
                  <div style={{ backgroundColor: "var(--bg-main)", padding: "8px", borderRadius: "6px", fontSize: "11px", border: "1px solid var(--border-color)" }}>
                    <div style={{ fontWeight: "700", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                      <HelpCircle size={10} /> AI Reason Summary
                    </div>
                    <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{alert.reason}</span>
                  </div>

                  {/* Recommendations Playbook action details */}
                  <div style={{ backgroundColor: "var(--primary-light)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "6px", fontSize: "11.5px" }}>
                    <div style={{ fontWeight: "700", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                      <Sparkles size={11} /> Suggested Response Playbook
                    </div>
                    <p style={{ margin: 0, color: "var(--text-primary)", lineHeight: "1.4" }}>{alert.recommendation}</p>
                  </div>

                  {/* Playbook executable triggers */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "auto", paddingTop: "6px", borderTop: "1px solid var(--border-color)" }}>
                    <button
                      onClick={() => onExecuteRecommendation(alert)}
                      style={{
                        flex: 1,
                        backgroundColor: "var(--primary)",
                        color: "var(--bg-primary)",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px"
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>Execute Playbook</span>
                    </button>
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-secondary)",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                        cursor: "pointer"
                      }}
                      className="btn-playback"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Execution History Panel */
          executionHistory.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "var(--bg-main)",
              border: "1px dashed var(--border-color)",
              borderRadius: "8px",
              color: "var(--text-muted)"
            }}>
              <Clock size={32} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>No Playbooks Executed</h4>
              <p style={{ margin: 0, fontSize: "12px" }}>Trigger anomalies and click "Execute Playbook" to view telemetry logs and resolution timings.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                <thead style={{ backgroundColor: "var(--bg-main)", borderBottom: "1px solid var(--border-color)" }}>
                  <tr>
                    <th style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: "600" }}>Executed Plan</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: "600" }}>Target Twin</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: "600" }}>Outcome</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: "600" }}>Timeline</th>
                    <th style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {executionHistory.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text-primary)" }}>
                        {item.planName}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--primary)" }}>{item.businessName}</td>
                      <td style={{ padding: "10px 14px", color: "var(--color-green)", fontSize: "12px" }}>{item.outcome}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                        {item.timestamp} (resolves in {item.resolutionTime})
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span style={{
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          color: "var(--color-green)",
                          fontSize: "10.5px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
