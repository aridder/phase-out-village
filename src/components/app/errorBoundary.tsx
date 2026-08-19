import React from "react";

/**
 * The last line of defence.
 *
 * Without one of these, any throw during render unmounts the entire React
 * tree and leaves a blank white page — and because most of this app's state
 * lives in `sessionStorage`, a reload would reproduce whatever caused it.
 * The player would have no route back into the game.
 *
 * So the fallback does the one thing that reliably helps: it offers to
 * clear the stored session and start over.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Kept: without it a crash leaves no trace at all in the console
    console.error("Oljespillet krasjet:", error, info.componentStack);
  }

  private reset = () => {
    try {
      sessionStorage.clear();
    } catch {
      // Storage blocked — reloading is still worth a try
    }
    window.location.hash = "#/";
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <h1>Noe gikk galt</h1>
        <p>
          Spillet stoppet uventet. Det skyldes som regel data som er lagret fra
          en tidligere versjon av siden.
        </p>
        <button className="primary" onClick={this.reset}>
          Nullstill og start på nytt
        </button>
        <p className="crash-detail">
          <code>{this.state.error.message}</code>
        </p>
      </div>
    );
  }
}
