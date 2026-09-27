# MASTER PROMPT — GOVERNMENT DOCUMENT REQUEST & STATUS TRACKING SYSTEM

Build a complete, production-quality MERN stack web application called:

**"GovTrack — Government Document Request & Status Tracking System"**

The purpose of this application is to digitize the process of requesting government documents/certificates and tracking their processing status online.

The core problem:

Currently, citizens may submit requests for government documents/certificates and then have to physically visit the concerned office to know whether their request is pending, under verification, approved, rejected, or ready for collection.

This application should allow:

1. Citizens to register/login.
2. Citizens to submit document requests online.
3. Admin/government officers to view submitted requests.
4. Admins to verify and process requests.
5. Admins to update request status at every stage.
6. Citizens to see the latest status online.
7. Citizens to see the complete status timeline/history.
8. Citizens to receive notifications when status changes.
9. Admins to manage document types.
10. Admins to manage users and requests.
11. Every status change should be recorded in an audit/status history.
12. The system should be designed so that real government APIs/databases can be integrated later.

Do NOT build this as a simple CRUD demo.

Build it like a real-world government service portal with proper authentication, authorization, validation, security, database relationships, status workflow, notifications, dashboards, search, filtering, pagination, document uploads, audit logs, and responsive UI.

---

# 1. TECHNOLOGY STACK

## Frontend

Use:

* React
* Vite
* React Router DOM
* Axios
* Context API or Redux Toolkit for authentication/state where appropriate
* Bootstrap OR Tailwind CSS
* React Hook Form
* Zod/Yup for validation
* Recharts for dashboards
* Lucide React / React Icons
* Toast notifications
* Responsive design

Do not use unnecessary libraries.

Frontend should be clean, modern and professional.

---

# 2. BACKEND

Use:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* bcrypt/bcryptjs
* multer for document uploads
* express-validator or Zod/Joi for validation
* dotenv
* helmet
* cors
* express-rate-limit
* morgan or equivalent logging
* centralized error handling

Architecture:

backend/
src/
config/
controllers/
middleware/
models/
routes/
services/
utils/
validators/
uploads/
app.js
server.js

Keep responsibilities separated.

Do not put the entire application inside one or two files.

---

# 3. USER ROLES

The application must support role-based access control.

Roles:

### CITIZEN

Can:

* Register
* Login
* View profile
* Update profile
* Browse available document types
* Submit document request
* Upload required documents
* View own requests
* Track request status
* View complete status timeline
* Receive notifications
* Download available documents
* Cancel request if cancellation is allowed
* View request history

### ADMIN / GOVERNMENT OFFICER

Can:

* Login
* View admin dashboard
* View all requests
* Search requests
* Filter requests
* Sort requests
* View complete request details
* Verify submitted documents
* Update request status
* Add remarks
* Request additional documents
* Approve request
* Reject request
* Mark document as ready
* Upload final document
* View citizen details
* Manage document types
* Manage required documents
* Manage users
* View audit logs
* View statistics

Use RBAC middleware.

Example:

authorizeRoles("admin")

Do NOT rely only on frontend route protection.

Backend must independently verify roles.

---

# 4. AUTHENTICATION

Implement complete JWT authentication.

Registration:

POST /api/auth/register

Login:

POST /api/auth/login

Get current user:

GET /api/auth/me

Logout:

POST /api/auth/logout

Use:

* Password hashing
* JWT access token
* Refresh token if practical
* HTTP-only cookies for refresh token
* Secure cookie configuration
* Token expiration
* Authentication middleware

Never store plain-text passwords.

Never expose password hashes in API responses.

---

# 5. USER MODEL

Create User model.

Fields:

* firstName
* lastName
* email
* mobileNumber
* password
* role
* profilePhoto
* address
* city
* district
* state
* pincode
* isActive
* isVerified
* createdAt
* updatedAt

Role:

enum:

* citizen
* admin

Email must be unique.

Mobile number should be validated.

Password must satisfy minimum security requirements.

---

# 6. DOCUMENT TYPES

Create a DocumentType model.

Example document types:

* Birth Certificate
* Death Certificate
* Income Certificate
* Caste Certificate
* Residence Certificate
* Domicile Certificate
* Non-Creamy Layer Certificate
* EWS Certificate
* Senior Citizen Certificate
* Character Certificate
* Other government-issued certificates

Do NOT hardcode these into the frontend.

They must come from MongoDB.

DocumentType fields:

* name
* description
* department
* processingTime
* fee
* requiredDocuments
* isActive
* createdAt
* updatedAt

Admin should be able to create/update/deactivate document types.

---

# 7. REQUIRED DOCUMENTS

Create a RequiredDocument structure.

For each document type, admin should be able to define required documents.

Example:

For Income Certificate:

* Aadhaar Card
* Address Proof
* Income Proof
* Passport Size Photo

Each required document should contain:

* name
* description
* isRequired
* allowedFileTypes
* maxFileSize

Do not hardcode these requirements in React.

---

# 8. DOCUMENT REQUEST MODEL

Create Request model.

Suggested fields:

* requestNumber
* citizen
* documentType
* applicationData
* uploadedDocuments
* status
* currentDepartment
* assignedOfficer
* remarks
* rejectionReason
* submittedAt
* lastUpdatedAt
* completedAt
* expectedCompletionDate

requestNumber should be generated automatically.

Example:

GOV-2026-000001

Every request must have a unique request number.

---

# 9. REQUEST STATUS WORKFLOW

Implement a proper status workflow.

Statuses:

1. SUBMITTED
2. UNDER_REVIEW
3. DOCUMENT_VERIFICATION
4. ADDITIONAL_DOCUMENT_REQUIRED
5. PROCESSING
6. APPROVED
7. REJECTED
8. READY_FOR_DOWNLOAD
9. COMPLETED
10. CANCELLED

Do not allow arbitrary status transitions.

Example:

SUBMITTED
↓
UNDER_REVIEW
↓
DOCUMENT_VERIFICATION
↓
PROCESSING
↓
APPROVED
↓
READY_FOR_DOWNLOAD
↓
COMPLETED

If documents are missing:

DOCUMENT_VERIFICATION
↓
ADDITIONAL_DOCUMENT_REQUIRED
↓
DOCUMENT_VERIFICATION

If rejected:

Any appropriate processing stage
↓
REJECTED

Store every status transition.

---

# 10. STATUS HISTORY

This is one of the most important parts of the application.

Create RequestStatusHistory model.

Fields:

* request
* oldStatus
* newStatus
* changedBy
* changedByRole
* remarks
* timestamp

Example:

Application Submitted
27 Sep 2026, 10:30 AM

↓

Under Review
27 Sep 2026, 01:45 PM

↓

Document Verification
28 Sep 2026, 11:10 AM

↓

Processing
29 Sep 2026, 03:20 PM

↓

Approved
30 Sep 2026, 12:05 PM

The citizen must be able to see this timeline.

Every admin status update must automatically create a status history record.

Never update the current status without creating history.

---

# 11. ADMIN STATUS UPDATE

Admin should have a dedicated request processing screen.

Example:

Request:

GOV-2026-000123

Citizen:

Rahul Patel

Document:

Income Certificate

Current Status:

DOCUMENT VERIFICATION

Admin should see:

* Citizen details
* Application details
* Uploaded documents
* Previous status
* Status timeline
* Current status
* Remarks
* Assigned officer

Admin should have:

### Update Status

Dropdown:

* Under Review
* Document Verification
* Additional Document Required
* Processing
* Approved
* Rejected
* Ready for Download
* Completed

Add:

* Remarks
* Optional document upload

Submit Status Update.

Backend must:

1. Validate status transition.
2. Update Request.
3. Create RequestStatusHistory.
4. Create Notification.
5. Update timestamps where required.
6. Record admin activity in AuditLog.

These operations should happen reliably and preferably inside a MongoDB transaction where supported.

---

# 12. CITIZEN TRACKING PAGE

Create:

/track-request

Citizen should be able to see:

Search by:

* Request Number

Example:

GOV-2026-000123

Display:

Document Type
Request Number
Submitted Date
Current Status
Expected Completion
Current Department

Then show a beautiful vertical timeline.

Example:

✓ Application Submitted

✓ Application Under Review

✓ Documents Verified

● Processing

○ Approval

○ Document Ready

Each status should show:

* Status name
* Date/time
* Remarks
* Officer/department if appropriate

The citizen should never need to visit the office just to check status.

---

# 13. DASHBOARD — CITIZEN

Create:

/citizen/dashboard

Display cards:

* Total Requests
* Pending Requests
* Approved Requests
* Rejected Requests
* Completed Requests

Show:

Recent Requests

Each request:

Request Number
Document Type
Submitted Date
Current Status
Last Updated
Action

Actions:

* View
* Track
* Download if available

Add "Apply for New Document" button.

---

# 14. ADMIN DASHBOARD

Create:

/admin/dashboard

Dashboard should contain:

Total Requests
Pending Requests
Under Review
Document Verification
Processing
Approved
Rejected
Completed

Charts:

* Requests by Status
* Requests by Document Type
* Requests per Month
* Approval/Rejection statistics

Recent Requests table.

Admin should be able to click a request and process it.

Do not use fake chart numbers.

Dashboard statistics must come from backend APIs/database.

---

# 15. ADMIN REQUEST MANAGEMENT

Create:

/admin/requests

Features:

* Search
* Pagination
* Status filter
* Document type filter
* Date filter
* Sort
* View details

Columns:

Request Number
Citizen
Document Type
Submitted Date
Current Status
Assigned Officer
Last Updated
Action

Action:

View / Process

Do not load thousands of records into the browser.

Use backend pagination.

Example:

GET /api/admin/requests?page=1&limit=20&status=PROCESSING

---

# 16. SEARCH

Implement global request search.

Admin should be able to search:

* Request number
* Citizen name
* Email
* Mobile number
* Document type

Use MongoDB queries efficiently.

Add indexes for frequently searched fields.

---

# 17. DOCUMENT UPLOAD

Citizen should be able to upload required documents.

Example:

Aadhaar
Address Proof
Income Proof
Photo

Use multer.

Allowed types:

PDF
JPG
JPEG
PNG

Limit file size.

Do not trust only the file extension.

Validate MIME type and size.

Store file metadata in MongoDB.

Do not expose private files directly.

Use secure download endpoints.

---

# 18. DOCUMENT MODEL

Create UploadedDocument model or embedded structure.

Fields:

* request
* documentType
* originalName
* storedName
* mimeType
* size
* path/url
* uploadedBy
* uploadedAt
* verificationStatus
* verificationRemarks

verificationStatus:

* PENDING
* VERIFIED
* REJECTED

Admin can verify individual documents.

---

# 19. DOCUMENT VERIFICATION

Admin request page should show every uploaded document.

Example:

Aadhaar Card

Status:
PENDING

Actions:

[View]
[Verify]
[Reject]

If rejected:

Require rejection remarks.

Citizen should receive notification.

If all required documents are verified, admin can move request to processing.

---

# 20. ADDITIONAL DOCUMENT REQUEST

Admin should be able to request additional documents.

Example:

"Please upload latest income proof."

Citizen dashboard should show:

Additional document required.

Citizen can upload the requested document.

After upload:

Status can automatically return to:

DOCUMENT_VERIFICATION

Create proper history.

---

# 21. NOTIFICATION SYSTEM

Create Notification model.

Fields:

* user
* title
* message
* type
* request
* isRead
* createdAt

Notification examples:

"Your Income Certificate request GOV-2026-000123 has moved to Document Verification."

"Additional document required for GOV-2026-000123."

"Your application has been approved."

"Your certificate is ready for download."

Create notification APIs.

Frontend should have notification bell.

Unread notification count should be displayed.

---

# 22. REAL-TIME NOTIFICATIONS

If practical, implement Socket.IO.

When admin updates status:

Citizen should receive a real-time notification.

Architecture:

Admin updates status
↓
Backend
↓
MongoDB update
↓
Status history
↓
Notification
↓
Socket.IO event
↓
Citizen frontend

If Socket.IO is not implemented initially, the application should still work using notification polling/API refresh.

---

# 23. FINAL DOCUMENT

After approval, admin can upload the final government document.

Example:

income-certificate.pdf

Citizen should see:

"Your certificate is ready."

Button:

Download Certificate

Use secure backend endpoint.

Do not expose arbitrary server file paths.

---

# 24. AUDIT LOG

Create AuditLog model.

Every important admin operation should be logged.

Fields:

* user
* action
* request
* description
* IP address
* timestamp

Examples:

ADMIN_LOGIN
STATUS_UPDATED
DOCUMENT_VERIFIED
DOCUMENT_REJECTED
REQUEST_APPROVED
REQUEST_REJECTED
FINAL_DOCUMENT_UPLOADED
USER_UPDATED

Create:

/admin/audit-logs

Admin can view audit history.

---

# 25. ADMIN USER MANAGEMENT

Create:

/admin/users

Display:

* Name
* Email
* Mobile
* Role
* Status
* Created date

Admin can:

* Activate/deactivate user
* View user details
* Change appropriate user roles if authorized

Do NOT allow an ordinary citizen to access admin APIs by manipulating frontend URLs.

---

# 26. PROFILE

Citizen:

/profile

Admin:

/admin/profile

Allow:

* Update name
* Mobile
* Address
* Profile photo

Do not allow users to arbitrarily change their role.

---

# 27. API STRUCTURE

Use REST APIs.

Suggested structure:

AUTH:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/refresh

DOCUMENT TYPES:

GET /api/document-types
GET /api/document-types/:id
POST /api/document-types
PUT /api/document-types/:id
PATCH /api/document-types/:id/status

REQUESTS:

POST /api/requests
GET /api/requests/my
GET /api/requests/:id
GET /api/requests/:id/status-history
POST /api/requests/:id/documents
GET /api/requests/:id/documents/:documentId

ADMIN:

GET /api/admin/requests
GET /api/admin/requests/:id
PATCH /api/admin/requests/:id/status
PATCH /api/admin/requests/:id/documents/:documentId/verify
POST /api/admin/requests/:id/additional-document
POST /api/admin/requests/:id/final-document

NOTIFICATIONS:

GET /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all

DASHBOARD:

GET /api/dashboard/citizen
GET /api/admin/dashboard

USERS:

GET /api/admin/users
GET /api/admin/users/:id
PATCH /api/admin/users/:id/status

AUDIT:

GET /api/admin/audit-logs

Use proper controllers, validation and middleware.

---

# 28. SECURITY

Implement proper security.

Use:

helmet
cors
rate limiting
input validation
MongoDB sanitization
JWT validation
password hashing
role authorization
secure cookies
file validation

Prevent:

* Unauthorized API access
* IDOR vulnerabilities
* Arbitrary file access
* Malicious file upload
* JWT tampering
* NoSQL injection
* Basic XSS risks
* Brute-force login attempts

Never trust frontend validation.

Every important validation must also happen on backend.

---

# 29. API ERROR RESPONSE

Use consistent API responses.

Success:

{
"success": true,
"message": "Request status updated successfully",
"data": {}
}

Error:

{
"success": false,
"message": "Invalid status transition",
"errors": []
}

Use centralized error middleware.

Do not expose stack traces in production.

---

# 30. FRONTEND DESIGN

The UI should look like a modern digital government platform.

Do NOT make it look like a basic student CRUD project.

Design direction:

* Clean
* Trustworthy
* Professional
* Accessible
* Minimal
* Government-service oriented
* Mobile responsive

Suggested visual language:

Primary:
Deep Blue

Secondary:
Light Blue

Background:
Very Light Gray / White

Success:
Green

Warning:
Amber

Danger:
Red

Use cards with subtle shadows.

Use clear status badges.

Use accessible contrast.

Use professional typography.

---

# 31. PUBLIC LANDING PAGE

Create:

/

Sections:

Hero:

"Government Services. Now Trackable Online."

Subtitle:

"Submit your document request and track every stage of the process without visiting the office just to check your status."

Buttons:

Apply for Document
Track Application
Login

Features:

* Online Application
* Transparent Status Tracking
* Document Verification
* Notifications
* Secure Digital Documents

Process:

1. Submit Application
2. Upload Documents
3. Verification
4. Processing
5. Approval
6. Download Certificate

Add FAQ.

Add footer.

Do not use fake government logos or impersonate a real government department.

Clearly present it as a prototype/demo unless connected to an officially authorized government service.

---

# 32. DOCUMENT TYPE PAGE

Public page:

/services

Show available document types from backend.

Each card:

Document Name
Description
Processing Time
Fee
Required Documents

Button:

Apply Now

If user is not logged in:

Redirect to login.

---

# 33. APPLICATION FORM

Dynamic application form.

The form must change based on selected document type.

For example:

Income Certificate:

Name
Date of Birth
Address
Annual Income
Occupation
District
State
Pincode

Do not hardcode the same fields for every document.

Store document-specific applicationData.

Use validation.

---

# 34. APPLICATION REVIEW

Before submitting:

Show:

Personal Information
Document Type
Application Information
Uploaded Documents
Fee
Declaration

Checkbox:

"I confirm that the information provided is accurate."

Button:

Submit Application

After submission:

Show:

"Application submitted successfully."

Display:

Request Number:

GOV-2026-000123

Button:

Track Application

---

# 35. REQUEST DETAILS PAGE

Citizen:

/requests/:id

Display:

Request number
Document type
Submitted date
Current status
Expected completion date

Timeline.

Application details.

Uploaded documents.

Notifications.

Remarks.

Final document if available.

---

# 36. ADMIN REQUEST DETAILS PAGE

Admin:

/admin/requests/:id

Layout:

LEFT:

Citizen information

Request information

Application details

Uploaded documents

RIGHT:

Current status

Update status

Remarks

Timeline

Admin actions

Make this page highly usable for government officers.

---

# 37. STATUS BADGES

Use consistent status colors.

SUBMITTED:
Blue

UNDER_REVIEW:
Purple/Blue

DOCUMENT_VERIFICATION:
Orange

ADDITIONAL_DOCUMENT_REQUIRED:
Yellow

PROCESSING:
Blue

APPROVED:
Green

REJECTED:
Red

READY_FOR_DOWNLOAD:
Green

COMPLETED:
Dark Green

CANCELLED:
Gray

---

# 38. RESPONSIVE DESIGN

Application must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

Admin tables should become responsive cards on mobile.

Sidebar should collapse.

Forms should stack on mobile.

Do not allow horizontal overflow.

Test common widths:

320px
375px
768px
1024px
1440px

---

# 39. ACCESSIBILITY

Use:

* Semantic HTML
* Proper labels
* Keyboard navigation
* Accessible buttons
* Accessible form errors
* Proper color contrast
* ARIA only when required

Do not communicate status using color alone.

Example:

✓ APPROVED

not only green color.

---

# 40. DATABASE RELATIONSHIPS

Implement logical MongoDB relationships.

User
↓
Requests
↓
DocumentType
↓
UploadedDocuments

Request
↓
RequestStatusHistory

Request
↓
Notifications

User
↓
AuditLogs

Use Mongoose populate where appropriate.

Avoid excessive populate calls.

---

# 41. SEED DATA

Create a seed script.

Seed:

1 admin user

Example:

[admin@govtrack.demo](mailto:admin@govtrack.demo)

Password should be clearly documented as a demo credential and must be changed in a real deployment.

Create several document types.

Create realistic demo users.

Create sample requests.

Create status histories.

IMPORTANT:

Do not claim seeded data is real government data.

Use clearly marked DEMO data.

The architecture must be ready to replace seeded data with real authorized data sources.

---

# 42. REAL DATA INTEGRATION

The system should be designed for real-world integration.

Create a service abstraction for government integrations.

Example:

services/
government/
GovernmentDocumentService.js

Possible interface:

submitApplication()
getApplicationStatus()
verifyCitizen()
downloadCertificate()

Initially:

Use database-backed application processing.

Do NOT invent a fake external government API and present it as real.

Keep external API configuration in environment variables.

Example:

GOVERNMENT_API_BASE_URL=
GOVERNMENT_API_KEY=

If no authorized API is available:

Use internal MongoDB workflow.

Clearly document where real API integration can later be connected.

---

# 43. ENVIRONMENT VARIABLES

Backend .env:

PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
REFRESH_TOKEN_SECRET=
CLIENT_URL=
UPLOAD_DIR=
GOVERNMENT_API_BASE_URL=
GOVERNMENT_API_KEY=

Frontend .env:

VITE_API_URL=http://localhost:5000/api

Never commit .env.

Create:

.env.example

---

# 44. PROJECT STRUCTURE

Use:

root/

frontend/

backend/

README.md

.env.example

.gitignore

Frontend:

src/
components/
pages/
public/
auth/
citizen/
admin/
layouts/
context/
hooks/
services/
utils/
validators/
routes/
assets/
App.jsx
main.jsx

Backend:

src/
config/
controllers/
middleware/
models/
routes/
services/
validators/
utils/
uploads/
app.js
server.js

---

# 45. FRONTEND API SERVICE

Create centralized Axios configuration.

Example:

services/api.js

Configure:

baseURL
interceptors
authorization

Do not write fetch/axios calls randomly throughout components.

Create services such as:

authService.js
requestService.js
documentService.js
notificationService.js
adminService.js
userService.js

---

# 46. AUTH CONTEXT

Create AuthContext.

Store:

currentUser
isAuthenticated
loading

Functions:

login()
register()
logout()
refreshUser()

Handle protected routes.

ProtectedRoute should check authentication.

RoleProtectedRoute should check role.

---

# 47. ROUTING

Public:

/
/services
/login
/register
/track-request

Citizen:

/citizen/dashboard
/citizen/apply
/citizen/requests
/citizen/requests/:id
/citizen/profile
/citizen/notifications

Admin:

/admin/dashboard
/admin/requests
/admin/requests/:id
/admin/document-types
/admin/users
/admin/audit-logs
/admin/profile

Unauthorized users should be redirected appropriately.

---

# 48. LOADING STATES

Every API call should have proper loading states.

Use:

Skeleton loaders
Spinners
Disabled buttons

Never show a blank screen while data loads.

---

# 49. EMPTY STATES

Example:

"No applications yet."

"No notifications."

"No matching requests found."

Make empty states visually useful.

---

# 50. ERROR STATES

Handle:

401
403
404
422
429
500

Display meaningful messages.

Example:

403:

"You do not have permission to access this resource."

Do not expose backend stack traces.

---

# 51. PAGINATION

Implement backend pagination.

Response:

{
"data": [],
"pagination": {
"page": 1,
"limit": 20,
"total": 150,
"totalPages": 8
}
}

Frontend should have pagination controls.

---

# 52. FILTERS

Admin request page filters:

Status
Document Type
Department
Date Range

Search:

Request number
Citizen name
Email
Mobile

Filters should update backend query parameters.

---

# 53. SORTING

Support:

Newest
Oldest
Recently Updated
Expected Completion

Do not sort thousands of records on frontend.

---

# 54. DASHBOARD STATISTICS API

Backend should calculate:

Total requests
Pending
Processing
Approved
Rejected
Completed

Monthly application count.

Document-type distribution.

Do not hardcode statistics.

---

# 55. ADMIN WORKFLOW

Implement this exact workflow:

Citizen registers
↓
Citizen logs in
↓
Selects document
↓
Fills application
↓
Uploads required documents
↓
Submits request
↓
Request Number generated
↓
Status = SUBMITTED
↓
Admin sees request
↓
Admin reviews request
↓
Status = UNDER_REVIEW
↓
Admin verifies documents
↓
Status = DOCUMENT_VERIFICATION
↓
If missing:
ADDITIONAL_DOCUMENT_REQUIRED
↓
Citizen uploads document
↓
DOCUMENT_VERIFICATION
↓
Status = PROCESSING
↓
Admin processes application
↓
APPROVED
↓
Admin uploads final document
↓
READY_FOR_DOWNLOAD
↓
Citizen downloads document
↓
COMPLETED

Every step must create status history.

---

# 56. REQUEST CANCELLATION

Citizen can cancel only if status is:

SUBMITTED

or another explicitly allowed early stage.

Once processing begins, cancellation should be disabled unless admin allows it.

Backend must enforce this.

---

# 57. EXPECTED COMPLETION DATE

When request is submitted:

expectedCompletionDate = submittedAt + documentType.processingTime

Show:

Expected completion:

15 October 2026

Do not guarantee exact completion.

Clearly label it:

"Estimated completion date"

---

# 58. ADMIN REMARKS

Every important status update should allow remarks.

Example:

"Documents verified successfully."

or

"Please upload a clearer copy of your address proof."

Citizen should see these remarks in timeline.

---

# 59. SECURITY FOR REQUEST ACCESS

Citizen must only be able to access their own requests.

Example:

GET /api/requests/123

Backend must verify:

request.citizen === authenticatedUser.id

Never trust request IDs from frontend.

Prevent IDOR.

Admin can access authorized requests.

---

# 60. SECURITY FOR FILE DOWNLOAD

Citizen can only download:

* Their own uploaded files
* Their own final documents

Admin can access documents according to permissions.

Never expose:

/uploads/file.pdf

directly if files are private.

Use authenticated download endpoints.

---

# 61. TESTING

Implement basic backend tests for:

Authentication
Authorization
Request creation
Status update
Status transition validation
Request ownership
Document upload validation

At minimum test:

Citizen cannot access admin API.

Citizen cannot access another citizen's request.

Admin can update status.

Invalid status transition is rejected.

Every status update creates history.

---

# 62. API DOCUMENTATION

Add Swagger/OpenAPI if practical.

Document:

Authentication
Requests
Documents
Admin APIs
Notifications

Include request/response examples.

---

# 63. README

Create a complete README.

Include:

Project overview
Problem statement
Features
Tech stack
Architecture
Folder structure
Environment variables
Installation
MongoDB setup
Seed instructions
Running backend
Running frontend
API overview
Demo credentials
Security notes
Future improvements
Real government API integration guide

---

# 64. DEMO MODE

Create a clear DEMO environment.

The application should display somewhere appropriate:

"Demo / Prototype — Not an Official Government Website"

Do not use official government logos.

Do not impersonate any real government department.

Use fictional department names such as:

"Citizen Services Department — Demo"

---

# 65. UI DETAILS

Landing page:

Modern hero.

Use government-service style cards.

Dashboard:

Metric cards.

Request table.

Status badges.

Timeline.

Admin:

Professional sidebar.

Top navbar.

Notifications.

Profile menu.

Citizen:

Simple citizen-friendly navigation.

Mobile-first forms.

Large readable status.

---

# 66. UX REQUIREMENTS

Important actions should be obvious.

Examples:

Apply for Document

Track Application

Upload Document

Update Status

Download Certificate

Do not hide important actions in complicated menus.

Use confirmation dialogs for destructive actions.

Example:

"Are you sure you want to reject this application?"

Require rejection reason.

---

# 67. NO HARDCODED BUSINESS DATA

Do NOT hardcode:

Document types
Statuses
Request statistics
User information
Request records
Notifications

Business data must come from backend/database.

Frontend may contain UI configuration such as icons and layout.

---

# 68. REALISTIC DATA

Use realistic demo data only for seed/demo purposes.

Example citizen:

Demo Citizen

[demo.citizen@example.com](mailto:demo.citizen@example.com)

Do not use real people's personal information.

Use clearly fictional addresses and phone numbers.

---

# 69. CODE QUALITY

Write clean production-style code.

Use:

* Reusable components
* Reusable services
* Meaningful variable names
* Async/await
* Proper error handling
* Environment variables
* Modular architecture

Avoid:

* Giant components
* Duplicate API code
* Hardcoded URLs
* Hardcoded database data
* console.log everywhere
* unnecessary comments
* dead code
* unused imports

---

# 70. FINAL ACCEPTANCE CRITERIA

The application is complete only if:

[ ] Citizen registration works.

[ ] Citizen login works.

[ ] Admin login works.

[ ] JWT authentication works.

[ ] Role-based authorization works.

[ ] Citizen can browse document types.

[ ] Citizen can submit request.

[ ] Request number is generated.

[ ] Required documents can be uploaded.

[ ] Admin can see requests.

[ ] Admin can verify documents.

[ ] Admin can update request status.

[ ] Invalid status transitions are prevented.

[ ] Status history is created automatically.

[ ] Citizen can see timeline.

[ ] Citizen receives notifications.

[ ] Admin dashboard uses real database statistics.

[ ] Citizen dashboard uses real database data.

[ ] Admin can request additional documents.

[ ] Citizen can upload additional documents.

[ ] Admin can approve/reject request.

[ ] Admin can upload final document.

[ ] Citizen can securely download final document.

[ ] Audit logs work.

[ ] Search works.

[ ] Filtering works.

[ ] Pagination works.

[ ] Responsive design works.

[ ] API errors are handled.

[ ] Backend authorization prevents unauthorized access.

[ ] Citizen cannot access another citizen's application.

[ ] Files are protected.

[ ] Environment variables are used.

[ ] README is complete.

[ ] .env is not committed.

[ ] No fake government API is presented as real.

[ ] Demo data is clearly identified as demo data.

---

# 71. DEVELOPMENT ORDER

Build the application in this order:

PHASE 1
Project setup
MongoDB connection
Express setup
React setup

PHASE 2
User model
Authentication
JWT
Role-based authorization

PHASE 3
DocumentType model
Admin document management

PHASE 4
Request model
Request creation
Request number generation

PHASE 5
Document upload
Document verification

PHASE 6
Status workflow
Status history
Admin processing

PHASE 7
Citizen tracking
Timeline

PHASE 8
Notifications

PHASE 9
Admin dashboard
Statistics

PHASE 10
Search
Filters
Pagination

PHASE 11
Audit logs

PHASE 12
Final document download

PHASE 13
Security hardening

PHASE 14
Responsive UI
Accessibility
UX polish

PHASE 15
Testing
README
Final cleanup

---

# 72. IMPORTANT IMPLEMENTATION RULE

Do NOT generate the entire project as a superficial demo with fake arrays.

Actually implement:

MongoDB models
REST APIs
Authentication
Authorization
Validation
Database queries
Status workflow
Status history
File handling
Notifications
Admin processing
Citizen tracking
Dashboard statistics

The frontend must consume backend APIs.

No dummy Context API data.

No hardcoded request data.

No fake dashboard numbers.

No fake status updates.

---

# 73. FINAL GOAL

The finished project should demonstrate a real-world solution to this problem:

"After submitting a government document request, citizens should not have to physically visit the government office just to know the current status of their application."

The application should provide:

ONLINE APPLICATION
+
DOCUMENT UPLOAD
+
ADMIN VERIFICATION
+
STATUS UPDATES
+
STATUS TIMELINE
+
NOTIFICATIONS
+
FINAL DIGITAL DOCUMENT
+
AUDIT TRAIL

Build it as a serious MERN-stack portfolio/project application rather than a basic CRUD application.

The system must be extensible enough that an officially authorized government department could later connect its actual APIs, databases, authentication systems, document-signing systems, SMS/email gateways, or digital document repositories.

At the end, provide:

1. Complete folder structure
2. Backend implementation
3. Frontend implementation
4. Database models
5. API routes
6. Authentication
7. Authorization
8. Seed script
9. .env.example
10. README
11. Testing instructions
12. Local development instructions
13. Production deployment instructions
14. Explanation of where real government API integrations can be connected later

Do not stop after creating the UI.

The application should be fully functional end-to-end.
