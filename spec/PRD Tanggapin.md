# Product Requirements Document (PRD)

## 1. Project Title

Tanggapin – Auto Reply Instagram for MSMEs & Creators

## 2. Purpose & Background

Tanggapin is a web-based application designed to help MSMEs and content creators automatically respond to comments and direct messages (DMs) on Instagram. A common issue encountered is the difficulty in responding to a large volume of messages, especially during product or service promotions. This app uses keyword detection to automatically generate direct message (DM) reply options and efficiently direct potential buyers to the appropriate product link.

## 3. Scope

- Supports Instagram only (MVP version)
- Automatic replies to public comments & DMs based on keywords
- Reply text can be customized for flexibility
- Two main modules: Dashboard for automation usage reporting, and quick automation interface (Instagram)
- Excludes: WhatsApp, TikTok, Facebook, AI-based replies

## 4. Assumptions

- Instagram Business account connected to Facebook Page
- Developer has access to Meta Developer & API
- Access tokens are securely stored
- Instagram content is accessible in real-time
- Replies consist of text and links only

## 5. Constraints

- Cannot send DMs to private accounts that are not followed
- Instagram API only supports business/creator accounts
- Instagram API limits
- Certain events not tracked (e.g., story mention)
- Keyword detection is not 100% accurate
- Only one Instagram account (multi-account not yet supported)

## 6. Target Audience

- MSMEs and small brands
- Content creators with high interaction
- Social media admins for online stores / communities

## 7. Goals & Success Criteria

- System can respond to 90% of comments and DMs within < 5 seconds
- Auto-DM and fallback run automatically
- Dashboard with logs, statistics, and weekly reports
- Onboarding < 5 minutes for non-technical users

## 8. Features

### 8a. MVP Features (by Module)

#### A. Authentication & Dashboard

Access management and main user activity display.

A1. Login Only

- A1.1 Only registered users (email & password) can log in.
- A1.2 No self-registration feature (admin will register users).

A2. Dashboard Inbox

- A2.1 Displays list of incoming comments and DMs.
- A2.2 Each reply status: successful, failed, or fallback.
- A2.3 Search by date, status, or keyword.

#### B. Instagram API Integration

Integration with Instagram account to fetch comment and DM data.

B1. Selected Post Automation

- B1.1 Users can select posts (feed/reels) to connect to the auto-reply system.
- B1.2 Comments from unselected posts will be ignored.

#### C. Reply Settings

Reply settings for comments and DMs based on keywords and fallback logic.

C1. Reply Mode per Post

- C1.1 Choose reply to comments only, DMs only, or both.
- C1.2 Can be reset per post.

C2. Keyword Input & Preset Replies

- C2.1 List of keywords that trigger auto-reply.
- C2.2 Preset reply in the form of text, promo links, CTAs.
- C2.3 Supports synonyms/alternative spelling.

C3. Configurable DM Replies

- C3.1 Static DM replies linked to each post.
- C3.2 Supports product links & names.

C4. Fallback Message Settings

- C4.1 Fallback comment if DM fails (e.g., private account).
- C4.2 Short format + short link.

#### D. Monitoring & Reporting

Tracking system performance for automatic replies.

D1. Reply Status Overview

- D1.1 Reply classification: success, failed, fallback.

D2. Reply History Log

- D2.1 History of all comments, DMs, response times, status.

D3. Performance Report Dashboard

- D3.1 Statistics of top keywords, DM frequency, average response time.
- D3.2 Filter view: daily, weekly, monthly, total.

### 8b. Post-MVP Features (Optional)

#### A. Scheduling & Advanced Controls

A1. Auto-Reply Scheduling

- A1.1 Set active reply system time (e.g., working hours 09.00–17.00).
- A1.2 Automatically inactive outside the hours.

A2. Multi-Admin Support

- A2.1 Admin can invite other users to co-manage.
- A2.2 Different roles & permissions (viewer/editor/admin).

#### B. Personalization & Branding

B1. Custom Reply Tone

- B1.1 Language style options: formal, casual, friendly, funny.
- B1.2 Different templates depending on product/event.

B2. Auto-Tagging Followers

- B2.1 Classify followers based on comment topics.
- B2.2 Save labels for retargeting/follow-up promotions.

#### C. Channel Expansion

C1. WhatsApp Cloud API Integration

- C1.1 Keyword/AI-based auto-reply to WhatsApp chats.
- C1.2 Similar fallback and reporting support.

C2. TikTok & Telegram Integration

- C2.1 Support for new channels with similar concepts.
- C2.2 Adapt auto-reply on TikTok video comments or Telegram group messages.

#### D. Admin Panel (Internal Use)

D1. User Management

- D1.1 Superadmin can create, deactivate, or reset user accounts.
- D1.2 Monitor number of active users and account status.

D2. Global Monitoring & Logs

- D2.1 Access global system logs (errors, API usage).
- D2.2 Audit logs for user complaint investigation.

D3. Configuration Management

- D3.1 Update global API tokens or integration configurations.
- D3.2 Maintenance message settings.

## 9. User Flow

1. Log in to the app
2. Add Instagram account
3. Select post for auto-reply
4. Enter keywords & preset replies
5. Activate auto-reply
6. System detects comments & replies
7. System sends DM if comment is relevant
8. If DM fails → fallback comment
9. Activity appears in dashboard & reports

## 10. Technical & Non-Functional Requirements

### 10a. Technology Stack

- Frontend: React.js (Vite) + Tailwind CSS
- Backend: Node.js (Express)
- Database: MongoDB (local)
- Authentication: JWT-based login
- API: Instagram Graph API
- Localhost Exposure: Ngrok

### 10b. Performance

- Response <5 seconds since comment/DM received
- Can handle >1000 requests/day

### 10c. Scalability

- Modular structure for channel expansion
- Database optimized for large-scale logs

### 10d. Security

- Login using JWT
- Encrypted token storage
- Input validation from injection attacks

### 10e. Usability

- Simple & mobile-friendly dashboard
- Onboarding wizard on first login
- "Test Reply" button for simulation

### 10f. Availability

- Target 99% uptime for production
- Fallback logic applied if API fails

## 11. Risks and Mitigation

| Risk                          | Mitigation                                 |
|------------------------------|---------------------------------------------|
| DM to private account fails  | Fallback comment with short link            |
| Token expired/invalid        | Refresh token & user notification           |
| User confusion               | Walkthrough & help tooltips                 |
| API quota limits             | Queue implementation & auto-throttle        |

## 12. Timeline (4 Weeks)

| Week | Activity                                               |
|------|--------------------------------------------------------|
| 1    | Project setup, UI/UX, Instagram API setup (dev mode)   |
| 2    | Development: reply engine & dashboard logging          |
| 3    | Auto-DM integration & fallback logic                   |
| 4    | Testing, reporting, onboarding, MVP deployment         |

## 13. Monetization Model

#### A. Pricing Tier Plan (Freemium)

| Plan     | Target                     | Estimated Price           | Suitable For                        |
|----------|----------------------------|----------------------------|--------------------------------------|
| FREE     | Beginner Creator           | Rp0                        | Try basic features                   |
| PRO      | Active MSME / Serious Creator | Rp99.000 – 149.000/month | Intensive use, many comments        |
| BUSINESS | Small brands, agencies     | Rp249.000 – 499.000/month | Multi admin, high volume            |

#### B. Feature Comparison

| Feature                    | FREE      | PRO       | BUSINESS  |
|---------------------------|-----------|-----------|-----------|
| Auto-reply comments/day   | 20        | 300       | 1000+     |
| AI-generated reply        | Limited (5/day) | Unlimited | Unlimited |
| DM auto-link              | ✓         | ✓         | ✓         |
| Custom keyword reply      | Max. 5    | Unlimited | Unlimited |
| Auto-reply for promo posts| ✓         | ✓         | ✓         |
| Dashboard report          | ✓         | ✓         | ✓         |
| Advanced analytics        |           | ✓         | ✓         |
| DM fallback               |           | ✓         | ✓         |
| WhatsApp reply            |           | ✓         | ✓         |
| Multi admin / account     |           |           | ✓         |
| Priority support          |           |           | ✓         |

#### C. Trial Strategy

- Free PRO trial for 7–14 days
- Afterwards, auto downgrade to FREE if not upgraded
- Upsell popup when features are limited:
> “Oops! You've replied to 20 comments today. Upgrade to PRO so you don't lose customers.”

## 14. Appendix

- Instagram Graph API documentation
- Meta App Dev Mode: only verified users can test
- Fallback Logic: public comment with short link if DM fails
- Ngrok Guide: expose localhost to public during dev

[Reference Link](https://developers.facebook.com/docs/instagram-api)

