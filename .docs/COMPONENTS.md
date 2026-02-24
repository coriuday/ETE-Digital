# UI Component Library - Usage Guide

## 🎨 Components Available

### UI Components

#### Button

```tsx
import Button from './components/ui/Button';

// Primary button
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

// With loading state
<Button variant="primary" loading={isLoading}>
  Submit
</Button>

// With icon
<Button 
  variant="secondary" 
  icon={<SearchIcon />}
  iconPosition="left"
>
  Search
</Button>

// As link
<Button as="link" to="/dashboard">
  Go to Dashboard
</Button>
```

#### Modal

```tsx
import Modal from './components/ui/Modal';

<Modal 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to proceed?</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={handleConfirm}>Confirm</Button>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
  </div>
</Modal>
```

#### Toast

```tsx
import { ToastProvider, useToast } from './components/ui/Toast';

// Wrap app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>

// Use in components
const { addToast } = useToast();

addToast('success', 'Job created successfully!');
addToast('error', 'Failed to save changes', 5000);
```

#### Card

```tsx
import { Card, CardHeader, CardBody, CardFooter } from './components/ui/Card';

<Card hover>
  <CardHeader>
    <h3>Job Title</h3>
  </CardHeader>
  <CardBody>
    <p>Job description...</p>
  </CardBody>
  <CardFooter>
    <Button>Apply Now</Button>
  </CardFooter>
</Card>
```

#### Badge

```tsx
import Badge from './components/ui/Badge';

<Badge variant="success">Active</Badge>
<Badge variant="warning" size="sm">Pending</Badge>
<Badge variant="error">Rejected</Badge>
```

---

### Form Components

#### Input

```tsx
import Input from './components/forms/Input';

<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  leftIcon={<MailIcon />}
/>
```

#### Select

```tsx
import Select from './components/forms/Select';

<Select
  label="Job Type"
  options={[
    { value: '', label: 'Select...' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
  ]}
  error={errors.jobType}
/>
```

#### Textarea

```tsx
import Textarea from './components/forms/Textarea';

<Textarea
  label="Description"
  rows={4}
  maxLength={500}
  showCharCount
  error={errors.description}
/>
```

---

### Animations

#### Page Transitions

```tsx
import AnimatedPage from './components/AnimatedPage';

export default function MyPage() {
  return (
    <AnimatedPage>
      <h1>Page Content</h1>
    </AnimatedPage>
  );
}
```

#### Custom Animations

```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideInFromLeft, cardHover } from './utils/animations';

<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeIn}
>
  Content
</motion.div>

<motion.div whileHover={cardHover}>
  Hover me
</motion.div>
```

---

### Loading States

#### Skeletons

```tsx
import { SkeletonCard, SkeletonText, SkeletonTable } from './components/ui/Skeleton';

{loading ? (
  <>
    <SkeletonCard />
    <SkeletonCard />
  </>
) : (
  <JobList jobs={jobs} />
)}
```

---

## 🎯 Integration Steps

1. **Wrap App with Providers**:

```tsx
// App.tsx
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

1. **Use in Pages**:
Replace existing HTML elements with components for consistency.

2. **Customize**:
All components accept `className` prop for additional styling.

---

## 📦 Components Created

- ✅ `Button.tsx` - Multi-variant button
- ✅ `Modal.tsx` - Accessible modal dialog
- ✅ `Toast.tsx` - Notification system
- ✅ `Card.tsx` - Reusable card
- ✅ `Badge.tsx` - Status badges
- ✅ `Input.tsx` - Form input
- ✅ `Select.tsx` - Dropdown select
- ✅ `Textarea.tsx` - Text area
- ✅ `Skeleton.tsx` - Loading skeletons
- ✅ `AnimatedPage.tsx` - Page wrapper
- ✅ `animations.ts` - Animation variants

**Total**: 11 reusable components + animation library
