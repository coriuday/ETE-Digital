# ETE Digital - Testing Checklist

## 🧪 Manual Testing Guide

This checklist ensures all features are working correctly before deployment.

---

## ✅ Environment Setup

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] PostgreSQL connected
- [ ] Redis connected
- [ ] MinIO connected
- [ ] API docs accessible at `/docs`

---

## 👤 Authentication & User Management

### Registration

- [ ] **Candidate Registration**
  - [ ] Can register with valid email
  - [ ] Password validation works
  - [ ] Role is set to "candidate"
  - [ ] Redirects to login after registration
  - [ ] Error messages for invalid input
  - [ ] Duplicate email shows error

- [ ] **Employer Registration**
  - [ ] Can register as employer
  - [ ] Role is set to "employer"
  - [ ] All validation works

### Login

- [ ] **Successful Login**
  - [ ] Can login with correct credentials
  - [ ] Token is stored
  - [ ] Redirects to dashboard
  - [ ] User info displayed correctly

- [ ] **Failed Login**
  - [ ] Wrong password shows error
  - [ ] Non-existent email shows error
  - [ ] Error messages are clear

### Protected Routes

- [ ] Unauthenticated users redirected to login
- [ ] Candidates can't access employer features
- [ ] Employers can't access candidate features
- [ ] Token refresh works on expiration

### Logout

- [ ] Logout clears session
- [ ] Redirects to login
- [ ] Can't access protected routes after logout

---

## 💼 Job Search & Applications (Public + Candidate)

### Job Search (Public)

- [ ] **Browse Jobs**
  - [ ] Job cards display correctly
  - [ ] Pagination works
  - [ ] Can view without login

- [ ] **Filters**
  - [ ] Location filter works
  - [ ] Job type filter works
  - [ ] Salary range filter works
  - [ ] Experience level filter works
  - [ ] Search query works
  - [ ] Filters can be combined
  - [ ] Clear filters works

### Job Details (Public)

- [ ] Job details page loads
- [ ] All job info displayed
- [ ] Company info shown
- [ ] Requirements visible
- [ ] Salary & benefits shown
- [ ] "Apply" button prompts login if not authenticated

### Job Application (Candidate Only)

- [ ] **Application Form**
  - [ ] Form loads when authenticated
  - [ ] All fields required
  - [ ] Resume field accepts input
  - [ ] Cover letter field works
  - [ ] Validation works
  - [ ] Submission successful
  - [ ] Success message shown
  - [ ] Can't apply twice to same job

---

## 🎯 Tryouts (Candidate)

### Tryout Details

- [ ] **View Tryout**
  - [ ] Tryout linked from job details
  - [ ] Task description shown
  - [ ] Scoring rubric displayed
  - [ ] Payment amount visible
  - [ ] Duration shown
  - [ ] Submission limits shown

### Tryout Submission

- [ ] **URL Submission**
  - [ ] URL field validates
  - [ ] Can submit GitHub link
  - [ ] Submission confirmed

- [ ] **Code Submission**
  - [ ] Code editor visible
  - [ ] Can paste code
  - [ ] Formatting preserved
  - [ ] Submission works

- [ ] **Text Submission**
  - [ ] Text area works
  - [ ] Can write long text
  - [ ] Submission successful

- [ ] **Additional Notes**
  - [ ] Notes field optional
  - [ ] Notes saved with submission

### My Tryouts

- [ ] **Submissions List**
  - [ ] All submissions displayed
  - [ ] Status badges correct
  - [ ] Payment status shown
  - [ ] Scores displayed (if graded)
  - [ ] Feedback shown (if available)
  - [ ] Empty state if no submissions

---

## 🏆 Talent Vault (Candidate)

### Vault Dashboard

- [ ] **Statistics**
  - [ ] Total items count
  - [ ] Verified items count
  - [ ] Total shares count
  - [ ] Total views count

- [ ] **Item Grid**
  - [ ] Items display as cards
  - [ ] Type badges shown
  - [ ] Verified indicator for verified items
  - [ ] Tech stack tags displayed
  - [ ] View/share counts visible
  - [ ] Empty state if no items

### Add/Edit Items

- [ ] **Create Item**
  - [ ] Type selection works
  - [ ] All fields validate
  - [ ] File URL saved
  - [ ] Tech stack saves (comma-separated)
  - [ ] Live URL optional
  - [ ] Success message shown
  - [ ] Redirects to vault

- [ ] **Edit Item**
  - [ ] Form pre-filled with data
  - [ ] Changes save correctly
  - [ ] Updated item reflects changes

- [ ] **Delete Item**
  - [ ] Confirmation dialog appears
  - [ ] Item deleted successfully
  - [ ] Removed from grid

### Share Management

- [ ] **Create Share Token**
  - [ ] Can select multiple items
  - [ ] Company field optional
  - [ ] Email field optional
  - [ ] Expiration options work
  - [ ] Max views optional
  - [ ] Token created successfully
  - [ ] Share link generated

- [ ] **Manage Tokens**
  - [ ] All tokens listed
  - [ ] Active status shown
  - [ ] Expiration date visible
  - [ ] View count displayed
  - [ ] Copy link works
  - [ ] Revoke token works

### Public Shared Vault

- [ ] **View Shared Items** (No Auth Required)
  - [ ] Access via share token works
  - [ ] Candidate name displayed
  - [ ] Company name shown (if set)
  - [ ] All items visible
  - [ ] Type badges shown
  - [ ] Verified badges displayed
  - [ ] Tech stack visible
  - [ ] Project links work
  - [ ] Live demo links work
  - [ ] Beautiful gradient background
  - [ ] Error for invalid/expired tokens

---

## 📊 Dashboards

### Candidate Dashboard

- [ ] **Statistics Cards**
  - [ ] Applications count
  - [ ] Tryouts count
  - [ ] Vault items count
  - [ ] Verified items count

- [ ] **Quick Actions**
  - [ ] Browse Jobs link works
  - [ ] Manage Vault link works
  - [ ] My Tryouts link works

- [ ] **Recent Activity**
  - [ ] Recent applications shown
  - [ ] Application status correct
  - [ ] Recent tryouts shown
  - [ ] Scores displayed
  - [ ] Empty state if no activity

### Employer Dashboard

- [ ] Quick action cards displayed
- [ ] Coming soon message shown
- [ ] Logout works

---

## 🔒 Security

- [ ] **Password Security**
  - [ ] Passwords not visible in requests
  - [ ] Strong password required
  - [ ] Argon2 hashing (backend)

- [ ] **Token Security**
  - [ ] JWT in HTTP-only cookies (backend)
  - [ ] Token refresh works
  - [ ] Expired tokens rejected

- [ ] **API Security**
  - [ ] Protected endpoints reject unauth requests
  - [ ] RBAC works correctly
  - [ ] CORS configured properly

- [ ] **Data Security**
  - [ ] Vault URLs encrypted (backend)
  - [ ] Sensitive data not in logs
  - [ ] No PII in URLs

---

## 📱 Responsive Design

- [ ] **Desktop (1920x1080)**
  - [ ] All pages render correctly
  - [ ] No horizontal scroll
  - [ ] Navigation works

- [ ] **Tablet (768x1024)**
  - [ ] Grid layouts adjust
  - [ ] Filters accessible
  - [ ] Forms usable

- [ ] **Mobile (375x667)**
  - [ ] Cards stack vertically
  - [ ] Buttons accessible
  - [ ] Forms fill screen
  - [ ] Navigation works

---

## ⚡ Performance

- [ ] Page load < 2 seconds
- [ ] API responses < 500ms (local)
- [ ] No console errors
- [ ] No console warnings
- [ ] Images load quickly (if any)

---

## 🐛 Error Handling

- [ ] **Network Errors**
  - [ ] Graceful error messages
  - [ ] Retry mechanisms work

- [ ] **Validation Errors**
  - [ ] Clear error messages
  - [ ] Field-level errors shown

- [ ] **404 Errors**
  - [ ] Custom 404 page
  - [ ] Link back to home

- [ ] **Server Errors**
  - [ ] 500 errors handled
  - [ ] User-friendly message

---

## 🌐 Cross-Browser Testing

- [ ] **Chrome** - All features work
- [ ] **Firefox** - All features work
- [ ] **Safari** - All features work
- [ ] **Edge** - All features work

---

## ✨ User Experience

- [ ] **Loading States**
  - [ ] Spinners during API calls
  - [ ] Skeleton screens where appropriate
  - [ ] Disabled buttons during submission

- [ ] **Success Feedback**
  - [ ] Success messages on create/update/delete
  - [ ] Redirects make sense
  - [ ] Toasts/alerts visible

- [ ] **Empty States**
  - [ ] Clear messaging
  - [ ] Call-to-action buttons
  - [ ] Helpful instructions

---

## 📝 Notes

**Test Environment:**

- Date tested: _________________
- Tester: _____________________
- Browser: ____________________
- OS: _________________________

**Issues Found:**
1.
2.
3.

**Critical Bugs:**
-

**Nice-to-Have Improvements:**
-

---

## ✅ Sign-Off

- [ ] All critical features tested
- [ ] No critical bugs
- [ ] Ready for deployment

**Approved by:** _________________  
**Date:** _______________________
