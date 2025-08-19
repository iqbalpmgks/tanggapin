# Product Requirements Document (PRD)

## 1. Project Title

Tanggapin – Auto Reply Instagram for SMEs & Creators

## 2. Purpose & Background

Tanggapin is a web-based application designed to help SMEs and content creators automatically respond to comments and direct messages (DMs) on Instagram. A common issue often encountered is the difficulty of replying to a large number of messages, especially during product or service promotions. This application uses keyword detection to generate automatic DM reply options and efficiently direct potential buyers to the correct product link.

## 3. Scope

- Supports Instagram only (MVP version)
- Automatic reply to public comments & DMs based on keywords
- Customizable reply text for flexibility
- Two main modules: Dashboard for automation usage reporting, and quick automation interface (Instagram)
- Excludes: WhatsApp, TikTok, Facebook, AI-based replies

## 4. Assumptions

- Instagram Business Account linked to Facebook Page
- Developer has access to Meta Developer & API
- Access token is stored securely
- Instagram content accessible in real-time
- Replies consist of text and links only

## 5. Constraints

- Cannot send DMs to private accounts that are not followed
- Instagram API only supports business/creator accounts
- Instagram API limits
- Certain events not tracked (e.g., story mentions)
- Keyword detection not 100% accurate
- Only one Instagram account supported (no multi-account yet)

## 6. Target Audience

- SMEs and small brands
- Content creators with high engagement
- Social media admins for online stores/communities

## 7. Goals & Success Criteria

- System can respond to 90% of comments and DMs within <5 seconds
- Auto-DM and fallback run automatically
- Dashboard with logs, statistics, and weekly reports
- Onboarding <5 minutes for non-technical users

## 8. Features

### 8a. MVP Features (by Module)

#### A. Authentication & Dashboard

Access management and main user activity display.

A1. Login Only

- A1.1 Only registered users (email & password) can log in.
- A1.2 No self-registration feature (admin registers users).

A2. Dashboard Inbox

- A2.1 Displays a list of incoming comments and DMs.
- A2.2 Status of each reply: successful, failed, or fallback.
- A2.3 Search by date, status, or keyword.

#### B. Instagram API Integration

Integration with Instagram account to fetch comment and DM data.

B1. Selected Post Automation

- B1.1 Users can select posts (feed/reels) to connect to the auto-reply system.
- B1.2 Comments from unselected posts will be ignored.

#### C. Reply Settings

Settings for comment and DM replies based on keywords and fallback logic.

C1. Reply Mode per Post

- C1.1 Choose to reply only to comments, only to DMs, or both.
- C1.2 Can be reconfigured per post.

C2. Keyword Input & Preset Replies

- C2.1 List of keywords that trigger auto-reply.
- C2.2 Preset reply in the form of text, promotional link, CTA.
- C2.3 Supports synonyms/alternative spelling.

C3. Configurable DM Replies

- C3.1 Static DM replies linked to each post.
- C3.2 Supports links & product names.

C4. Fallback Message Settings

- C4.1 Fallback comment if DM fails (e.g., private account).
- C4.2 Short format + short link.

#### D. Monitoring & Reporting

Tracking system performance for automatic replies.

D1. Reply Status Overview

- D1.1 Classification of replies: success, failure, fallback.

D2. Reply History Log

- D2.1 History of all comments, DMs, response times, status.

D3. Performance Report Dashboard

- D3.1 Statistics on top keywords, DM frequency, average response time.
- D3.2 Filter view: daily, weekly, monthly, total.

### 8b. Post-MVP Features (Optional)

#### A. Scheduling & Advanced Controls

A1. Auto-Reply Scheduling

- A1.1 Set system active hours (e.g., business hours 09:00–17:00).
- A1.2 Automatically deactivate outside hours.

A2. Multi-Admin Support

- A2.1 Admin can invite other users to co-manage.
- A2.2 Different roles & permissions (viewer/editor/admin).

#### B. Personalization & Branding

B1. Custom Reply Tone

- B1.1 Choice of tone: formal, casual, friendly, humorous.
- B1.2 Different templates depending on product/event.

B2. Auto-Tagging Followers

- B2.1 Classify followers by comment topics.
- B2.2 Save labels for retargeting/follow-up promotions.

#### C. Channel Expansion

C1. WhatsApp Cloud API Integration

- C1.1 Keyword/AI-based auto-reply to WhatsApp chats.
- C1.2 Similar fallback and reporting support.

C2. TikTok & Telegram Integration

- C2.1 Support new channels with similar concept.
- C2.2 Adapt auto-reply to TikTok video comments or Telegram group messages.

## 9. User Flow

1. Log in to the application
2. Add Instagram account
3. Select posts for auto-reply
4. Enter keywords & preset replies
5. Activate auto-reply
6. System detects comments & replies
7. System sends DM if relevant
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

- Response <5 seconds from comment/DM received
- Handle >1000 requests/day

### 10c. Scalability

- Modular structure for channel expansion
- Database optimized for large-scale logs

### 10d. Security

- Login using JWT
- Encrypted token storage
- Input validation against injection attacks

### 10e. Usability

- Simple & mobile-friendly dashboard
- Onboarding wizard at first login
- "Test Reply" button for simulation

### 10f. Availability

- Target 99% uptime for production
- Fallback logic applied if API fails

## 11. Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| DM to private account fails | Fallback comment with short link |
| Token expired/invalid | Refresh token & notify user |
| User confusion | Walkthrough & help tooltips |
| API quota limit | Implement queue & auto-throttle |

## 12. Timeline (4 Weeks)

| Week | Activity |
|------|----------|
| 1 | Project setup, UI/UX, Instagram API setup (dev mode) |
| 2 | Development: reply engine & dashboard logging |
| 3 | Auto-DM integration & fallback logic |
| 4 | Testing, reporting, onboarding, MVP deployment |

## 13. Appendix

- Instagram Graph API documentation
- Meta App Dev Mode: only verified users can test
- Fallback logic: public comment with short link if DM fails
- Ngrok guide: expose localhost to public during development

[Reference Link](https://developers.facebook.com/docs/instagram-api)
