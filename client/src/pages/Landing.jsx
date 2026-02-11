import { Link } from 'react-router-dom';

function Landing() {
    return (
        <div className="landing-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at top right, #1a2a6c, #2a0845, #000000)',
            color: '#ffffff',
            padding: '2rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div className="hero-section" style={{
                textAlign: 'center',
                maxWidth: '800px',
                animation: 'fadeIn 1s ease-out'
            }}>
                <div style={{
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    color: '#aebbf2',
                    marginBottom: '1rem',
                    fontWeight: 600
                }}>
                    Evolve Your Workflow
                </div>
                <h1 style={{
                    fontSize: '4.5rem',
                    fontWeight: 800,
                    marginBottom: '1.5rem',
                    lineHeight: 1.1,
                    background: 'linear-gradient(to bottom, #ffffff, #8892b0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Tiny PM<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: '#8892b0',
                    marginBottom: '3rem',
                    lineHeight: 1.6
                }}>
                    A powerful, lightweight project management solution built for modern teams.
                    Create isolated departments, manage complex projects, and drive productivity
                    with precision.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link to="/register" className="btn-add" style={{
                        padding: '1.2rem 2.5rem',
                        fontSize: '1.1rem',
                        textDecoration: 'none',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)',
                        transition: 'transform 0.2s'
                    }}>
                        Get Started Free
                    </Link>
                    <Link to="/login" style={{
                        padding: '1.2rem 2.5rem',
                        fontSize: '1.1rem',
                        textDecoration: 'none',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#ffffff',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(10px)'
                    }}>
                        Sign In
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .landing-container a:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
            `}</style>
        </div>
    );
}

export default Landing;
