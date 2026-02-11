import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const OnboardingTour = () => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);
    const [cardPosition, setCardPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

    const allSteps = [
        {
            title: "Welcome! 👋",
            message: `Welcome to TinyPM, ${user.username}! This quick tour will show you how to use the system.`,
            target: "body",
            position: "center"
        },
        {
            title: "Your Department",
            message: "This is the name of your department. All your projects are gathered under this area.",
            target: "#tour-department",
            position: "bottom"
        },
        {
            title: "Project Management",
            message: "Manage your projects from here. You can instantly start new projects with the '+' button next to it.",
            target: "#tour-projects",
            position: "right"
        },
        {
            title: "Task Management",
            message: "Access all your tasks from here. You can add new tasks from anywhere with the '+' button.",
            target: "#tour-tasks",
            position: "right"
        },
        {
            title: "Your Team",
            message: "Use the 'Team' tab to manage your teammates and invite new members.",
            target: "#tour-team",
            position: "right"
        },
        {
            title: "You're Ready! 🚀",
            message: "Tour completed. Now you can enjoy the system!",
            target: "body",
            position: "center"
        }
    ];

    const steps = user.role === 'Member'
        ? allSteps.filter(s => s.target !== '#tour-team')
        : allSteps;

    const updatePosition = useCallback(() => {
        const step = steps[currentStep];
        if (step.target === "body" || step.position === "center") {
            setTargetRect(null);
            setCardPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
            return;
        }

        const element = document.querySelector(step.target);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);

            const gap = 20;
            let top, left, transform;

            switch (step.position) {
                case "bottom":
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2;
                    transform = "translateX(-50%)";
                    break;
                case "right":
                    top = rect.top + rect.height / 2;
                    left = rect.right + gap;
                    transform = "translateY(-50%)";
                    break;
                default:
                    top = rect.top + rect.height / 2;
                    left = rect.left + rect.width / 2;
                    transform = "translate(-50%, -50%)";
            }

            setCardPosition({ top, left, transform });
        }
    }, [currentStep]);

    useEffect(() => {
        const hasCompletedTour = localStorage.getItem(`onboarding_completed_${user.id}`);
        if (!hasCompletedTour) {
            setIsVisible(true);
        }
    }, [user.id]);

    useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [isVisible, currentStep, updatePosition]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const step = steps[currentStep];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            {/* Spotlight Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.7)',
                pointerEvents: 'auto',
                clipPath: targetRect ?
                    `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
                    : 'none'
            }} />

            {/* Tour Info Card */}
            <div className="glass-card" style={{
                position: 'absolute',
                width: '320px',
                padding: '1.5rem',
                pointerEvents: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid var(--accent-primary)',
                animation: 'fadeInScale 0.3s ease-out',
                ...cardPosition,
                zIndex: 10000
            }}>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                    {step.title}
                </div>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.4', opacity: 0.9 }}>
                    {step.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                            {currentStep + 1} / {steps.length}
                        </span>
                        <button
                            onClick={handleComplete}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0
                            }}
                        >
                            Close
                        </button>
                    </div>
                    <button
                        onClick={handleNext}
                        className="btn-add"
                        style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                        {currentStep === steps.length - 1 ? 'Start' : 'Next'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: ${cardPosition.transform} scale(0.9); }
                    to { opacity: 1; transform: ${cardPosition.transform} scale(1); }
                }
            `}</style>
        </div>
    );
};

export default OnboardingTour;
