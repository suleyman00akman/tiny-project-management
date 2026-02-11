import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterOrg() {
    const { registerOrg } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        orgName: '',
        adminUsername: '',
        adminEmail: '',
        adminPassword: '',
        deptName: '',
        members: [] // Kept as empty array for API compatibility
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = () => {
        setError('');
        if (step === 1 && !formData.orgName) return setError("Organization Name is required");
        if (step === 2) {
            if (!formData.adminUsername || !formData.adminEmail || !formData.adminPassword) return setError("All Admin fields are required");
        }
        if (step === 3 && !formData.deptName) return setError("Department Name is required");

        setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Create FormData (keeping structured for potential future expansion/API expectations)
        const data = new FormData();
        data.append('orgName', formData.orgName);
        data.append('adminUsername', formData.adminUsername);
        data.append('adminEmail', formData.adminEmail);
        data.append('adminPassword', formData.adminPassword);
        data.append('deptName', formData.deptName);
        data.append('members', JSON.stringify([])); // Empty members array

        const res = await registerOrg(data);

        setLoading(false);
        if (res.success) {
            setStep(5); // Move to Success Step (now 5 instead of 6)
        } else {
            setError(res.message);
        }
    };

    // Educational Content
    const getHelpContent = () => {
        switch (step) {
            case 1: return { title: "Organization", text: "This is your digital headquarters. Think of it as your company account (e.g., 'Acme Corp')." };
            case 2: return { title: "Super Admin", text: "You are creating the owner account. You will have full control over billing, users, and settings." };
            case 3: return { title: "First Department", text: "Departments organize your company into functional units (e.g., 'Engineering', 'Marketing'). You'll start with this one." };
            case 4: return { title: "Review", text: "Double-check your details. Once you click 'Complete', your environment will be provisioned instantly." };
            case 5: return { title: "Welcome!", text: "Your organization has been successfully created. You can now log in to the dashboard." };
            default: return {};
        }
    };

    const help = getHelpContent();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            padding: '2rem'
        }}>
            <div style={{
                display: 'flex',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                maxWidth: '900px',
                minHeight: '500px',
                backdropFilter: 'blur(10px)',
                overflow: 'hidden'
            }}>
                {/* LEFT: FORM Wizard */}
                <div style={{ flex: 2, padding: '3rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', opacity: 0.5, gap: '0.5rem', marginBottom: '1rem' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: s <= step ? '#6366f1' : 'rgba(255,255,255,0.2)'
                                }} />
                            ))}
                        </div>
                        <h2 style={{ fontSize: '2rem' }}>{help.title}</h2>
                    </div>

                    {step === 5 ? (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Setup Complete!</h3>
                            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                                <strong>{formData.orgName}</strong> is ready to go.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    background: '#10b981',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                Go to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid #ef4444',
                                    color: '#fca5a5',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                {/* STEP 1: ORG NAME */}
                                {step === 1 && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Organization Name</label>
                                        <input type="text" name="orgName" placeholder="Acme Corp" value={formData.orgName} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                        />
                                    </div>
                                )}

                                {/* STEP 2: ADMIN */}
                                {step === 2 && (
                                    <>
                                        <input type="text" name="adminUsername" placeholder="Admin Username" value={formData.adminUsername} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                        <input type="email" name="adminEmail" placeholder="admin@acme.com" value={formData.adminEmail} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                        <input type="password" name="adminPassword" placeholder="Secure Password" value={formData.adminPassword} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                    </>
                                )}

                                {/* STEP 3: FIRST DEPT */}
                                {step === 3 && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>First Department Name</label>
                                        <input type="text" name="deptName" placeholder="e.g. Engineering, Sales, HQ" value={formData.deptName} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                        />
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.5 }}>
                                            This will be your first Department. You will be the initial manager.
                                        </p>
                                    </div>
                                )}

                                {/* STEP 4: REVIEW */}
                                {step === 4 && (
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <p><strong>Organization:</strong> {formData.orgName}</p>
                                        <p><strong>Admin:</strong> {formData.adminEmail}</p>
                                        <p><strong>First Department:</strong> {formData.deptName}</p>
                                    </div>
                                )}

                                {/* CONTROLS */}
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    {step > 1 && (
                                        <button type="button" onClick={() => setStep(step - 1)}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
                                        >
                                            Back
                                        </button>
                                    )}

                                    {step < 4 ? (
                                        <button type="button" onClick={handleNext}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '8px', background: '#6366f1', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            Next
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={loading}
                                            style={{ flex: 1, padding: '1rem', borderRadius: '8px', background: '#10b981', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                        >
                                            {loading ? 'Creating...' : 'Complete Setup'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* RIGHT: INFO PANEL */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#6366f1', marginBottom: '1rem' }}>Did You Know?</h3>
                    <p style={{ lineHeight: '1.6', opacity: 0.8, fontSize: '1rem' }}>
                        {help.text}
                    </p>
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#818cf8' }}>Context</strong>
                        Step {step} of 4
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterOrg;
