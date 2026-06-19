/**
 * Global toast helpers — wraps react-hot-toast with consistent messages
 */
import toast from 'react-hot-toast';

export const toastSuccess = (message: string) => toast.success(message);
export const toastError = (message: string) => toast.error(message);
export const toastCopied = () => toast.success('Copied to clipboard');
