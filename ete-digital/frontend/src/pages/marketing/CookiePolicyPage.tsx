

const CookiePolicyPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-12 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">Cookie Policy</h1>
            <div className="prose prose-invert border border-white/10 rounded-xl p-8 bg-slate-900/50 backdrop-blur-sm">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h2 className="text-2xl mt-6 mb-4">1. How We Use Cookies</h2>
                <p>We use essential cookies to maintain your session and security on Jobsrow.</p>
            </div>
        </div>
    );
};

export default CookiePolicyPage;
