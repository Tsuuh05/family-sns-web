# Project TODO

## Database Schema
- [x] Create families table
- [x] Create invite_codes table with family_id
- [x] Update users table to include family_id and full_name
- [x] Create posts table with family_id
- [x] Create comments table

## Backend (tRPC Procedures)
- [x] Implement invite code validation
- [x] Implement user signup with invite code
- [x] Implement user profile management
- [x] Implement family management procedures
- [x] Implement post CRUD operations with family filtering
- [x] Implement comment CRUD operations

## Frontend UI
- [x] Create authentication page (signup/login with invite code)
- [x] Create home page with family posts feed
- [x] Create post creation form
- [x] Create post detail page with comments
- [x] Create comment form and list
- [x] Add responsive design for mobile

## Privacy & SEO
- [x] Add robots.txt to prevent search indexing
- [x] Add meta tags with noindex
- [x] Configure Vercel deployment settings

## Bug Fixes
- [x] Fix React setState error in Home.tsx (navigation during render)

## Render.com Deployment
- [x] Create render.yaml configuration
- [x] Create Render.com deployment guide
- [x] Configure environment variables for Render.com
- [x] Fix build command syntax error (remove extra backtick)

## Supabase Auth Migration (Replace Manus OAuth)
- [x] Install @supabase/supabase-js package
- [x] Remove Manus OAuth dependencies
- [x] Create Supabase Auth configuration (supabaseClient.ts)
- [x] Implement backend authentication with Supabase (supabaseAuth.ts)
- [x] Update context.ts to use Supabase auth service
- [x] Update routers.ts with Supabase Auth procedures (signUp, signIn, logout)
- [x] Update frontend Auth.tsx to use Supabase Auth
- [x] Update db.ts to include author information in queries
- [x] Fix null checks for author fields in UI components
- [x] Add Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)
- [x] Update render.yaml with Supabase environment variables
- [x] Update deployment guide with Supabase Auth instructions
- [x] Test authentication flow

## Pending Features
- [ ] Image upload functionality (Supabase Storage)
- [ ] Like/reaction system for posts
- [ ] User profile editing
- [ ] Push notifications
- [ ] Search functionality
- [ ] Post editing and deletion UI
- [ ] Comment editing and deletion UI
- [ ] User avatar upload
- [ ] Family member management UI

## Render.com Deployment Bug Fix

- [x] Fix frontend Supabase client environment variable loading (Invalid URL error)
- [ ] Update client-side Supabase initialization to properly read VITE_ prefixed env vars
- [ ] Test and verify fix on Render.com

## Critical Frontend Bug

- [x] Fix Invalid URL error in frontend Supabase initialization
- [ ] Ensure VITE environment variables are properly loaded during build
- [ ] Remove any frontend Supabase client initialization if not needed

## Invite Code Validation Bug

- [x] Fix validateInviteCode to use publicProcedure (currently requires authentication)
- [ ] Migrate from MySQL to PostgreSQL for Supabase compatibility
