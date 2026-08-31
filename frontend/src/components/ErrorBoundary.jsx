import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-screen">
          <h1>Harbor could not load.</h1>
          <p>{this.state.error.message}</p>
          <p>Restart the dev server and refresh this page at http://127.0.0.1:5173.</p>
        </main>
      );
    }

    return this.props.children;
  }
}
