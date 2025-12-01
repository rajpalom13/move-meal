# MoveNmeal - Comprehensive Test Cases Document

**Document Version:** 1.0
**Project Name:** MoveNmeal - Food Delivery & Ride-Sharing Cluster Platform
**Prepared By:** Software Engineering Team
**Date:** December 1, 2025

---

## Table of Contents

1. [Authentication Module Test Cases](#1-authentication-module-test-cases)
2. [Food Cluster Module Test Cases](#2-food-cluster-module-test-cases)
3. [Ride Cluster Module Test Cases](#3-ride-cluster-module-test-cases)
4. [AI Recommendation Engine Test Cases](#4-ai-recommendation-engine-test-cases)
5. [Order Management Test Cases](#5-order-management-test-cases)
6. [Real-time Communication Test Cases](#6-real-time-communication-test-cases)
7. [Geospatial Features Test Cases](#7-geospatial-features-test-cases)
8. [API Security Test Cases](#8-api-security-test-cases)

---

## 1. Authentication Module Test Cases

### 1.1 User Registration

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AUTH-001 | Valid User Registration | None | 1. Navigate to /auth/register<br>2. Enter valid email<br>3. Enter valid password<br>4. Enter valid phone<br>5. Enter name<br>6. Click Register | email: test@test.com<br>password: Test@123456<br>phone: +911234567890<br>name: Test User | User created successfully, redirected to login page with success message | Critical |
| AUTH-002 | Registration with Existing Email | User with same email exists | 1. Navigate to /auth/register<br>2. Enter existing email<br>3. Complete other fields<br>4. Click Register | email: existing@test.com | Error: "Email already registered" | Critical |
| AUTH-003 | Registration with Invalid Email Format | None | 1. Navigate to /auth/register<br>2. Enter invalid email format<br>3. Try to submit | email: invalid-email | Validation error: "Please enter a valid email" | High |
| AUTH-004 | Registration with Weak Password | None | 1. Navigate to /auth/register<br>2. Enter weak password<br>3. Try to submit | password: 123 | Validation error: "Password must be at least 8 characters" | High |
| AUTH-005 | Registration with Missing Required Fields | None | 1. Navigate to /auth/register<br>2. Leave required fields empty<br>3. Click Register | Empty fields | Validation errors for all required fields | High |
| AUTH-006 | Registration with Invalid Phone Format | None | 1. Navigate to /auth/register<br>2. Enter invalid phone number<br>3. Try to submit | phone: abc123 | Validation error: "Please enter a valid phone number" | Medium |

### 1.2 User Login

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AUTH-007 | Valid Email/Password Login | Registered user exists | 1. Navigate to /auth/login<br>2. Enter valid email<br>3. Enter correct password<br>4. Click Login | email: test@test.com<br>password: Test@123456 | JWT token received, redirected to dashboard | Critical |
| AUTH-008 | Login with Wrong Password | Registered user exists | 1. Navigate to /auth/login<br>2. Enter valid email<br>3. Enter wrong password<br>4. Click Login | email: test@test.com<br>password: wrongpass | Error: "Invalid credentials" | Critical |
| AUTH-009 | Login with Non-existent Email | None | 1. Navigate to /auth/login<br>2. Enter non-existent email<br>3. Enter any password<br>4. Click Login | email: notexist@test.com | Error: "Invalid credentials" | Critical |
| AUTH-010 | Login with Empty Fields | None | 1. Navigate to /auth/login<br>2. Leave fields empty<br>3. Click Login | Empty fields | Validation errors displayed | High |

### 1.3 OTP Authentication

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AUTH-011 | Send OTP Successfully | Registered user exists | 1. Call POST /api/auth/otp/send<br>2. Provide valid email/phone | email: test@test.com | OTP sent successfully, 200 response | Critical |
| AUTH-012 | Verify Valid OTP | OTP sent to user | 1. Call POST /api/auth/otp/verify<br>2. Provide correct OTP | otp: 123456 (valid) | Authentication successful, JWT received | Critical |
| AUTH-013 | Verify Expired OTP | OTP sent > 10 minutes ago | 1. Wait 10+ minutes<br>2. Call POST /api/auth/otp/verify<br>3. Provide the expired OTP | otp: 123456 (expired) | Error: "OTP has expired" | Critical |
| AUTH-014 | Verify Wrong OTP | OTP sent to user | 1. Call POST /api/auth/otp/verify<br>2. Provide wrong OTP | otp: 000000 (wrong) | Error: "Invalid OTP" | Critical |
| AUTH-015 | Verify Already Used OTP | OTP already verified | 1. Verify OTP once (success)<br>2. Try to verify same OTP again | otp: 123456 (used) | Error: "OTP already used" | High |
| AUTH-016 | OTP Rate Limiting | None | 1. Send OTP request 5+ times in 1 minute | Multiple requests | Rate limit error after threshold | High |

### 1.4 JWT Token Management

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AUTH-017 | Access Protected Route with Valid Token | Valid JWT token | 1. Call GET /api/auth/me<br>2. Include valid JWT in header | Authorization: Bearer <valid_token> | User profile returned, 200 response | Critical |
| AUTH-018 | Access Protected Route without Token | None | 1. Call GET /api/auth/me<br>2. No Authorization header | No token | Error: "Authentication required", 401 | Critical |
| AUTH-019 | Access Protected Route with Expired Token | Expired JWT token | 1. Use token with past expiration<br>2. Call protected endpoint | Authorization: Bearer <expired_token> | Error: "Token expired", 401 | Critical |
| AUTH-020 | Access Protected Route with Malformed Token | None | 1. Call protected endpoint<br>2. Use invalid token format | Authorization: Bearer invalid.token.here | Error: "Invalid token", 401 | High |

### 1.5 Profile Management

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AUTH-021 | Get Current User Profile | Authenticated user | 1. Call GET /api/auth/me<br>2. Include valid JWT | Valid token | User profile object returned | High |
| AUTH-022 | Update User Profile | Authenticated user | 1. Call PUT /api/auth/profile<br>2. Provide updated fields | name: "Updated Name"<br>college: "MIT" | Profile updated successfully | High |
| AUTH-023 | Update User Location | Authenticated user | 1. Call PUT /api/auth/location<br>2. Provide coordinates and address | coordinates: [77.5946, 12.9716]<br>address: "Bangalore" | Location updated, 2dsphere index updated | High |
| AUTH-024 | Update Preferences | Authenticated user | 1. Call PUT /api/auth/profile<br>2. Include preferences | cuisines: ["Indian", "Chinese"]<br>dietaryRestrictions: ["vegetarian"] | Preferences saved correctly | Medium |

---

## 2. Food Cluster Module Test Cases

### 2.1 Create Food Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-001 | Create Valid Food Cluster | Authenticated user | 1. Call POST /api/food-clusters<br>2. Provide all required fields | title: "Lunch Order"<br>restaurant: "Pizza Hut"<br>minimumBasket: 500<br>maxMembers: 5<br>deliveryLocation: {...} | Cluster created, status: "open", creator added as first member | Critical |
| FC-002 | Create Cluster without Required Fields | Authenticated user | 1. Call POST /api/food-clusters<br>2. Missing required fields | Missing restaurant field | Validation error: required fields missing | High |
| FC-003 | Create Cluster with Invalid Minimum Basket | Authenticated user | 1. Call POST /api/food-clusters<br>2. Set negative minimumBasket | minimumBasket: -100 | Validation error: must be positive | Medium |
| FC-004 | Create Cluster without Authentication | None | 1. Call POST /api/food-clusters<br>2. No JWT token | Valid data, no token | 401 Unauthorized | Critical |

### 2.2 Join Food Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-005 | Join Open Cluster Successfully | Open cluster exists, user authenticated | 1. Call POST /api/food-clusters/:id/join<br>2. Provide order details | orderAmount: 150<br>items: [{name: "Pizza", quantity: 1}] | User added to members array, currentTotal updated | Critical |
| FC-006 | Join Cluster Already Joined | User is already a member | 1. Call POST /api/food-clusters/:id/join<br>2. Same user tries to join | Same user | Error: "Already a member of this cluster" | High |
| FC-007 | Join Full Cluster | Cluster at maxMembers | 1. Fill cluster to max<br>2. New user tries to join | maxMembers reached | Error: "Cluster is full" | Critical |
| FC-008 | Join Completed Cluster | Cluster status is "completed" | 1. Call POST /api/food-clusters/:id/join | Completed cluster | Error: "Cannot join, cluster is not open" | High |
| FC-009 | Join Cancelled Cluster | Cluster status is "cancelled" | 1. Call POST /api/food-clusters/:id/join | Cancelled cluster | Error: "Cannot join, cluster is cancelled" | High |

### 2.3 Leave Food Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-010 | Leave Cluster Successfully | User is a member | 1. Call POST /api/food-clusters/:id/leave | Valid cluster, member user | User removed, currentTotal updated | Critical |
| FC-011 | Creator Leaves Cluster (Cancel) | User is creator | 1. Creator calls POST /api/food-clusters/:id/leave | Creator user | Cluster cancelled or new creator assigned | High |
| FC-012 | Leave Cluster Not a Member | User not in cluster | 1. Call POST /api/food-clusters/:id/leave | Non-member user | Error: "Not a member of this cluster" | Medium |
| FC-013 | Leave After Ordering | Status is "ordered" | 1. Update cluster to "ordered"<br>2. Try to leave | Status: ordered | Error: "Cannot leave, order already placed" | High |

### 2.4 Update Order in Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-014 | Update Order Amount | User is a member | 1. Call PUT /api/food-clusters/:id/order<br>2. Provide new order amount | orderAmount: 200<br>items: updated list | Member order updated, currentTotal recalculated | High |
| FC-015 | Update Order Non-member | User not in cluster | 1. Call PUT /api/food-clusters/:id/order | Non-member | Error: "Not a member of this cluster" | Medium |
| FC-016 | Update Order After Ordering | Status past "open" | 1. Set status to "ordered"<br>2. Try to update order | Status: ordered | Error: "Cannot modify order, already placed" | High |

### 2.5 Cluster Status Management

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-017 | Update Status to Filled | Cluster is "open", minimum met | 1. Call PATCH /api/food-clusters/:id/status<br>2. Set status to "filled" | status: "filled" | Status updated, notifications sent | High |
| FC-018 | Update Status to Ordered | Status is "filled" | 1. Call PATCH /api/food-clusters/:id/status | status: "ordered" | Status updated, OTPs generated for members | Critical |
| FC-019 | Update to Ready for Collection | Status is "ordered" | 1. Call PATCH /api/food-clusters/:id/status | status: "ready" | Status updated, collection OTPs active | High |
| FC-020 | Update to Collecting | Status is "ready" | 1. Call PATCH /api/food-clusters/:id/status | status: "collecting" | Status updated, collection process started | High |
| FC-021 | Update to Completed | All members collected | 1. Call PATCH /api/food-clusters/:id/status | status: "completed" | Status updated, cluster finalized | Critical |
| FC-022 | Invalid Status Transition | Invalid sequence | 1. Try to skip status (open → completed) | status: "completed" | Error: "Invalid status transition" | High |
| FC-023 | Update Status by Non-creator | User is not creator | 1. Non-creator tries to update status | Non-creator user | Error: "Only creator can update status" | High |

### 2.6 OTP Verification for Collection

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-024 | Verify Collection OTP Successfully | Cluster in "collecting" status | 1. Call POST /api/food-clusters/:id/verify-otp<br>2. Provide valid OTP | otp: 123456 (valid) | Member marked as collected, hasCollected: true | Critical |
| FC-025 | Verify Wrong OTP | Cluster in "collecting" | 1. Provide wrong OTP | otp: 000000 | Error: "Invalid OTP" | Critical |
| FC-026 | Verify OTP Already Collected | Member already collected | 1. Member already hasCollected: true<br>2. Try OTP again | Already collected | Error: "Already collected" | Medium |
| FC-027 | All Members Collected | Last member verifies | 1. All members verify OTP | Last member | Cluster status auto-updates to "completed" | High |

### 2.7 Get Food Clusters

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| FC-028 | Get All Clusters | Clusters exist | 1. Call GET /api/food-clusters | No filters | List of all clusters returned | High |
| FC-029 | Get Clusters with Status Filter | Mixed status clusters | 1. Call GET /api/food-clusters?status=open | status: open | Only open clusters returned | High |
| FC-030 | Get User's Clusters | User is member of clusters | 1. Call GET /api/food-clusters/my | Authenticated user | Only clusters where user is member | High |
| FC-031 | Get Single Cluster Details | Cluster exists | 1. Call GET /api/food-clusters/:id | Valid cluster ID | Full cluster details with members | High |
| FC-032 | Get Non-existent Cluster | ID doesn't exist | 1. Call GET /api/food-clusters/:id | Invalid ID | 404 Not Found | Medium |

---

## 3. Ride Cluster Module Test Cases

### 3.1 Create Ride Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-001 | Create Valid Ride Cluster | Authenticated user | 1. Call POST /api/ride-clusters<br>2. Provide all required fields | title: "Office Commute"<br>startPoint: {...}<br>endPoint: {...}<br>seatsRequired: 4<br>totalFare: 400<br>departureTime: ISO date | Cluster created, farePerPerson calculated, creator added | Critical |
| RC-002 | Create Ride Missing Start Point | Authenticated user | 1. Call POST /api/ride-clusters<br>2. Missing startPoint | Missing startPoint | Validation error: startPoint required | High |
| RC-003 | Create Ride Missing End Point | Authenticated user | 1. Call POST /api/ride-clusters<br>2. Missing endPoint | Missing endPoint | Validation error: endPoint required | High |
| RC-004 | Create Female-Only Ride | Female user authenticated | 1. Call POST /api/ride-clusters<br>2. Set femaleOnly: true | femaleOnly: true<br>gender: female | Ride created with femaleOnly flag | Medium |
| RC-005 | Create Female-Only Ride by Male | Male user authenticated | 1. Male user tries to create femaleOnly ride | femaleOnly: true<br>gender: male | Error: "Only female users can create female-only rides" | High |

### 3.2 Join Ride Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-006 | Join Open Ride Successfully | Open ride with seats | 1. Call POST /api/ride-clusters/:id/join<br>2. Provide pickup point | pickupPoint: {coordinates, address} | User added, seatsAvailable decremented | Critical |
| RC-007 | Join Ride No Seats Available | Ride at capacity | 1. Fill ride to max<br>2. New user tries to join | seatsAvailable: 0 | Error: "No seats available" | Critical |
| RC-008 | Male Joins Female-Only Ride | femaleOnly: true | 1. Male user tries to join | gender: male | Error: "This ride is for female passengers only" | Critical |
| RC-009 | Female Joins Female-Only Ride | femaleOnly: true | 1. Female user joins | gender: female | User added successfully | High |
| RC-010 | Join Completed Ride | Status is "completed" | 1. Call POST /api/ride-clusters/:id/join | Completed ride | Error: "Cannot join, ride is not open" | High |

### 3.3 Leave Ride Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-011 | Leave Ride Successfully | User is a member | 1. Call POST /api/ride-clusters/:id/leave | Valid ride, member | User removed, seatsAvailable incremented | Critical |
| RC-012 | Leave Ride In Progress | Status is "in_progress" | 1. Ride started<br>2. Try to leave | Status: in_progress | Error: "Cannot leave, ride in progress" | High |
| RC-013 | Leave Ride Not a Member | User not in ride | 1. Call POST /api/ride-clusters/:id/leave | Non-member | Error: "Not a member of this ride" | Medium |

### 3.4 Update Pickup Point

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-014 | Update Pickup Point | User is a member | 1. Call PUT /api/ride-clusters/:id/pickup<br>2. Provide new pickup | pickupPoint: {new coordinates} | Pickup point updated | High |
| RC-015 | Update Pickup After Start | Status is "in_progress" | 1. Ride started<br>2. Try to update pickup | New pickup point | Error: "Cannot modify pickup, ride in progress" | High |

### 3.5 Ride Status Management

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-016 | Update Status to Filled | All seats taken | 1. Call PATCH /api/ride-clusters/:id/status | status: "filled" | Status updated | High |
| RC-017 | Update Status to In Progress | Status is "filled" | 1. Call PATCH /api/ride-clusters/:id/status | status: "in_progress" | Status updated, ride started | High |
| RC-018 | Update Status to Completed | Ride finished | 1. Call PATCH /api/ride-clusters/:id/status | status: "completed" | Status updated, ride finalized | High |
| RC-019 | Cancel Ride | Creator cancels | 1. Call POST /api/ride-clusters/:id/cancel | Creator user | Status: "cancelled", members notified | High |

### 3.6 Nearby Rides

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-020 | Get Nearby Rides | Rides exist in area | 1. Call GET /api/ride-clusters/nearby<br>2. Provide coordinates and radius | lat: 12.9716<br>lng: 77.5946<br>radius: 5km | List of rides within radius | High |
| RC-021 | No Rides in Area | No rides nearby | 1. Query remote location | lat: 0<br>lng: 0 | Empty array returned | Medium |
| RC-022 | Nearby with Vehicle Filter | Multiple vehicle types | 1. Query with vehicleType filter | vehicleType: "cab" | Only cab rides returned | Medium |

### 3.7 Fare Calculation

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RC-023 | Fare Per Person Calculation | Ride created | 1. Create ride with total fare and seats | totalFare: 400<br>seatsRequired: 4 | farePerPerson: 100 | Critical |
| RC-024 | Fare Recalculation on Join | Member joins | 1. Member joins<br>2. Check fare | New member | farePerPerson may recalculate based on actual members | High |
| RC-025 | Fare with Uneven Division | Odd total fare | 1. Create ride | totalFare: 350<br>seatsRequired: 4 | farePerPerson: 87.5 (rounded appropriately) | Medium |

---

## 4. AI Recommendation Engine Test Cases

### 4.1 Food Cluster Recommendations

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AI-001 | Get Recommendations for User | User with location & preferences | 1. Call GET /api/food-clusters/recommended | User location set<br>preferences: cuisines | Ranked list of recommended clusters | Critical |
| AI-002 | Distance Factor Scoring | Clusters at various distances | 1. Create clusters at 1km, 5km, 10km<br>2. Get recommendations | User at center | Closer clusters score higher (max 25 points) | High |
| AI-003 | Basket Progress Scoring | Clusters with different progress | 1. Create clusters at 20%, 50%, 80% basket<br>2. Get recommendations | Various currentTotal | Higher progress scores higher (max 20 points) | High |
| AI-004 | Member Count Scoring | Clusters with various members | 1. Create clusters with 1, 3, 5 members<br>2. Get recommendations | Various member counts | Optimal member count scores higher (max 15 points) | High |
| AI-005 | Preference Matching | User preferences set | 1. User has cuisine preferences<br>2. Get recommendations | cuisines: ["Indian"] | Matching restaurants ranked higher | High |
| AI-006 | Dietary Restrictions | User has restrictions | 1. User has vegetarian restriction<br>2. Get recommendations | dietaryRestrictions: ["vegetarian"] | Compatible clusters ranked higher | Medium |
| AI-007 | No Matching Clusters | No open clusters | 1. No clusters in range<br>2. Get recommendations | Empty database | Empty array or "No clusters found" message | Medium |

### 4.2 Suggested Cluster

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AI-008 | Get Single Best Suggestion | Multiple clusters exist | 1. Call GET /api/food-clusters/suggest | User with location | Single best cluster returned | High |
| AI-009 | Suggestion with Savings Estimate | Cluster with minimum basket | 1. Get suggestion<br>2. Check savings field | minimumBasket: 500<br>currentTotal: 300 | Estimated savings calculated | High |
| AI-010 | Suggestion Excludes User's Clusters | User already in some clusters | 1. User joins a cluster<br>2. Get suggestions | User is member | User's clusters not in suggestions | Medium |

### 4.3 AI Scoring Algorithm

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| AI-011 | Maximum Distance Score | Cluster at 0 distance | 1. Cluster at exact user location<br>2. Calculate score | distance: 0 | Distance score: 25 points | High |
| AI-012 | Zero Distance Score | Cluster beyond max range | 1. Cluster very far (> 20km)<br>2. Calculate score | distance: 25km | Distance score: 0 points | Medium |
| AI-013 | 100% Basket Score | Basket almost complete | 1. Cluster at 95% basket<br>2. Calculate score | progress: 95% | Basket score: ~20 points | High |
| AI-014 | Composite Score Accuracy | All factors present | 1. Create cluster with known values<br>2. Verify total score | Known distance, progress, members | Total = distance + basket + members + preferences | Critical |

---

## 5. Order Management Test Cases

### 5.1 Create Order

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| ORD-001 | Create Order in Cluster | User joined cluster | 1. Join cluster<br>2. Create order with items | items: [{name, quantity, price}]<br>totalAmount: 250 | Order created, linked to cluster | High |
| ORD-002 | Order with Special Instructions | Valid order data | 1. Create order with special instructions | items: [{..., specialInstructions: "No onions"}] | Instructions saved correctly | Medium |

### 5.2 Order Status Updates

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| ORD-003 | Status: Pending → Confirmed | Order exists | 1. Update status to confirmed | status: "confirmed" | Status updated | High |
| ORD-004 | Status: Confirmed → Preparing | Order confirmed | 1. Update status to preparing | status: "preparing" | Status updated | High |
| ORD-005 | Status: Preparing → Ready | Order being prepared | 1. Update status to ready | status: "ready" | Status updated | High |
| ORD-006 | Status: Ready → Delivered | Order ready | 1. Update status to delivered | status: "delivered" | Status updated, deliveredAt set | High |
| ORD-007 | Invalid Status Transition | Any status | 1. Try invalid transition (pending → delivered) | status: "delivered" | Error: "Invalid status transition" | High |

### 5.3 Order OTP Verification

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| ORD-008 | Generate Sender OTP | Order ready for delivery | 1. Generate OTP for sender | Order in "ready" status | senderOTP generated | Critical |
| ORD-009 | Generate Receiver OTP | Order ready for delivery | 1. Generate OTP for receiver | Order in "ready" status | receiverOTP generated | Critical |
| ORD-010 | Verify Sender OTP | OTP generated | 1. Verify sender OTP | Correct OTP | senderVerified: true | Critical |
| ORD-011 | Verify Receiver OTP | OTP generated | 1. Verify receiver OTP | Correct OTP | receiverVerified: true | Critical |
| ORD-012 | Both OTPs Verified | Both parties verify | 1. Verify sender OTP<br>2. Verify receiver OTP | Both correct | Order marked as delivered | Critical |

---

## 6. Real-time Communication Test Cases

### 6.1 Socket.io Connection

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RT-001 | Connect with Valid Token | Authenticated user | 1. Connect to Socket.io<br>2. Provide valid JWT | Valid token | Connection established | Critical |
| RT-002 | Connect without Token | None | 1. Connect without auth | No token | Connection rejected | Critical |
| RT-003 | Reconnect on Disconnect | Established connection | 1. Simulate disconnect<br>2. Auto-reconnect | - | Automatic reconnection | High |

### 6.2 Cluster Events

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RT-004 | Receive Join Notification | Connected to cluster room | 1. Another user joins cluster<br>2. Listen for event | New member joins | "member_joined" event received | High |
| RT-005 | Receive Leave Notification | Connected to cluster room | 1. Member leaves cluster<br>2. Listen for event | Member leaves | "member_left" event received | High |
| RT-006 | Receive Status Update | Connected to cluster room | 1. Creator updates status<br>2. Listen for event | Status changes | "status_updated" event received | High |
| RT-007 | Real-time Total Update | Connected to cluster room | 1. Member updates order<br>2. Listen for event | Order updated | "total_updated" event with new currentTotal | High |

### 6.3 Location Updates

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| RT-008 | Broadcast Location Update | In ride cluster | 1. User updates location<br>2. Listen for broadcast | New coordinates | Location update broadcast to ride members | High |
| RT-009 | Driver Location Tracking | Ride in progress | 1. Driver sends location updates<br>2. Passengers receive | Driver coordinates | Real-time driver position displayed | High |

---

## 7. Geospatial Features Test Cases

### 7.1 Distance Calculations

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| GEO-001 | Haversine Distance Accuracy | Known coordinates | 1. Calculate distance between two points | Point A: [77.5946, 12.9716]<br>Point B: [77.6946, 12.9816] | Distance within 1% of actual | High |
| GEO-002 | Same Point Distance | Identical coordinates | 1. Calculate distance | Same point | Distance: 0 km | Medium |
| GEO-003 | Long Distance Calculation | Points far apart | 1. Calculate between distant cities | Delhi to Mumbai | Distance approximately correct | Medium |

### 7.2 Nearby Search

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| GEO-004 | Find Clusters Within Radius | Clusters at various distances | 1. Query with 5km radius | center + radius | Only clusters within 5km returned | High |
| GEO-005 | Find Vendors Within Radius | Vendors at various locations | 1. Query nearby vendors | coordinates + radius | Vendors sorted by distance | High |
| GEO-006 | Empty Result for Remote Area | No entities nearby | 1. Query remote coordinates | Remote location | Empty array returned | Medium |

### 7.3 GeoJSON Handling

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| GEO-007 | Valid GeoJSON Point Storage | Valid coordinates | 1. Store location | type: "Point"<br>coordinates: [lng, lat] | Stored correctly with 2dsphere index | High |
| GEO-008 | Invalid Coordinates Rejection | Invalid coords | 1. Try to store invalid coords | coordinates: [181, 91] | Validation error | High |
| GEO-009 | Coordinates Order | Common mistake | 1. Verify longitude first, latitude second | [77.5946, 12.9716] | Correct GeoJSON format (lng, lat) | High |

### 7.4 Delivery Estimates

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| GEO-010 | Delivery Fee Calculation | Distance known | 1. Calculate delivery fee | distance: 5km<br>baseFee: 20<br>perKm: 5 | Fee: 20 + (5 * 5) = 45 | High |
| GEO-011 | Delivery Time Estimate | Distance known | 1. Estimate delivery time | distance: 10km<br>avgSpeed: 30km/h | Time: ~20 minutes | Medium |

---

## 8. API Security Test Cases

### 8.1 Authentication Security

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| SEC-001 | Password Not Returned in Response | User exists | 1. Get user profile<br>2. Check response | Any user request | Password field not in response | Critical |
| SEC-002 | Password Hashing Verification | Registration | 1. Register user<br>2. Check DB directly | password: "Test@123" | Password stored as bcrypt hash | Critical |
| SEC-003 | SQL/NoSQL Injection Prevention | Login endpoint | 1. Attempt injection in email field | email: {"$gt": ""} | Request rejected, no data leak | Critical |
| SEC-004 | XSS Prevention in User Input | Profile update | 1. Submit XSS payload in name | name: "<script>alert('xss')</script>" | Sanitized or escaped in output | Critical |

### 8.2 Authorization Security

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| SEC-005 | User Cannot Access Other's Data | Two users exist | 1. User A tries to access User B's orders | Wrong user ID | 403 Forbidden or 404 | Critical |
| SEC-006 | Admin-Only Endpoints | Regular user | 1. Access admin endpoint<br>2. Use regular user token | role: "user" | 403 Forbidden | Critical |
| SEC-007 | Vendor-Only Endpoints | Regular user | 1. Access vendor endpoint<br>2. Use user token | role: "user" | 403 Forbidden | High |
| SEC-008 | Role Escalation Prevention | Regular user | 1. Try to set role in profile update | role: "admin" | Role not updated, ignored | Critical |

### 8.3 Rate Limiting

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| SEC-009 | API Rate Limit Enforcement | None | 1. Send 101 requests in 15 minutes | Rapid requests | 429 Too Many Requests after 100 | High |
| SEC-010 | OTP Rate Limiting | None | 1. Request OTP multiple times | Rapid OTP requests | Rate limited after threshold | High |
| SEC-011 | Login Attempt Limiting | Failed logins | 1. Fail login 10 times<br>2. Try again | Wrong password | Account locked or delayed response | High |

### 8.4 Data Validation

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| SEC-012 | Email Format Validation | None | 1. Submit invalid email format | email: "not-an-email" | Validation error | High |
| SEC-013 | Phone Format Validation | None | 1. Submit invalid phone | phone: "abc123" | Validation error | High |
| SEC-014 | Required Fields Validation | None | 1. Submit with missing required fields | Missing fields | Clear error messages for each | High |
| SEC-015 | Maximum Length Enforcement | None | 1. Submit extremely long string | name: "A" * 10000 | Validation error or truncation | Medium |

### 8.5 Token Security

| TC ID | Test Case Name | Pre-conditions | Test Steps | Test Data | Expected Result | Priority |
|-------|---------------|----------------|------------|-----------|-----------------|----------|
| SEC-016 | Token Expiration Enforced | Expired token | 1. Use token after expiration | Expired JWT | 401 Unauthorized | Critical |
| SEC-017 | Token Signature Validation | Modified token | 1. Modify token payload<br>2. Keep same signature | Tampered JWT | 401 Invalid token | Critical |
| SEC-018 | Token Algorithm Verification | None algorithm | 1. Try JWT with alg: "none" | alg: "none" | Rejected | Critical |
| SEC-019 | Secure Token Storage Check | Frontend | 1. Verify token storage location | - | Token in httpOnly cookie or secure storage | High |

---

## Test Case Summary

| Module | Total Test Cases | Critical | High | Medium | Low |
|--------|-----------------|----------|------|--------|-----|
| Authentication | 24 | 10 | 10 | 4 | 0 |
| Food Clusters | 32 | 8 | 18 | 6 | 0 |
| Ride Clusters | 25 | 5 | 15 | 5 | 0 |
| AI Recommendations | 14 | 2 | 9 | 3 | 0 |
| Order Management | 12 | 5 | 7 | 0 | 0 |
| Real-time Communication | 9 | 2 | 7 | 0 | 0 |
| Geospatial Features | 11 | 0 | 8 | 3 | 0 |
| API Security | 19 | 11 | 6 | 2 | 0 |
| **TOTAL** | **146** | **43** | **80** | **23** | **0** |

---

*End of Test Cases Document*
