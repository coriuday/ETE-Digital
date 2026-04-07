/**
 * Register Page
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

// Password validation helper
const validatePasswordStrength = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;

    return {
        hasUppercase,
        hasLowercase,
        hasDigit,
        hasSpecial,
        hasMinLength,
        isValid: hasUppercase && hasLowercase && hasDigit && hasSpecial && hasMinLength,
    };
};

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, error, isLoading, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        role: 'candidate' as 'candidate' | 'employer',
    });

    const [localError, setLocalError] = useState('');
    const [showPasswordHints, setShowPasswordHints] = useState(false);

    const passwordStrength = validatePasswordStrength(formData.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (!passwordStrength.isValid) {
            setLocalError('Password does not meet security requirements');
            return;
        }

        try {
            await register(formData.email, formData.password, formData.fullName, formData.role);
            navigate('/login', {
                state: { message: 'Registration successful! Please check your email to verify your account.' }
            });
        } catch (error) {
            // Error is handled by store
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Jobsrow</h1>
                    <p className="text-primary-200">Join the future of hiring</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

                    {displayError && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{displayError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                placeholder="John Doe" />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                placeholder="you@example.com" />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white">
                                <option value="candidate">Job Seeker / Candidate</option>
                                <option value="employer">Employer / Recruiter</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange}
                                onFocus={() => setShowPasswordHints(true)} required minLength={8}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                placeholder="••••••••" />
                            {(showPasswordHints || formData.password) && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Password must contain:</p>
                                    <ul className="space-y-1">
                                        {[
                                            { check: passwordStrength.hasMinLength, label: 'At least 8 characters' },
                                            { check: passwordStrength.hasUppercase, label: 'One uppercase letter (A-Z)' },
                                            { check: passwordStrength.hasLowercase, label: 'One lowercase letter (a-z)' },
                                            { check: passwordStrength.hasDigit, label: 'One number (0-9)' },
                                            { check: passwordStrength.hasSpecial, label: 'One special character (!@#$%^&*)' },
                                        ].map(({ check, label }) => (
                                            <li key={label} className={`text-xs flex items-center ${check ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span className="mr-2">{check ? '✓' : '○'}</span>{label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                            <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">or</span></div>
                    </div>

                    <p className="text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">Sign in</Link>
                    </p>
                </div>

                <p className="text-center text-sm text-primary-200 mt-6">
                    By signing up, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
}
