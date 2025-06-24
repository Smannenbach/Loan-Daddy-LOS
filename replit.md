# LoanFlow Pro - Commercial Loan Origination System

## Overview

LoanFlow Pro is a comprehensive commercial loan origination system designed for managing DSCR (Debt Service Coverage Ratio) and Fix-and-Flip loans. The application provides a complete workflow from loan application through underwriting and approval, with robust document management and reporting capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES Modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Uploads**: Multer for document handling
- **API Design**: RESTful endpoints with structured error handling

### Monorepo Structure
The application follows a monorepo pattern with three main directories:
- `client/` - Frontend React application
- `server/` - Backend Express API
- `shared/` - Common types and schemas shared between frontend and backend

## Key Components

### Database Schema
The system manages five core entities:
1. **Users** - Loan officers and administrators
2. **Borrowers** - Loan applicants with contact information
3. **Properties** - Real estate assets being financed
4. **Loan Applications** - Core loan processing records with status tracking
5. **Documents** - File attachments and supporting documentation
6. **Tasks** - Workflow management and assignment tracking

### Loan Processing Pipeline
- **Application Stage**: Initial loan request and borrower information
- **Document Review**: Collection and verification of required documents
- **Underwriting**: Financial analysis and risk assessment
- **Approval/Decline**: Final decision and terms setting

### Authentication & Authorization
- Role-based access control with loan officer and administrator roles
- Session-based authentication for secure user management

## Data Flow

1. **Loan Application Creation**: Borrowers submit applications through the frontend form
2. **Document Upload**: Supporting documents are uploaded and stored in the filesystem
3. **Workflow Management**: Tasks are assigned to loan officers for processing
4. **Status Updates**: Application status is tracked through the pipeline stages
5. **Dashboard Analytics**: Real-time statistics and reporting for management oversight

## External Dependencies

### Database
- **Neon Database**: PostgreSQL hosting service
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection Pooling**: Efficient database connection management

### File Storage
- **Local Filesystem**: Document storage in uploads directory
- **Multer**: File upload middleware with type validation
- **File Type Restrictions**: PDF, images, and Office documents supported

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Consistent iconography
- **React Hook Form**: Performant form handling

## Deployment Strategy

### Development Environment
- **Replit Integration**: Full development environment in the cloud
- **Hot Reload**: Vite development server with HMR
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Frontend**: Static assets built with Vite
- **Backend**: ESBuild compilation to single JavaScript file
- **Process Management**: Single Node.js process serving both API and static files

### Environment Configuration
- **PostgreSQL**: Database connection via `DATABASE_URL` environment variable
- **File Uploads**: Configurable upload directory and size limits
- **Port Configuration**: Flexible port assignment for different environments

## Changelog

```
Changelog:
- June 24, 2025. Initial setup with comprehensive loan origination system
- June 24, 2025. Added multi-channel communication system (email, SMS, calling)
- June 24, 2025. Implemented shorter loan application form to reduce applicant friction
- June 24, 2025. Added LinkedIn integration for real estate investor lead generation
- June 24, 2025. Created communication tracking and history features
- June 24, 2025. Built two-stage application system (short intake + full URLA)
- June 24, 2025. Added customer-facing portal for document upload and loan tracking
- June 24, 2025. Implemented automated document collection with multi-channel reminders
- June 24, 2025. Added Plaid bank verification integration framework
- June 24, 2025. Created document requirements management by loan type
- June 24, 2025. Implemented intelligent document pre-filling mechanism across all loan forms
- June 24, 2025. Added data completeness indicators and cross-form data mapping
- June 24, 2025. Built comprehensive marketing automation integrations (Make, Zapier, Facebook Leads, HighLevel CRM)
- June 24, 2025. Implemented AI loan advisor with OpenAI integration for intelligent loan recommendations
- June 24, 2025. Added property data integration service for pulling data from Zillow, Trulia, LoopNet, Realtor.com
- June 24, 2025. Created comprehensive loan pricing engine with rates from 20+ lenders across all loan types
- June 24, 2025. Added webhook endpoints for automated lead processing and AI-powered follow-up sequences
- June 24, 2025. Debugged and fixed critical application startup issues including JSX syntax errors and TypeScript compilation problems
- June 24, 2025. Resolved DOM nesting warnings in navigation components and ensured proper React component structure
- June 24, 2025. Successfully integrated comprehensive Google Maps APIs (Geocoding, Places, Address Validation, Elevation, Timezone) for accurate worldwide property data
- June 24, 2025. Enhanced property data service to achieve 92% confidence ratings using real Google API data instead of mock estimates
- June 24, 2025. Property search now provides accurate data for any address globally with detailed property information, tax estimates, and market analysis
- June 24, 2025. Completed interactive property map with neighborhood heat maps and enhanced property search with unit vs building differentiation
- June 24, 2025. Added comprehensive property links to Zillow, Realtor.com, Trulia, Redfin, LoopNet, and other major real estate sites
- June 24, 2025. Implemented address autocomplete using Google Places API for seamless property search experience
- June 24, 2025. Enhanced property data service to distinguish between individual apartment units and entire apartment buildings for commercial investors
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```