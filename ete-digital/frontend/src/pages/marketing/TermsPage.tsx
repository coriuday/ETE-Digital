import React from 'react';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-12 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">Terms of Service</h1>
            <div className="prose prose-invert border border-white/10 rounded-xl p-8 bg-slate-900/50 backdrop-blur-sm">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h2 className="text-2xl mt-6 mb-4">1. Acceptance of Terms</h2>
                <p>By accessing and using ETE Digital, you agree to be bound by these Terms of Service.</p>
            </div>
        </div>
    );
};

export default TermsPage;
