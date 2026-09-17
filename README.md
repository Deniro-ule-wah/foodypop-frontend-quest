# FoodyPop Web Hub

FOODYPOP V2 — LOVABLE WEB CLIENT

CRIT + AGENT + LOOP + GRAPH IMPLEMENTATION DIRECTIVE

0. MISSION

Build a browser-based FoodyPop V2 web client that connects to the existing FoodyPop V2 backend.

This web client is being created specifically to provide a real HTTP/browser-testable frontend for DevOps and QA.

The existing FoodyPop mobile application is React Native + Expo and its current Replit URL is an Expo Go preview tunnel. Do NOT attempt to convert or replace that mobile application.

This is a separate web client.

The web client must consume the existing backend.

NON-NEGOTIABLE RULE

NO INVENTED ENDPOINTS
NO INVENTED API CONTRACTS
NO BACKEND MODIFICATIONS
NO DATABASE MODIFICATIONS
NO FAKE PAYMENT SUCCESS
NO DIRECT DARAJA INTEGRATION
NO MOCK BACKEND AS A SUBSTITUTE FOR THE REAL BACKEND


If the backend does not expose a required capability, do not invent one.

Instead:

DOCUMENT GAP
→ KEEP UI STATE SAFE
→ REPORT BACKEND DEPENDENCY


1. AUTHORITATIVE BACKEND

Use ONLY:

https://foodypop-backend.onrender.com


This is the authoritative FoodyPop V2 backend.

Do NOT use:

https://foodypop-api.onrender.com


That is the legacy service and MUST NOT appear in the active web client configuration.

2. BACKEND ARCHITECTURE CONTEXT

The existing backend is:

Node.js
Express
TypeScript
Prisma
PostgreSQL
pg-boss


It is a modular monolith with one API and one database.

The backend already implements the V2 order/payment architecture.

Do NOT recreate any of this inside the web client.

3. PRIMARY OBJECTIVE

Create a production-quality browser frontend that allows DevOps to investigate:

Browser
   ↓
FoodyPop Web Client
   ↓
HTTPS REST API
   ↓
FoodyPop V2 Backend
   ↓
PostgreSQL / pg-boss


The browser application must make the backend integration observable and testable.

4. CRIT ENGINE

Operate continuously using:

CHECK
  ↓
REASON
  ↓
IMPLEMENT
  ↓
TEST
  ↓
CHECK AGAIN


Never blindly implement assumptions.

5. AGENT GRAPH

Create the following internal implementation agents.

AGENT 1 — PRODUCT / UX AUDITOR

Understand the existing FoodyPop product direction.

Core principle:

DISH FIRST.
PEOPLE SECOND.


The web client is primarily about discovering and interacting with:

food

drinks

dishes

cuisines

categories

vendors as supporting information

Do NOT transform the product into an influencer/social-profile-first application.

AGENT 2 — BACKEND CONTRACT AUDITOR

Before implementing API integration:

Inspect the existing backend contract that is actually available.

Determine:

available endpoints

HTTP methods

request bodies

query parameters

authentication requirements

response structures

error responses

authorization requirements

order states

payment states

ABSOLUTE RULE

If an endpoint cannot be established from the backend:

DO NOT INVENT IT.


Instead record:

BACKEND CONTRACT UNKNOWN


and design the frontend so the missing capability can be integrated later.

AGENT 3 — WEB ARCHITECTURE AGENT

Build a clean web application using the technology stack supported by Lovable.

Prefer:

React
TypeScript
Vite


or the existing Lovable-supported equivalent.

Use:

component architecture

typed API services

centralized API client

environment configuration

route protection

predictable state management

reusable loading/error/empty states

Do not introduce unnecessary infrastructure.

6. ENVIRONMENT CONFIGURATION

Create:

VITE_API_BASE_URL


or the appropriate environment variable for the selected web framework.

Production value:

https://foodypop-backend.onrender.com


Do NOT hardcode the legacy backend.

Do NOT place secrets in frontend environment variables.

Remember:

VITE_*
NEXT_PUBLIC_*
PUBLIC_*


style variables are browser-visible.

Only public configuration belongs there.

7. API CLIENT

Create ONE centralized API client.

All backend communication must flow through it.

Conceptually:

src/
  api/
    client
    auth
    dishes
    vendors
    orders
    payments


Do not scatter raw fetch() calls throughout components.

The API layer must handle:

base URL

authentication headers

JSON serialization

HTTP errors

unauthorized responses

request cancellation where useful

typed responses

consistent error normalization

Do not hide backend errors behind generic fake success states.

8. AUTHENTICATION

Implement authentication ONLY according to the actual backend contract.

Potential flows to support IF ACTUALLY EXPOSED:

Register
Login
Session persistence
Authenticated requests
Logout


Use secure browser-appropriate storage according to the actual backend authentication mechanism.

Do not invent:

/refresh
/me
/logout


or any other endpoint unless the backend actually exposes it.

If the backend contract cannot establish an endpoint:

DO NOT CALL IT.


9. FOODYPOP WEB EXPERIENCE

Build the following conceptual areas where supported by the backend.

HOME / DISCOVERY

The homepage should be dish-first.

Include:

food/drink discovery

search

featured/discoverable dishes

cuisine/category discovery where supported

clear dish cards

dish imagery

dish name

price where available

discount price where available

vendor information as secondary information

Avoid an empty homepage.

10. DISH DETAIL

Create a dedicated dish-detail experience.

Display, where available:

dish name

image/media

food/drink classification

cooked/raw information

ingredients

recipe information

price

discount price

vendor

location

reviews/comments

taste information

availability

Only display fields actually returned by the backend.

Do not manufacture data.

11. SEARCH

Implement search only according to the backend's actual search contract.

If search is supported:

User enters query
→ web client calls actual endpoint
→ results displayed
→ loading state
→ empty state
→ error state


Do not create a fake client-side search engine over hardcoded dishes unless explicitly marked as temporary development fallback.

12. FOLLOWING

The product permits following:

DISH
CUISINE
CATEGORY


Do NOT create follow functionality for arbitrary people/influencers unless the backend contract explicitly supports it.

If the backend supports follow operations, expose them through the web client.

Show:

current follow state

follow/unfollow action

counts where available

loading state

error state

13. TASTE INTERACTIONS

Where supported by the backend, expose FoodyPop taste interactions such as:

Delicious
Sweet
Bitter
Sour
Salty
Spicy
Refreshing
Crispy
Rich
Filling


Do not create fake persistence.

If the backend does not expose the necessary mutation:

DISPLAY CAPABILITY AS UNAVAILABLE


rather than pretending the action succeeded.

14. VENDOR EXPERIENCE

Vendor information is secondary to the dish.

Where supported:

vendor name

location

available dishes

vendor details

relevant ordering information

Do not redesign FoodyPop into a vendor directory.

15. CART

Build a cart only if the backend/order model supports the required data.

Cart must clearly distinguish:

LOCAL CART STATE


from:

PERSISTED BACKEND ORDER


Do not create a fake backend order merely because the user clicks checkout.

16. ORDER CREATION

Use the actual V2 backend order contract.

Expected conceptual lifecycle:

PENDING_PAYMENT
        ↓
PAID
        ↓
PENDING_VENDOR_ACCEPTANCE
        ↓
ACCEPTED
        ↓
PREPARING
        ↓
READY_FOR_PICKUP
        ↓
COLLECTED
        ↓
COMPLETED


Do not assume every transition can be performed by the consumer.

The backend remains authoritative.

The frontend displays backend state.

17. ORDER IDEMPOTENCY

If the backend requires an order idempotency key:

Implement it according to the actual API contract.

Do not invent a different idempotency model.

The web client must avoid accidental duplicate order creation caused by:

double-clicking

retrying requests

browser refreshes

network uncertainty

Where the backend provides idempotency support, use it correctly.

18. PAYMENT ARCHITECTURE

This section is CRITICAL.

The web client must NEVER:

call Daraja directly
store Daraja credentials
contain Daraja secrets
declare payment success from STK initiation
mark an order PAID locally


The backend is the financial authority.

Expected PaymentAttempt statuses:

PENDING
SUCCESS
FAILED
TIMEOUT
UNKNOWN


The UI must understand that:

TIMEOUT ≠ permanent failure
UNKNOWN ≠ permanent failure


The frontend must not convert either state into an automatic permanent failure.

19. PAYMENT UX

Where the backend exposes the required endpoints, implement:

Initiate payment
       ↓
PENDING
       ↓
Backend confirmation
       ↓
SUCCESS / FAILED / TIMEOUT / UNKNOWN


Display safe user-facing states.

Example conceptual states:

Payment being processed
Payment confirmed
Payment failed
Payment timed out — verification may still be pending
Payment status unknown — verification required


Do not claim these exact UI labels are mandatory; choose clear UX while preserving the underlying meaning.

20. PAYMENT RETRY SAFETY

A retry must NOT blindly create duplicate active payment attempts.

If the backend exposes payment idempotency:

use it.

If the backend reports an existing active payment attempt:

respect it.

Never assume:

TIMEOUT → immediately create another payment


without following the backend contract.

21. PAYMENT RECONCILIATION

If backend endpoints expose reconciliation/payment-status information, display the authoritative result.

The frontend must never perform financial reconciliation itself.

Conceptually:

Client
  ↓
Backend
  ↓
Daraja
  ↓
Verification
  ↓
Backend financial finalization
  ↓
Client observes resulting state


22. ORDER STATUS UI

Create clear status visualization for:

PENDING_PAYMENT
PAID
PENDING_VENDOR_ACCEPTANCE
ACCEPTED
PREPARING
READY_FOR_PICKUP
COLLECTED
COMPLETED


Do not let the client independently mutate the order lifecycle.

23. ERROR HANDLING

Every backend interaction must support:

Loading
Success
Empty
Error
Retry
Unauthorized
Forbidden
Network unavailable
Server unavailable


Never replace an API failure with fake successful data.

24. NETWORK OBSERVABILITY

Make API behavior easy for DevOps to inspect.

Use:

predictable request paths

clear API service boundaries

meaningful browser console errors in development

normalized error objects

no swallowed exceptions

Do not log:

passwords

JWTs

payment secrets

sensitive payment data

25. SECURITY

Run a frontend security pass.

Check for:

API secrets
Database credentials
Daraja credentials
JWT secrets
private keys
service tokens
hardcoded passwords


None may exist in the web application.

Public API base URL is acceptable.

26. RESPONSIVE WEB DESIGN

This is specifically a browser-testable web client.

Support:

Desktop
Tablet
Mobile browser


Test:

navigation

forms

cards

dish details

cart

checkout

order tracking

payment states

Do not confuse responsive browser behavior with React Native mobile behavior.

27. DEVOPS TESTABILITY

The resulting application MUST be deployable to a normal HTTPS web URL.

The final deployment must NOT be:

Expo Go
exps://
QR-only preview
native development tunnel


It should provide:

HTTPS
HTML
JavaScript
CSS
Browser-rendered UI


The final URL will be supplied to DevOps for black-box investigation.

28. TEST GRAPH

Use:

BUILD
 ↓
LINT / TYPECHECK
 ↓
UNIT TESTS
 ↓
API CLIENT TEST
 ↓
AUTH TEST
 ↓
DISCOVERY TEST
 ↓
DISH DETAIL TEST
 ↓
CART TEST
 ↓
ORDER TEST
 ↓
PAYMENT STATE TEST
 ↓
RESPONSIVE TEST
 ↓
PRODUCTION BUILD
 ↓
DEPLOY
 ↓
BROWSER SMOKE TEST


Do not skip failed stages silently.

29. BACKEND-CONTRACT FAILURE MODE

If an expected feature cannot be implemented because the backend lacks a verified endpoint:

DO NOT:

invent endpoint
mock success
modify backend
modify database
create fake API


Instead:

CHECK
→ CONFIRM BACKEND GAP
→ IMPLEMENT SAFE UI STATE
→ DOCUMENT GAP
→ CONTINUE WITH OTHER VERIFIED FEATURES


30. NO BACKEND MODIFICATIONS

This directive explicitly forbids:

Backend code changes
Prisma schema changes
Database migrations
New backend endpoints
Backend environment changes
Payment architecture changes
Order-state changes


The backend is an external dependency.

If a backend capability is missing, report it.

Do not "fix" it from Lovable.

31. MOCK DATA POLICY

Production functionality must use the real backend.

Mock data may only be used for:

isolated UI development

skeleton/loading states

visual component development

automated component tests

Clearly label mocks in source code.

Do not allow mock data to silently become the production data source.

32. UI/UX DESIGN DIRECTION

Create a polished food-discovery experience.

Prioritize:

DISH
IMAGE
NAME
TASTE
PRICE
DISCOVERY
ACTION


The interface should feel like a real FoodyPop product rather than a generic CRUD dashboard.

However:

Do not sacrifice API clarity or testability for visual effects.

33. IMPLEMENTATION LOOP

For every major feature:

LOOP N

CHECK:
What backend contract exists?

REASON:
What does the frontend need?

IMPLEMENT:
Build only against verified contract.

TEST:
Confirm API + UI behavior.

RECHECK:
Does implementation still match backend?

IF NO:
Fix frontend.

IF BACKEND CONTRACT IS MISSING:
Stop.
Document dependency.
Do not invent.


34. AGENT HANDOFF GRAPH

Use this dependency graph:

                    PRODUCT AUDITOR
                           │
                           ▼
                  BACKEND CONTRACT
                       AUDITOR
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
           AUTH        DISCOVERY       ORDERS
             │             │             │
             │             │             ▼
             │             │          PAYMENT
             │             │             │
             └─────────────┴─────────────┘
                           │
                           ▼
                    SECURITY AUDIT
                           │
                           ▼
                  RESPONSIVE / UX
                           │
                           ▼
                    TESTING AGENT
                           │
                           ▼
                    DEPLOYMENT
                           │
                           ▼
                    DEVOPS HANDOFF


35. REQUIRED DELIVERABLES

Produce:

A. Working web application

A browser-rendered FoodyPop V2 frontend.

B. Production configuration

Using:

https://foodypop-backend.onrender.com


C. API integration layer

Centralized and typed.

D. Authentication

Only according to verified backend contracts.

E. Dish discovery

Only according to verified backend capabilities.

F. Order/checkout

Only according to verified backend capabilities.

G. Payment UX

Correct representation of backend payment states.

H. Responsive UI

Desktop/tablet/mobile browser.

I. Test coverage

For implemented functionality.

J. Deployment

A genuine HTTPS web deployment.

36. FINAL VERIFICATION REPORT

Before declaring completion, output:

BACKEND TARGET

Configured API:
https://foodypop-backend.onrender.com


LEGACY TARGET CHECK

https://foodypop-api.onrender.com


Expected:

NOT USED BY ACTIVE APPLICATION


IMPLEMENTED FEATURES

List only features actually implemented.

BACKEND-CONNECTED FEATURES

List only features actually connected to verified endpoints.

MOCKED FEATURES

List every remaining mock.

BLOCKED FEATURES

List every feature blocked by a missing/uncertain backend contract.

PAYMENT SAFETY

Confirm:

No direct Daraja integration
No client-side payment finalization
No payment secrets
No fabricated SUCCESS state
TIMEOUT/UNKNOWN preserved as non-terminal states


Only claim these if actually true after inspecting the implementation.

BUILD

Report:

Build:
Typecheck:
Lint:
Tests:
Production build:


DEPLOYMENT

Provide:

WEB DEPLOYMENT URL:


This must be a real browser-rendered URL.

37. FINAL CRIT SCORECARD

Return:

AreaStatusEvidenceWeb applicationBackend connectivityAPI contractAuthenticationDish discoverySearchFollowTaste interactionsDish detailsVendorCartOrdersCheckoutPayment initiationPayment statesOrder lifecycleSecurityResponsive UXBuildDeployment

Use:

VERIFIED
PARTIAL
BLOCKED
MOCKED
MISSING


Never use a higher status without evidence.

38. FINAL STOP CONDITION

The task is complete only when:

WEB CLIENT BUILT
      ↓
REAL BACKEND CONFIGURED
      ↓
NO LEGACY BACKEND ACTIVE
      ↓
NO INVENTED ENDPOINTS
      ↓
NO BACKEND MODIFICATIONS
      ↓
PAYMENT SAFETY VERIFIED
      ↓
BUILD PASSES
      ↓
PRODUCTION WEB BUILD EXISTS
      ↓
HTTPS URL AVAILABLE
      ↓
DEVOPS CAN BROWSER-TEST IT


If one of these cannot be completed, report the exact blocker instead of fabricating completion.

GOVERNING PRINCIPLE

The Lovable application is a web client of the existing FoodyPop V2 backend.

It is NOT:

a replacement backend
a new database
a mock backend
a redesigned payment system
a replacement for the Expo application


The hierarchy is:

FOODYPPOP V2 BACKEND
        ↑
        │
AUTHORITATIVE BUSINESS LOGIC
        ↑
        │
LOVABLE WEB CLIENT
        ↑
        │
BROWSER
        ↑
        │
DEVOPS / QA


Build the web client around the backend.

Never redesign the backend around the web client.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e665fd82-7b79-4bbe-91c7-da6c75eedfda).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
