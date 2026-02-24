# 🧪 Testing Guide for Phase 5 Features

## Pre-Testing Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:

- `framer-motion` - Animation library
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `recharts` - Charts for analytics (future)

### 2. Start Development Server

```bash
npm run dev
```

Frontend should run on `http://localhost:5173`

### 3. Ensure Backend is Running

```bash
cd ../infra/docker
docker-compose up -d
```

Backend should be on `http://localhost:8000`

---

## 🎯 Test Scenarios

### Scenario 1: Employer Registration & Dashboard

**Steps:**

1. Navigate to `http://localhost:5173/register`
2. Fill in registration form:
   - Email: `employer@test.com`
   - Password: `Test123!@#`
   - Full Name: `Test Employer`
   - Role: Select **Employer**
3. Click "Register"
4. You should be redirected to login (or dashboard if auto-login)
5. Login if needed
6. **Verify Dashboard Shows:**
   - Statistics cards (0 for new employer)
   - Quick action buttons
   - "Getting Started" prompt

**Expected Result**: ✅ Dashboard loads with empty state

---

### Scenario 2: Create Job Posting

**Steps:**

1. From employer dashboard, click "Post a Job" or navigate to `/employer/jobs/create`
2. Fill in job details:
   - **Title**: Senior React Developer
   - **Company**: TechCorp
   - **Type**: Full Time
   - **Location**: San Francisco, CA
   - Check "Remote work allowed"
   - **Description**: "We're looking for an experienced React developer..."
   - **Requirements**: "5+ years React, TypeScript, TailwindCSS..."
   - **Skills**: React, TypeScript, TailwindCSS
   - **Experience**: 5+ years
   - **Min Salary**: 120000
   - **Max Salary**: 180000
   - **Currency**: USD
3. Click "Post Job"

**Expected Result**: ✅ Job created, redirected to `/employer/jobs` with job listed

---

### Scenario 3: Job Management

**Steps:**

1. Navigate to `/employer/jobs`
2. **Verify:**
   - Your created job is listed
   - Status shows "active" (green badge)
   - View counts, application counts shown
   - Filter buttons work (all, active, draft, closed)
3. Click "Edit" on a job
4. Make achange (e.g., update salary)
5. **Try Delete:**
   - Click "Delete"
   - Confirm in dialog
   - Job removed from list

**Expected Result**: ✅ All CRUD operations work

---

### Scenario 4: Theme Toggle

**Steps:**

1. Open browser console
2. Execute:

   ```javascript
   localStorage.setItem('ete_theme', 'dark');
   window.location.reload();
   ```

3. **Verify:** Page loads in dark mode
4. Execute:

   ```javascript
   localStorage.setItem('ete_theme', 'light');
   window.location.reload();
   ```

5. **Verify:** Page loads in light mode

**Expected Result**: ✅ Theme toggles correctly

**Future**: Add theme toggle button to header

---

### Scenario 5: Analytics Tracking

**Steps:**

1. Open browser console
2. Import analytics:

   ```javascript
   // Navigate to a few pages first
   // Then check analytics
   ```

3. Check localStorage:

   ```javascript
   JSON.parse(localStorage.getItem('ete_analytics'))
   ```

4. **Verify:** Events are being tracked

**Expected Result**: ✅ Page views and actions logged

---

### Scenario 6: Error Boundary

**Steps:**

1. Temporarily introduce error in a component:

   ```tsx
   // In any page component
   throw new Error('Test error');
   ```

2. Navigate to that page
3. **Verify:**
   - Error boundary catches error
   - User-friendly message shown
   - "Go to Homepage" button works

**Expected Result**: ✅ Error caught, fallback UI displayed

---

## 🔍 Manual Inspection Checklist

### Employer Dashboard

- [ ] Statistics cards render correctly
- [ ] Quick actions are clickable
- [ ] Recent jobs list shows (if jobs exist)
- [ ] "Getting Started" shows for new employers
- [ ] Logout works
- [ ] Navigation links work

### Jobs List Page

- [ ] Jobs display in cards
- [ ] Filters work (all, active, draft, closed)
- [ ] Job count updates based on filter
- [ ] Edit/Delete/View Applications buttons present
- [ ] Empty state shows when no jobs
- [ ] "Post New Job" button works

### Create Job Form

- [ ] All fields render
- [ ] Form validation works (try submitting empty)
- [ ] Dropdown menus work
- [ ] Checkboxes toggle
- [ ] Submit creates job
- [ ] Cancel button navigates back

### Responsiveness

- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1920px)
- [ ] All layouts adjust properly
- [ ] No horizontal scrolling

---

## 🐛 Known Issues & Notes

### Linting Errors

**Status**: Expected during npm install  
**Fix**: Will resolve once dependencies are installed

The current lint errors are due to missing React/TypeScript dependencies that are being installed.

### Missing Features (Planned)

- [ ] Application review interface
- [ ] Tryout creation page
- [ ] Tryout grading interface
- [ ] Analytics dashboard with charts
- [ ] Animations (framer-motion)

---

## ✅ Acceptance Criteria

### Must Pass

1. ✅ Employer can register and login
2. ✅ Employer dashboard loads with statistics
3. ✅ Employer can create job posting
4. ✅ Employer can view list of jobs
5. ✅ Employer can filter jobs
6. ✅ Employer can delete jobs
7. ✅ Theme system works (light/dark)
8. ✅ Error boundary catches errors
9. ✅ Analytics tracking works
10. ✅ All pages are responsive

### Nice to Have

- Theme toggle in UI (currently manual via localStorage)
- Analytics dashboard visualization
- More granular permissions

---

## 🚀 Next Phase Testing

Once remaining features are built:

1. **Application Review**: Test employer reviewing applications
2. **Tryout Management**: Test creating and grading tryouts
3. **Analytics Dashboard**: Verify charts and statistics
4. **Animations**: Check smooth transitions
5. **Automated Tests**: Run unit and integration tests

---

**Ready to test!** Follow the scenarios above and report any issues. 🎉
