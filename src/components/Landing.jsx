import React from 'react';
import {
    FaCamera,
    FaMapMarkerAlt,
    FaClock,
    FaClipboardCheck,
    FaUsers,
    FaChartLine,
    FaFileAlt,
    FaUserShield,
    FaCheckCircle,
    FaMoneyBillWave
} from 'react-icons/fa';
import './Landing.css';

const whatsappHref = 'https://wa.me/918600574836?text=Hi%20I%27m%20interested%20in%20the%20attendance%20software.';

const featureList = [
    {
        title: 'Selfie Verified Punch',
        description: 'Capture a selfie on punch in and out so every entry has visual proof.',
        icon: FaCamera
    },
    {
        title: 'Geo-Fenced Attendance',
        description: 'Only allow attendance inside approved locations with radius control.',
        icon: FaMapMarkerAlt
    },
    {
        title: 'Shift Rules + Weekly Offs',
        description: 'Define shift rules, minimum hours, and paid weekly offs by team.',
        icon: FaClock
    },
    {
        title: 'Miss Punch Workflow',
        description: 'Employees request corrections and admins approve with one click.',
        icon: FaClipboardCheck
    },
    {
        title: 'Staff Management',
        description: 'Create staff logins, assign roles, and manage profiles in minutes.',
        icon: FaUsers
    },
    {
        title: 'Attendance Insights',
        description: 'Track present, absent, late, and short days with clear summaries.',
        icon: FaChartLine
    },
    {
        title: 'Monthly Reports + CSV',
        description: 'Export detailed reports by month and employee for easy sharing.',
        icon: FaFileAlt
    },
    {
        title: 'Salary Summaries',
        description: 'Turn attendance hours into payroll-ready salary breakdowns in minutes.',
        icon: FaMoneyBillWave
    },
    {
        title: 'Role-Based Access',
        description: 'Separate admin and staff portals to keep data safe and focused.',
        icon: FaUserShield
    }
];

const steps = [
    {
        title: 'Set locations and shifts',
        description: 'Create named locations, assign radiuses, and define shift rules.'
    },
    {
        title: 'Employees punch with proof',
        description: 'Staff capture selfie and location before every punch.'
    },
    {
        title: 'Review and export',
        description: 'Approve corrections, view dashboards, and download reports.'
    }
];

const Landing = () => {
    return (
        <div className="landing-page">
            <div className="landing-orb landing-orb-one" />
            <div className="landing-orb landing-orb-two" />
            <div className="landing-orb landing-orb-three" />

            <header className="landing-nav">
                <div className="landing-brand">
                    <div className="landing-mark" />
                    <div>
                        <div className="landing-logo">Attendify</div>
                        <div className="landing-subtitle">Attendance that proves presence.</div>
                    </div>
                </div>
                <div className="landing-nav-actions">
                    <a href="#features" className="landing-link">Features</a>
                    <a href="#how-it-works" className="landing-link">How it works</a>
                    <a href={whatsappHref} className="landing-button primary">WhatsApp 8600574836</a>
                </div>
            </header>

            <main className="landing-content">
                <section className="landing-hero">
                    <div className="landing-hero-copy">
                        <div className="landing-pill">
                            <FaCheckCircle /> Verified attendance, zero guesswork
                        </div>
                        <h1 className="landing-title">
                            Make attendance precise, trusted, and effortless.
                        </h1>
                        <p className="landing-lede">
                            Attendify combines selfie proof, geo-fencing, and smart shift rules
                            so every punch is authentic, every report is clear, and every team
                            stays aligned.
                        </p>
                        <div className="landing-cta">
                            <a href={whatsappHref} className="landing-button primary">
                                WhatsApp 8600574836
                            </a>
                            <a href={whatsappHref} className="landing-button ghost">
                                Attendance software demo
                            </a>
                        </div>
                        <div className="landing-meta">
                            One tap punch | Location lock | Miss punch approvals
                        </div>
                        <div className="landing-meta">
                            For more customization, contact us on WhatsApp.
                        </div>
                    </div>
                    <div className="landing-hero-card">
                        <div className="hero-card-header">
                            <span>Today</span>
                            <strong>Operations Snapshot</strong>
                        </div>
                        <div className="hero-kpi-grid">
                            <div>
                                <div className="hero-kpi-value">98%</div>
                                <div className="hero-kpi-label">Verified punches</div>
                            </div>
                            <div>
                                <div className="hero-kpi-value">4m</div>
                                <div className="hero-kpi-label">Avg check-in time</div>
                            </div>
                            <div>
                                <div className="hero-kpi-value">12</div>
                                <div className="hero-kpi-label">Open requests</div>
                            </div>
                            <div>
                                <div className="hero-kpi-value">3</div>
                                <div className="hero-kpi-label">Locations active</div>
                            </div>
                        </div>
                        <div className="hero-activity">
                            <div className="hero-activity-item">
                                <div className="hero-dot" />
                                <div>
                                    <div className="hero-activity-title">Selfie + geo validated</div>
                                    <div className="hero-activity-meta">Punch in at 09:08</div>
                                </div>
                            </div>
                            <div className="hero-activity-item">
                                <div className="hero-dot amber" />
                                <div>
                                    <div className="hero-activity-title">Miss punch request</div>
                                    <div className="hero-activity-meta">Pending approval</div>
                                </div>
                            </div>
                            <div className="hero-activity-item">
                                <div className="hero-dot teal" />
                                <div>
                                    <div className="hero-activity-title">Report ready</div>
                                    <div className="hero-activity-meta">Monthly CSV generated</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="landing-section">
                    <div className="landing-section-title">
                        <h2>Everything your attendance workflow needs.</h2>
                        <p>Built for teams that want clarity, accountability, and speed.</p>
                    </div>
                    <div className="landing-feature-grid">
                        {featureList.map((feature) => (
                            <div key={feature.title} className="landing-feature-card">
                                <div className="landing-feature-icon">
                                    <feature.icon />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className="landing-section split">
                    <div>
                        <div className="landing-section-title compact">
                            <h2>Three steps from setup to steady attendance.</h2>
                            <p>Launch fast, stay consistent, and measure outcomes.</p>
                        </div>
                        <div className="landing-steps">
                            {steps.map((step, index) => (
                                <div key={step.title} className="landing-step">
                                    <div className="landing-step-number">0{index + 1}</div>
                                    <div>
                                        <h4>{step.title}</h4>
                                        <p>{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="landing-side-panel">
                        <h3>Trusted by admins, loved by staff.</h3>
                        <p>
                            A clean employee portal keeps punching simple, while admins get
                            instant dashboards, flexible approvals, and compliant records.
                        </p>
                        <div className="landing-side-tags">
                            <span>Employee portal</span>
                            <span>Admin dashboard</span>
                            <span>Location profiles</span>
                            <span>CSV exports</span>
                            <span>Holiday rules</span>
                            <span>Payroll ready</span>
                        </div>
                    </div>
                </section>

                <section className="landing-section callout">
                    <div>
                        <h2>Precision without complexity.</h2>
                        <p>
                            Reduce disputes, improve attendance discipline, and stay audit-ready
                            with built-in selfie and location evidence.
                        </p>
                    </div>
                    <a href={whatsappHref} className="landing-button primary">
                        WhatsApp 8600574836 - Attendance software
                    </a>
                </section>
            </main>
        </div>
    );
};

export default Landing;
