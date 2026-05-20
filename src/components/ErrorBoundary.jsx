import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.box}>
            <span style={styles.icon}>⚠️</span>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.msg}>An unexpected error occurred. Please refresh the page.</p>
            <button style={styles.btn} onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' },
  box: { textAlign: 'center', maxWidth: '400px' },
  icon: { fontSize: '3rem' },
  title: { color: '#1e293b', margin: '1rem 0 0.5rem' },
  msg: { color: '#888', marginBottom: '1.5rem' },
  btn: { padding: '0.7rem 1.5rem', background: '#1a6b3c', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
};
