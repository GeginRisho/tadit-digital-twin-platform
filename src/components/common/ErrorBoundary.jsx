import React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card error-boundary-card text-center" style={{ padding: "40px", border: "1px solid var(--danger-color)", backgroundColor: "var(--bg-secondary)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "12px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--danger-color)" }}>
              <ShieldAlert size={32} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "20px", fontWeight: "600" }}>Component Error Caught</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", maxWidth: "400px", margin: "0 auto" }}>
              An unexpected rendering error occurred inside this module. The rest of the digital twin network remains active.
            </p>
            {this.state.error && (
              <pre style={{
                backgroundColor: "var(--bg-main)",
                color: "var(--danger-color)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "12px",
                width: "100%",
                maxWidth: "500px",
                overflowX: "auto",
                fontFamily: "var(--font-mono)",
                textAlign: "left",
                border: "1px solid var(--border-color)"
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="btn btn-action-execute"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "var(--primary)",
                color: "var(--bg-primary)",
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} />
              <span>Retry Rendering</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
