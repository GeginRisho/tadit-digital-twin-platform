// PipelineVisualizer.jsx - Interactive diagram of Event-Driven Kafka, Redis, Spark, and GraphQL streams.
import React, { useState, useMemo } from "react";
import { Database, Layers, HardDrive, RefreshCw, Server } from "lucide-react";
import { SamplePayloads } from "./pipeline/SamplePayloads";

export default function PipelineVisualizer({
  kafkaQueue = [],
  sparkWindow = [],
  kubernetesPods = [],
  logs = [],
  selectedBusinessId
}) {
  const [selectedNode, setSelectedNode] = useState("kafka");

  const nodes = [
    {
      id: "sources",
      name: "1. Data Ingestion Sources",
      tech: "Axios / Webhooks",
      status: "online",
      throughput: "14.2 ops/s",
      metrics: "Err rate: 0.01% | Latency: 45ms",
      x: 50,
      y: 70
    },
    {
      id: "kafka",
      name: "2. Apache Kafka Broker",
      tech: `Topic: raw-reviews | Key: biz-id`,
      status: "online",
      throughput: `${(kafkaQueue.length * 0.8).toFixed(1)} msg/s`,
      metrics: `Partition: 0 | Offset: ${kafkaQueue.length}`,
      x: 140,
      y: 70
    },
    {
      id: "spark",
      name: "3. Apache Spark Engine",
      tech: "Spark Streaming (10s Window)",
      status: "processing",
      throughput: "1.2 batches/s",
      metrics: `Buffer: ${sparkWindow.length} records`,
      x: 230,
      y: 70
    },
    {
      id: "redis",
      name: "4. Redis Stream Cache",
      tech: "Redis Stream xadd publisher",
      status: "syncing",
      throughput: "12.8 read/s",
      metrics: "Active Sub Clients: 4 | Volatile",
      x: 320,
      y: 70
    },
    {
      id: "graphql",
      name: "5. GraphQL Gateway",
      tech: "Subscription API Over WSS",
      status: "online",
      throughput: "6.4 pushes/s",
      metrics: "Active Sockets: 142 | Latency: 8ms",
      x: 410,
      y: 70
    },
    {
      id: "dashboard",
      name: "6. React Dashboard Client",
      tech: "React 19 VDOM Ingestion",
      status: "online",
      throughput: "Real-time updates",
      metrics: "VDOM diff engine: active",
      x: 500,
      y: 70
    }
  ];

  const activeNodeData = nodes.find((n) => n.id === selectedNode);

  const activePayload = useMemo(() => {
    const raw = SamplePayloads[selectedNode] || { title: "No schema", description: "Standard Dashboard layout schema data.", schema: '{\n  "status": "No active schema for client VDOM"\n}' };
    const bizId = selectedBusinessId || "biz-1";
    return {
      ...raw,
      schema: raw.schema.replace(/biz-1/g, bizId)
    };
  }, [selectedNode, selectedBusinessId]);

  // Helper to render SVG circular progress ring
  const renderMiniCircularProgress = (percent, color = "var(--primary)") => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <svg width="28" height="28" viewBox="0 0 32 32" style={{ marginRight: "6px" }}>
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="var(--bg-main)"
          strokeWidth="2.5"
        />
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 16 16)"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
        <text
          x="16"
          y="19"
          textAnchor="middle"
          fontSize="7px"
          fontWeight="700"
          fill="var(--text-primary)"
        >
          {percent}
        </text>
      </svg>
    );
  };

  return (
    <div className="card pipeline-card" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)" }}>
      <div className="card-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            <Server size={18} style={{ color: "var(--primary)" }} />
            <span>Event-Driven Telemetry Pipeline Visualizer</span>
          </h2>
          <p className="card-subtitle" style={{ fontSize: "13px" }}>Trace real-time event packets streaming from active scrapers into the user virtual dashboard</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: "24px", marginBottom: "24px" }}>
        {/* Horizontal SVG Flowchart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "var(--bg-main)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", overflowX: "auto" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)", display: "block" }}>
            Ref: Click pipeline nodes to inspect data schemas & live values
          </span>
          <svg viewBox="0 0 550 140" style={{ width: "100%", minWidth: "480px" }}>
            {/* Flow Connecting Cables */}
            {nodes.slice(0, -1).map((node, idx) => {
              const nextNode = nodes[idx + 1];
              const isWarning = node.id === "spark" && sparkWindow.length > 8;
              return (
                <g key={idx}>
                  <path
                    d={`M ${node.x + 18} ${node.y} L ${nextNode.x - 18} ${node.y}`}
                    stroke={isWarning ? "var(--color-red)" : "var(--border-color)"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Glowing Flow Packets Animation */}
                  <circle r="3.5" fill={isWarning ? "var(--color-red)" : "var(--primary)"}>
                    <animateMotion
                      path={`M ${node.x + 18} ${node.y} L ${nextNode.x - 18} ${node.y}`}
                      begin="0s"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3.5" fill={isWarning ? "var(--color-red)" : "var(--secondary)"}>
                    <animateMotion
                      path={`M ${node.x + 18} ${node.y} L ${nextNode.x - 18} ${node.y}`}
                      begin="0.8s"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3.5" fill={isWarning ? "var(--color-red)" : "var(--primary)"}>
                    <animateMotion
                      path={`M ${node.x + 18} ${node.y} L ${nextNode.x - 18} ${node.y}`}
                      begin="1.6s"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Pipeline Interactive Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode === node.id;

              let nodeColor = "var(--primary)";
              if (node.id === "spark" && sparkWindow.length > 8) nodeColor = "var(--color-red)";
              else if (node.id === "redis") nodeColor = "var(--color-amber)";

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node.id)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r="20"
                    fill={nodeColor}
                    opacity={isSelected ? 0.22 : 0}
                    style={{ transition: "all 0.2s" }}
                  />
                  <circle
                    r="15"
                    fill="var(--bg-surface)"
                    stroke={isSelected ? nodeColor : "var(--border-color)"}
                    strokeWidth={isSelected ? "3" : "2"}
                  />
                  <circle r="6" fill={nodeColor} />
                  
                  <text
                    y="32"
                    textAnchor="middle"
                    fontSize="9px"
                    fontWeight="700"
                    fill={isSelected ? "var(--text-primary)" : "var(--text-secondary)"}
                  >
                    {node.name.split(". ")[1].split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Panel */}
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border-color)", borderRadius: "12px", backgroundColor: "var(--bg-main)", overflow: "hidden" }}>
          {activeNodeData && (
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                <Database size={15} style={{ color: "var(--primary)" }} />
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
                  Node Detail: {activeNodeData.name.split(". ")[1]}
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11.5px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Ingest Pipeline Tech</span>
                  <span style={{ fontWeight: "600" }}>{activeNodeData.tech}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Network Throughput</span>
                  <span style={{ fontWeight: "600", color: "var(--color-green)" }}>{activeNodeData.throughput}</span>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Active Metrics</span>
                  <span style={{ fontWeight: "600", color: "var(--color-amber)" }}>{activeNodeData.metrics}</span>
                </div>
              </div>

              <div style={{ marginTop: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Telemetry Frame: {activePayload.title}
                </span>
                <pre style={{
                  margin: 0,
                  padding: "8px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  borderRadius: "6px",
                  fontSize: "10.5px",
                  fontFamily: "var(--font-mono)",
                  overflowX: "auto",
                  maxHeight: "130px"
                }}>
                  {activePayload.schema}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kubernetes Clusters */}
      <div className="kubernetes-section" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
          <Layers size={14} style={{ color: "var(--primary)" }} />
          <span>Kubernetes Pod Auto-Scaler Console (scaling group: `tn-digitaltwin-cluster`)</span>
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
          {kubernetesPods.map((pod, idx) => {
            const cpuInt = parseInt(pod.cpu);
            const memInt = Math.round((parseInt(pod.memory) / 1024) * 100);
            
            return (
              <div key={idx} style={{
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-surface)",
                padding: "10px",
                borderRadius: "8px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <HardDrive size={12} style={{ color: "var(--primary)" }} />
                    <span style={{ fontSize: "11px", fontWeight: "600", maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pod.name.split("-pod")[0]}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "9px",
                    fontWeight: "700",
                    color: "var(--color-green)",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    padding: "1px 4px",
                    borderRadius: "4px"
                  }}>
                    RUNNING
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)" }}>
                  <span>IP: {pod.ip}</span>
                  <span>Restarts: {pod.restarts}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-around", borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {renderMiniCircularProgress(cpuInt, cpuInt > 60 ? "var(--color-red)" : "var(--primary)")}
                    <span style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>CPU</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {renderMiniCircularProgress(memInt, "var(--color-green)")}
                    <span style={{ fontSize: "9.5px", color: "var(--text-secondary)" }}>Mem</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal logs */}
      <div className="pipeline-logs-console bg-dark-black" style={{
        backgroundColor: "var(--bg-secondary)",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        marginTop: "16px",
        border: "1px solid var(--border-color)"
      }}>
        <div className="console-header" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "8px",
          marginBottom: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--danger-color)", display: "inline-block" }}></span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--warning-color)", display: "inline-block" }}></span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--success-color)", display: "inline-block" }}></span>
            </div>
            <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: "600", fontFamily: "var(--font-sans)" }}>
              Central Ingestion & Orchestration Terminal Logs
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--success-color)" }}>
            <RefreshCw size={10} className="spin-animation" />
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)" }}>CONNECTED_WS</span>
          </div>
        </div>
        
        <div className="console-body" style={{
          maxHeight: "150px",
          overflowY: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          lineHeight: "1.5",
          color: "var(--text-primary)"
        }}>
          {logs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", margin: 0 }}>Initializing connection loops to Apache Kafka topics...</p>
          ) : (
            logs.map((log, idx) => {
              let typeColor = "var(--accent-color)";
              if (log.type === "success") typeColor = "var(--success-color)";
              else if (log.type === "warning") typeColor = "var(--warning-color)";
              else if (log.type === "error") typeColor = "var(--danger-color)";

              return (
                <div key={idx} style={{ display: "flex", gap: "8px", margin: "2px 0" }}>
                  <span style={{ color: "var(--text-muted)" }}>[{log.timestamp}]</span>
                  <span style={{ color: "var(--accent-color)" }}>[{log.module}]</span>
                  <span style={{ color: typeColor }}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
