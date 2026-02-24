/**
 * Animated Page Wrapper
 * Wrap pages with this component for consistent animations
 */
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/animations';

export interface AnimatedPageProps {
    children: React.ReactNode;
    className?: string;
}

export default function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
}
