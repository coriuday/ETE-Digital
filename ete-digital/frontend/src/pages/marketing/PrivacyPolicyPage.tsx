

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-12 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">Privacy Policy</h1>
            <div className="prose prose-invert border border-white/10 rounded-xl p-8 bg-slate-900/50 backdrop-blur-sm">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h2 className="text-2xl mt-6 mb-4">1. Information We Collect</h2>
                <p>We collect information you provide directly to us when you create an account, update your profile, take tryouts, or apply for jobs.</p>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
