/**
 * Copyright Page — Jobsrow
 * Inspired by Freshersworld copyright page style
 * Route: /copyright
 */
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, BookOpen, Copyright as CopyrightIcon } from 'lucide-react';

export default function CopyrightPage() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Page Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                            <CopyrightIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-violet-600 dark:text-violet-400">Copyright</h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: January 1, {currentYear}
                    </p>
                </div>

                {/* Content Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 space-y-8">

                    {/* Section 1 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="w-4 h-4 text-violet-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Terms of Use</h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            These materials are provided by Jobsrow ("JR") as a service to its readers and may be used for information purposes only.
                            JR assumes no responsibility for errors or omissions in these materials. JR makes no commitment to update the information
                            contained herein. JR makes no, and expressly disclaims any, representations or warranties, express or implied, regarding
                            the JR Worldwide Web site, including without limitation the accuracy, completeness or reliability of text, graphics, links,
                            and other items accessed from or via this server or the Internet. No advice or information given by JR, its affiliates or
                            their respective employees, agents or independent contractors shall create any warranty.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Disclaimer</h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            In addition, JR cannot control and cannot edit content provided by a third party prior to transmission on the JR web site,
                            nor can JR ensure prompt removal of inappropriate or unlawful content after transmission. Third party postings are not
                            reviewed for truth or accuracy and do not represent the opinion, beliefs, or statements of JR. Job listings and employer
                            information are provided in good faith; however, Jobsrow cannot guarantee their accuracy or completeness.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-red-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Limitation of Liability</h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Under no circumstances shall JR or any of its affiliates, respective partners, officers, directors, employees, subsidiaries,
                            agents, or parents be held liable for any damages, whether incidental, indirect, special or consequential damages and
                            including without limitation, lost revenues or lost profits arising from or in connection with the use or performance of
                            the information on this server or the Internet generally.
                        </p>
                    </section>

                    {/* Section 4 — Copyright Notice */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <CopyrightIcon className="w-4 h-4 text-indigo-500" />
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Copyright Notice</h2>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            JR retains the copyright in all of the material on these web pages as a collective work under copyright laws. You may not
                            copy, republish, redistribute or exploit in any manner any material from these pages without the express written consent
                            of JR. Contact JR for more details. You may, however, download copyrighted material for your individual and
                            non-commercial use only.
                        </p>
                    </section>

                    {/* Section 5 — Trademarks */}
                    <section>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            The Jobsrow name and logo and all related product and service names, design marks and slogans are the trade names,
                            service marks, or trademarks of JR, and may not be used without the prior written consent of JR.
                        </p>
                    </section>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6 space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            All rights reserved © {currentYear} Jobsrow
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Any rights not expressly granted herein are reserved.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            <Link
                                to="/contact"
                                className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                            >
                                Contact Jobsrow
                            </Link>{' '}
                            with questions or problems, as appropriate.
                        </p>
                    </div>
                </div>

                {/* Quick Policy Links */}
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                    {[
                        { label: 'Privacy Policy', href: '/privacy-policy' },
                        { label: 'Terms of Service', href: '/terms' },
                        { label: 'Cookie Policy', href: '/cookies' },
                        { label: 'Accessibility', href: '/about' },
                    ].map(link => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
