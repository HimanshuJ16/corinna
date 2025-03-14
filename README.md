<img src="/public/images/logo.png" alt="logo" width="300" height="150">

# corinna-ai

## Introduction

corinna-ai
An AI-powered chatbot designed to enhance customer engagement by providing customizable interactions. Corinna-AI leverages advanced natural language processing (NLP) to understand user queries and respond intelligently. It allows business owners to personalize the chatbot's functionality, including custom greetings, email collection, and direct chat redirection for a tailored user experience.

## Getting Started

To get started with corinna-ai, follow these steps:

## Clone the Repository

```bash
git@github.com:Maheshwarreddy970/corinna-ai.git
```

```bash
cd corinna-ai
```

## Environment Variables

Before running the application, set up the environment variables. Rename `.env.example to .env ` and set your own variables.

```bash
mv .env.example .env
nano .env  # (or use any text editor to modify .env)
```

### .env.example

Here is an example of the environment variables needed for the project. Replace the placeholder values with your actual credentials.

```bash
# NodeMailer Configuration
NODE_MAILER_EMAIL=your_email@gmail.com
NODE_MAILER_GMAIL_APP_PASSWORD=your_gmail_app_password

# Pusher Configuration
NEXT_PUBLIC_PUSHER_APP_CLUSTOR=your_app_cluster
NEXT_PUBLIC_PUSHER_APP_SECRET=your_app_secret
NEXT_PUBLIC_PUSHER_APP_KEY=your_app_key
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id

# OpenAI Configuration
OPEN_AI_KEY=your_openai_key

# UploadCare Configuration
NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY=your_uploadcare_public_key
UPLOAD_CARE_SECRET_KEY=your_uploadcare_secret_key

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up

# Stripe Configuration
STRIPE_SECRET=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISH_KEY=your_stripe_publish_key

# Prisma Configuration
DATABASE_URL='your_database_url'


```

Make sure to fill in the necessary environment variables in the .env file.

## Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This will run the application in development mode.

Navigate to http://localhost:3000 to view the application.

## Chatdocrepo File Structure

ChatDoc uses a monorepo setup managed by Turborepo and includes a Next.js application. Below is an overview of the file structure:

````bash
# corinna-ai

corinna-ai is a cutting-edge web application designed to provide seamless user experiences with robust backend support. This repository houses the core of corinna-ai, including its frontend, backend, and associated configurations.

## Project Structure

Below is the structure of the main folders and files:

```plaintext
corinna-ai/
│
├── prisma/                         # Prisma ORM setup and schema files
├── public/                         # Public assets (images, fonts, etc.)
├── src/                            # Source code for the application
│   ├── actions/                    # Actions and logic for interacting with services
│   ├── app/                        # Main application folder, including pages and routes
│   ├── components/                 # Reusable UI components
│   ├── constants/                  # Application constants and configurations
│   ├── context/                    # React context for global state management
│   ├── hooks/                      # Custom React hooks
│   ├── icons/                      # Icon components and assets
│   ├── lib/                        # Libraries and utility functions
│   ├── schemas/                    # Validation schemas
│   ├── middleware.ts               # Middleware functions
├── .eslintrc.json                  # ESLint configuration file
├── .gitignore                      # Files and directories to be ignored by Git
├── README.md                       # Project documentation
├── components.json                 # Configuration for components
├── next-env.d.ts                   # TypeScript environment settings for Next.js
├── next.config.mjs                 # Next.js configuration file
├── package-lock.json               # Auto-generated file for package version locking
├── package.json                    # Node.js dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── yarn.lock                       # Yarn dependency lock file

````
