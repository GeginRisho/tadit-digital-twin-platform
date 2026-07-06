// TimelinePlayback.jsx - Controls to review the business state chronologically.
import React, { useState, useEffect, useMemo } from "react";
import { Play, Pause, RotateCcw, Clock, Calendar, Filter } from "lucide-react";

export default function TimelinePlayback({
  playbackIndex,
  onPlaybackChange,
  isPlaybackMode,
  onTogglePlaybackMode,
  selectedBusiness,
  viewType = "monthly"
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [eventFilter, setEventFilter] = useState("all"); // all, milestone, crisis, festival, competitor

  const periods = useMemo(() => {
    if (viewType === "weekly") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (viewType === "quarterly") {
      return ["Q1", "Q2", "Q3", "Q4"];
    } else if (viewType === "yearly") {
      return ["2022", "2023", "2024", "2025", "2026"];
    } else {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    }
  }, [viewType]);

  useEffect(() => {
    let timer = null;
    if (isPlaying && isPlaybackMode) {
      timer = setInterval(() => {
        if (playbackIndex < periods.length - 1) {
          onPlaybackChange(playbackIndex + 1);
        } else {
          setIsPlaying(false); // Stop at the end of the period
        }
      }, 1800);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackIndex, isPlaybackMode, onPlaybackChange, periods.length]);

  const handlePlayToggle = () => {
    if (!isPlaybackMode) {
      onTogglePlaybackMode(true);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value);
    if (!isPlaybackMode) {
      onTogglePlaybackMode(true);
    }
    onPlaybackChange(val);
  };

  const handleReset = () => {
    setIsPlaying(false);
    onPlaybackChange(0);
  };

  const handleExitPlayback = () => {
    setIsPlaying(false);
    onTogglePlaybackMode(false); // Resume live
  };

  const timelineHistory = useMemo(() => {
    if (!selectedBusiness) return [];
    if (viewType === "weekly") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
        const offset = Math.sin((idx + parseInt(selectedBusiness.id.split("-")[1] || 0)) * 0.9) * 3;
        const health = Math.max(50, Math.min(100, Math.round(selectedBusiness.currentHealth + offset)));
        const rating = Math.max(1.0, Math.min(5.0, Number((selectedBusiness.currentRating + offset * 0.05).toFixed(1))));
        const sentiment = Math.max(0.1, Math.min(1.0, Number((selectedBusiness.sentimentScore + offset * 0.01).toFixed(2))));
        const revenue = Math.round((selectedBusiness.baseRevenue || 210) * (health / 100) / 30);
        const events = [
          "Routine sensor calibration active.",
          "Security audit patch applied.",
          "Energy efficiency optimization pass.",
          "Grid synchronization logs validated.",
          "Supply chain intake log verified.",
          "Weekly performance checkpoint.",
          "System telemetry backup complete."
        ];
        return {
          label: day,
          event: events[idx % events.length],
          health,
          rating,
          sentiment,
          revenue,
          type: idx === 1 ? "milestone" : idx === 3 ? "competitor" : "normal"
        };
      });
    } else if (viewType === "quarterly") {
      return ["Q1", "Q2", "Q3", "Q4"].map((q, idx) => {
        const startM = idx * 3;
        const monthsSubset = selectedBusiness.history.slice(startM, startM + 3);
        const avgHealth = Math.round(monthsSubset.reduce((sum, m) => sum + m.health, 0) / 3);
        const avgRating = Number((monthsSubset.reduce((sum, m) => sum + m.rating, 0) / 3).toFixed(1));
        const avgSentiment = Number((monthsSubset.reduce((sum, m) => sum + m.sentiment, 0) / 3).toFixed(2));
        const totalRev = monthsSubset.reduce((sum, m) => {
          const seasonalFactor = m.type === "festival" ? 1.25 : m.type === "crisis" ? 0.8 : 1.0;
          return sum + Math.round((selectedBusiness.baseRevenue || 210) * (m.health / 100) * seasonalFactor);
        }, 0);
        const auditEvent = monthsSubset.find(m => m.type !== "normal") || monthsSubset[0];
        return {
          label: q,
          event: auditEvent ? `${q} Event: ${auditEvent.event}` : `${q} Operations consolidated.`,
          health: avgHealth,
          rating: avgRating,
          sentiment: avgSentiment,
          revenue: totalRev,
          type: auditEvent ? auditEvent.type : "normal"
        };
      });
    } else if (viewType === "yearly") {
      return ["2022", "2023", "2024", "2025", "2026"].map((year, idx) => {
        const discount = 1 - (4 - idx) * 0.07;
        const health = Math.max(50, Math.min(100, Math.round(selectedBusiness.currentHealth * (0.9 + idx * 0.02))));
        const rating = Math.max(1.0, Math.min(5.0, Number((selectedBusiness.currentRating * (0.95 + idx * 0.01)).toFixed(1))));
        const sentiment = Math.max(0.1, Math.min(1.0, Number((selectedBusiness.sentimentScore * (0.97 + idx * 0.005)).toFixed(2))));
        
        const currentYearTotalRev = selectedBusiness.history.reduce((sum, m) => {
          const seasonalFactor = m.type === "festival" ? 1.25 : m.type === "crisis" ? 0.8 : 1.0;
          return sum + Math.round((selectedBusiness.baseRevenue || 210) * (m.health / 100) * seasonalFactor);
        }, 0);
        const revenue = Math.round(currentYearTotalRev * discount);
        
        const events = [
          "First deployment and node registration.",
          "SaaS portal integration successfully complete.",
          "State digital twin governance audit passed.",
          "Telemetry pipeline capacity doubled.",
          "YTD operational throughput optimized."
        ];
        return {
          label: year,
          event: events[idx % events.length],
          health,
          rating,
          sentiment,
          revenue,
          type: idx === 2 ? "milestone" : "normal"
        };
      });
    } else {
      // monthly
      return selectedBusiness.history.map((h) => {
        const seasonalFactor = h.type === "festival" ? 1.25 : h.type === "crisis" ? 0.8 : 1.0;
        const revenue = Math.round((selectedBusiness.baseRevenue || 210) * (h.health / 100) * seasonalFactor);
        return {
          label: h.month,
          event: h.event,
          health: h.health,
          rating: h.rating,
          sentiment: h.sentiment,
          revenue,
          type: h.type
        };
      });
    }
  }, [selectedBusiness, viewType]);

  // Compute stats of the active historical month
  const activeHistoryEvent = timelineHistory[playbackIndex] || {
    event: "Baseline operation status",
    health: 80,
    rating: 4.0,
    type: "normal",
    revenue: 0
  };

  if (!selectedBusiness) {
    return (
      <div className="card timeline-card-wrapper" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)", padding: "20px", opacity: 0.6 }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={16} />
          <span>Timeline Playback Disabled</span>
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
          Select an active business twin on the map to unlock chronological playback.
        </p>
      </div>
    );
  }

  const currentMonthRevenue = activeHistoryEvent.revenue;

  return (
    <div className="card timeline-card-wrapper" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)", padding: "20px" }}>
      <div className="timeline-header-block" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div className="title-area">
          <h3 className="sub-panel-title" style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} style={{ color: "var(--primary)" }} />
            <span>Digital Twin Timeline Scrubbing (12-Month Auditing)</span>
          </h3>
          <p className="caption-text" style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
            Review chronological performance, business milestones, and seasonal anomalies.
          </p>
        </div>
        
        <div className="status-mode-container">
          {isPlaybackMode ? (
            <span style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--color-amber)",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid var(--color-amber)",
              padding: "4px 10px",
              borderRadius: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span className="dot pulse-amber" style={{ width: "6px", height: "6px", backgroundColor: "var(--color-amber)", borderRadius: "50%" }}></span>
              HISTORICAL REVIEW ACTIVE (LIVE PAUSED)
            </span>
          ) : (
            <span style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "var(--color-green)",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid var(--color-green)",
              padding: "4px 10px",
              borderRadius: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span className="dot pulse-green" style={{ width: "6px", height: "6px", backgroundColor: "var(--color-green)", borderRadius: "50%" }}></span>
              LIVE SYNCHRONIZATION ACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="timeline-controls-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Row 1: Playback Buttons & Event Filters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div className="controls-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handlePlayToggle}
              className={`btn-playback play-pause-btn ${isPlaying ? "playing" : ""}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: isPlaying ? "var(--bg-main)" : "var(--primary)",
                color: isPlaying ? "var(--text-primary)" : "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: "600",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? "Pause Stream" : "Play Timeline"}</span>
            </button>

            <button
              onClick={handleReset}
              title="Restart timeline to Jan"
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                padding: "6px",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--text-secondary)"
              }}
              className="btn-playback"
            >
              <RotateCcw size={12} />
            </button>

            {isPlaybackMode && (
              <button
                onClick={handleExitPlayback}
                className="btn-playback exit-live-btn"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid var(--color-green)",
                  color: "var(--color-green)",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                ⚡ Return to Live
              </button>
            )}
          </div>

          {/* Event Filter pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Filter size={12} /> Filter events:
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              {[
                { id: "all", label: "All" },
                { id: "milestone", label: "Milestones" },
                { id: "crisis", label: "Crises" },
                { id: "festival", label: "Festivals" },
                { id: "competitor", label: "Competitors" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setEventFilter(f.id)}
                  style={{
                    backgroundColor: eventFilter === f.id ? "var(--border-color)" : "transparent",
                    color: eventFilter === f.id ? "var(--text-primary)" : "var(--text-muted)",
                    border: "none",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: eventFilter === f.id ? "600" : "400"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Desktop Horizontal Scrubber */}
        <div className="timeline-desktop-slider" style={{ position: "relative" }}>
          <div className="months-labels" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            {periods.map((m, idx) => {
              const monthEvent = timelineHistory[idx];
              const matchesFilter = eventFilter === "all" || monthEvent?.type === eventFilter;
              
              let monthTextColor = "var(--text-muted)";
              let fontWeight = "400";
              
              if (idx === playbackIndex && isPlaybackMode) {
                monthTextColor = "var(--primary)";
                fontWeight = "700";
              } else if (matchesFilter) {
                monthTextColor = "var(--text-secondary)";
                fontWeight = "600";
              }

              return (
                <span
                  key={m}
                  onClick={() => {
                    if (!isPlaybackMode) onTogglePlaybackMode(true);
                    onPlaybackChange(idx);
                  }}
                  className={`month-label-btn ${playbackIndex === idx && isPlaybackMode ? "active" : ""}`}
                  style={{
                    fontSize: "11px",
                    color: monthTextColor,
                    fontWeight: fontWeight,
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    backgroundColor: matchesFilter && eventFilter !== "all" ? "var(--border-color)" : "transparent"
                  }}
                >
                  {m}
                </span>
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max={periods.length - 1}
            value={playbackIndex}
            onChange={handleSliderChange}
            style={{
              width: "100%",
              cursor: "pointer",
              height: "6px",
              borderRadius: "3px",
              outline: "none"
            }}
          />
        </div>

        {/* Row 2: Mobile Vertical Roadmap List */}
        <div className="timeline-mobile-list timeline-road-container" style={{ display: "none" }}>
          {periods.map((m, idx) => {
            const monthEvent = timelineHistory[idx];
            const matchesFilter = eventFilter === "all" || monthEvent?.type === eventFilter;
            const isActive = idx === playbackIndex && isPlaybackMode;

            let dotColor = "var(--border-hover)";
            if (isActive) dotColor = "var(--primary)";
            else if (matchesFilter && eventFilter !== "all") {
              if (monthEvent?.type === "crisis") dotColor = "var(--color-red)";
              else if (monthEvent?.type === "festival") dotColor = "var(--primary)";
              else dotColor = "var(--color-amber)";
            }

            return (
              <div 
                key={m} 
                className="timeline-month-node"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  position: "relative",
                  cursor: "pointer",
                  padding: "8px 0"
                }}
                onClick={() => {
                  if (!isPlaybackMode) onTogglePlaybackMode(true);
                  onPlaybackChange(idx);
                }}
              >
                <div 
                  className="timeline-month-dot"
                  style={{ 
                    width: "14px", 
                    height: "14px", 
                    borderRadius: "50%", 
                    backgroundColor: dotColor,
                    border: isActive ? "3px solid var(--bg-surface)" : "none",
                    boxShadow: isActive ? "0 0 0 2px var(--primary)" : "none",
                    zIndex: 2,
                    marginLeft: "8px"
                  }} 
                />
                <span 
                  className="timeline-month-label"
                  style={{ 
                    fontSize: "13px", 
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "var(--primary)" : "var(--text-secondary)",
                    marginLeft: "16px"
                  }}
                >
                  {m} {viewType === "monthly" ? "2026" : ""} {monthEvent && monthEvent.event && (
                    <span style={{ fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", marginLeft: "8px" }}>
                      ({monthEvent.event})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Row 3: Selected Month historical card */}
        {isPlaybackMode && selectedBusiness && (
          <div className="timeline-historical-report" style={{
            backgroundColor: "var(--bg-main)",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            padding: "12px 16px"
          }}>
            <div className="report-header" style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--text-secondary)",
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "6px",
              marginBottom: "8px"
            }}>
              <Calendar size={13} style={{ color: "var(--color-amber)" }} />
              <span>Audited Log Summary: {periods[playbackIndex]} {viewType === "monthly" ? "2026" : ""}</span>
              <span style={{
                fontSize: "10px",
                fontWeight: "700",
                marginLeft: "auto",
                backgroundColor: activeHistoryEvent.type === "crisis" ? "rgba(239, 68, 68, 0.15)" : activeHistoryEvent.type === "festival" ? "rgba(59, 130, 246, 0.15)" : "var(--border-color)",
                color: activeHistoryEvent.type === "crisis" ? "var(--color-red)" : activeHistoryEvent.type === "festival" ? "var(--primary)" : "var(--text-secondary)",
                padding: "2px 6px",
                borderRadius: "4px",
                textTransform: "uppercase"
              }}>
                {activeHistoryEvent.type}
              </span>
            </div>

            <div className="report-content-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <span className="lbl" style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Primary Event</span>
                <span className="val" style={{ fontSize: "12px", fontWeight: "600" }}>{activeHistoryEvent.event}</span>
              </div>
              <div>
                <span className="lbl" style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Simulated Revenue</span>
                <span className="val" style={{ fontSize: "12px", fontWeight: "600" }}>₹{currentMonthRevenue} Lakhs</span>
              </div>
              <div>
                <span className="lbl" style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Avg Health</span>
                <span className="val" style={{ fontSize: "12px", fontWeight: "600", color: "var(--primary)" }}>{activeHistoryEvent.health}%</span>
              </div>
              <div>
                <span className="lbl" style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>Roll Rating</span>
                <span className="val" style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-amber)" }}>⭐ {activeHistoryEvent.rating}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
