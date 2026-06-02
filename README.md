# AI-Powered Job Portal Platform

## Overview
This project is a modern, scalable Job Portal platform built using a microservices architecture. It provides a robust ecosystem for both **recruiters** (to manage companies and job postings) and **jobseekers** (to apply for jobs, manage their profiles, and get AI-driven career insights). It leverages an event-driven design to ensure decoupled and efficient background processing.

## Tech Stack
**Frontend:**
- **Framework**: Next.js 15+ (React 19)
- **Styling & UI**: Tailwind CSS, Radix UI, Shadcn UI
- **Icons**: Lucide React

**Backend (Microservices):**
- **Runtime**: Node.js with Express and TypeScript
- **Database**: Neon Postgres (Serverless PostgreSQL)
- **Caching**: Redis
- **Message Broker**: Kafka (via KafkaJS) for event-driven asynchronous communication
- **File Storage**: Cloudinary (for profile pictures, company logos, and resumes) with Multer

**AI & Third-Party Integrations:**
- **AI Capabilities**: Google Gemini GenAI (`@google/genai`) for parsing resumes and providing career advice.
- **Email**: Nodemailer (Triggered via Kafka events)

## Microservices Architecture

The backend is strictly divided into four distinct microservices, ensuring modularity and independent scalability:

1. **Auth Service**: Handles user registration, authentication, JWT generation, and role assignments (Jobseeker vs. Recruiter). Connects to Redis and Neon DB.
2. **Job Service**: Responsible for the employer side of the platform. Manages company profiles and job postings.
3. **User Service**: Handles the candidate side of the platform. Manages user profiles, skills, profile picture/resume updates, and job applications.
4. **Utils Service**: A utility/worker service handling:
    - **AI Resume Analyzer**: Extracts text from uploaded PDFs and communicates with Gemini to provide an ATS compatibility score and feedback.
    - **AI Career Advisor**: Takes a user's skills and suggests learning paths and job roles via Gemini.
    - **File Uploads**: Interfaces with Cloudinary.
    - **Email Worker**: Runs a Kafka consumer listening to the `send-mail` topic to dispatch background emails asynchronously.

---

## Data Diagram

```mermaid
erDiagram
    USERS {
        int user_id PK
        string name
        string email
        string password
        string phone_number
        enum role "jobseeker, recruiter"
        string bio
        string resume
        string profile_pic
        datetime created_at
    }
    
    SKILLS {
        int skill_id PK
        string name
    }
    
    USER_SKILLS {
        int user_id FK
        int skill_id FK
    }

    COMPANIES {
        int company_id PK
        string name
        string description
        string website
        string logo
        int recruiter_id FK "References Users"
        datetime created_at
    }

    JOBS {
        int job_id PK
        string title
        string description
        numeric salary
        string location
        enum job_type "Full-time, Part-time, Contract, Internship"
        numeric openings
        string role
        enum work_location "On-site, Remote, Hybrid"
        int company_id FK
        int posted_by_recuriter_id FK "References Users"
        boolean is_active
        datetime created_at
    }

    APPLICATIONS {
        int application_id PK
        int job_id FK
        int applicant_id FK "References Users"
        string applicant_email
        enum status "Submitted, Rejected, Hired"
        string resume
        datetime applied_at
    }

    USERS ||--o{ USER_SKILLS : has
    SKILLS ||--o{ USER_SKILLS : assigned_to
    USERS ||--o{ COMPANIES : "creates (Recruiter)"
    COMPANIES ||--o{ JOBS : posts
    USERS ||--o{ JOBS : "posts (Recruiter)"
    USERS ||--o{ APPLICATIONS : "applies (Jobseeker)"
    JOBS ||--o{ APPLICATIONS : receives
```

---

## Core Workflows

### 1. User Registration & Auth Flow
```mermaid
sequenceDiagram
    participant Client
    participant Auth_Service as Auth Service
    participant DB as Neon DB
    participant Redis
    
    Client->>Auth_Service: POST /register
    Auth_Service->>DB: Create User Record
    Auth_Service->>Client: Returns JWT Token
    Client->>Auth_Service: POST /login
    Auth_Service->>DB: Verify Credentials
    Auth_Service->>Redis: Cache Session (Optional)
    Auth_Service->>Client: Returns JWT Token
```

### 2. Job Application & Event-Driven Email Flow
```mermaid
sequenceDiagram
    participant Jobseeker as Client (Jobseeker)
    participant User_Service as User Service
    participant DB as Neon DB
    participant Kafka
    participant Utils_Service as Utils (Mail Consumer)
    
    Jobseeker->>User_Service: POST /apply/job
    User_Service->>DB: Create Application Record
    User_Service->>Kafka: Publish "send-mail" Event
    User_Service->>Jobseeker: 200 OK (Application Success)
    
    %% Asynchronous Background Process
    Kafka->>Utils_Service: Consume "send-mail" Event
    Utils_Service->>Jobseeker: Send Confirmation Email (Nodemailer)
```

### 3. AI Resume Analysis Flow
```mermaid
sequenceDiagram
    participant Jobseeker as Client
    participant Utils_Service as Utils Service
    participant Gemini as Google Gemini AI
    
    Jobseeker->>Utils_Service: POST /resume-analyser (PDF Base64)
    Utils_Service->>Gemini: Prompt + PDF Data
    Gemini->>Utils_Service: Returns ATS Score & JSON Feedback
    Utils_Service->>Jobseeker: Display Score and Suggestions
```
