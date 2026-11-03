# PanelSphere - Frontend Project Context

## Overview
**PanelSphere** Next.js 15 App Router frontend application.

## Core Responsibilities
- Communicates exclusively via REST API (`/api/v1`) with `hh-recruitment-backend`.
- Role-based navigation and protected routes: Admin, Panel Manager, Call Center Agent, Field Executive.
- Enterprise data tables with pagination, search, status filters, and sorting.
- Client and server-side form validations using React Hook Form + Zod.
- Dedicated UI modules:
  - Household Recruitment Information Uploader (CSV upload, preview, row-level validation errors, and confirmation).
  - Call Center workflow with questionnaire capture.
  - Appointment scheduling with field-executive assignment and rescheduling modals.
  - Field executive visit logging for TV meter installations.
  - Permanent household rejection and candidate replacement matching interface.
  - Executive reporting and interactive dashboards using Recharts.

