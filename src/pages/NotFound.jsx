import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <span style={styles.code}>404</span>
        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.msg}>The page you're looking for doesn't exist or has been moved.</p>
        <div style={styles.links}>
          <Link to="/" style={styles.btnPrimary}>Go Home</Link>
          <Link to="/hotels" style={styles.btnSecondary}>Browse Hotels</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem', background: '#f5f7fa' },
  box: { textAlign: 'center', maxWidth: '480px' },
  code: { fontSize: '6rem', fontWeight: 'bold', color: '#1a6b3c', lineHeight: 1 },
  title: { fontSize: '1.8rem', color: '#1e293b', margin: '0.5rem 0' },
  msg: { color: '#888', marginBottom: '2rem', lineHeight: 1.6 },
  links: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { padding: '0.8rem 2rem', background: '#1a6b3c', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' },
  btnSecondary: { padding: '0.8rem 2rem', border: '2px solid #1a6b3c', color: '#1a6b3c', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' },
};
