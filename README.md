# DevControl - Your Personal Developer Operating System

A unified dashboard that consolidates project management, task tracking, secrets management, infrastructure management, server automation, GitHub/Vercel integrations, notes, and daily scheduling into one powerful application.

## Features

### Phase 1 - Core Features

- **Project Manager**: Track projects with tech stack, GitHub repos, deployment targets, and status
- **Task System**: Kanban board with backlog, in progress, and completed columns. Daily plan view and priority tracking
- **Encrypted Secrets Manager**: AES-256 encrypted storage for API keys, SSH credentials, passwords, and environment variables
- **Infrastructure Manager**: Track servers (Hetzner, AWS, etc.), SSH credentials, domains, DNS records
- **Server Automation Panel**: One-click SSH commands for git pull, PM2 restart, Docker, Nginx, logs, cache clearing, and database backups
- **GitHub Integration**: View repositories, latest commits, stars/forks, issues, and pull requests
- **Vercel Integration**: Monitor deployments, preview URLs, production builds, and domains
- **Notes & Documentation**: Markdown editor with internal links, tags, templates, and project linking
- **Daily Dashboard**: Today's highlights, weekly overview, and developer productivity metrics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Data Fetching**: React Query (TanStack Query)
- **UI Components**: Radix UI + shadcn/ui
- **Encryption**: crypto-js (AES-256)
- **SSH**: ssh2
- **Drag & Drop**: @hello-pangea/dnd

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL (for production) or SQLite (for development)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dcc
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: SQLite database path (default: `file:./dev.db`)
- `NEXTAUTH_SECRET`: Random secret for NextAuth
- `NEXTAUTH_URL`: Your app URL (default: `http://localhost:3000`)
- `ENCRYPTION_KEY`: 32-character key for AES encryption

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Create your first admin user:
The first user created through the admin panel will automatically be assigned the admin role. Log in as an admin to create additional users through Settings > Users.

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### User Management

- **Admin Role**: The first user created through the admin panel automatically becomes an admin
- **User Creation**: Admins can create users through Settings > Users
- **Client Role**: Regular users have limited access to assigned projects
- **Password Management**: Users can change their passwords in their Profile page

### Projects

- Create projects with tech stack tags
- Link GitHub repositories
- Track deployment targets (Vercel, Hetzner, local)
- Monitor project status (active, paused, completed)

### Tasks

- Create tasks with priorities and due dates
- Drag and drop between Kanban columns
- Filter by project
- View daily and upcoming tasks

### Secrets

- Store encrypted API keys, passwords, SSH keys
- Reveal secrets on demand
- Copy to clipboard
- Organize by type and project

### Infrastructure

- Add servers with SSH credentials
- Execute commands via SSH
- Quick commands for common operations (git pull, PM2 restart, etc.)
- Track domains and DNS records

### GitHub & Vercel

- Connect with Personal Access Tokens
- View repositories and deployments
- Monitor activity and status

### Notes

- Create markdown notes
- Add tags and link to projects
- Full markdown support with preview

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   └── login/            # Authentication pages
├── components/
│   ├── dashboard/        # Dashboard components
│   ├── ui/               # Reusable UI components
│   └── [feature]/        # Feature-specific components
├── lib/
│   ├── db.ts            # Prisma client
│   ├── encryption.ts    # AES encryption utilities
│   ├── ssh.ts          # SSH command execution
│   ├── github.ts       # GitHub API helpers
│   └── vercel.ts       # Vercel API helpers
└── prisma/
    └── schema.prisma    # Database schema
```

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables (Production)

Ensure all environment variables are set:
- `DATABASE_URL`: PostgreSQL connection string (recommended for production)
- `NEXTAUTH_SECRET`: Strong random secret
- `NEXTAUTH_URL`: Your production URL
- `ENCRYPTION_KEY`: 32-character encryption key

### Database Migrations

For production, use Prisma migrations:
```bash
npx prisma migrate deploy
```

### Security Considerations

- Use PostgreSQL in production (not SQLite)
- Set strong `NEXTAUTH_SECRET` and `ENCRYPTION_KEY`
- Enable HTTPS
- Configure proper CORS settings
- Review and restrict API endpoints as needed

## Future Enhancements (Phase 2 & 3)

- **Automation Scripts**: Project startup automation, scheduled tasks
- **SaaS Version**: Multi-user, teams, billing, multi-tenancy
- **Advanced Analytics**: Coding hours, git commit frequency, productivity metrics
- **More Integrations**: Linear, Jira, Slack, etc.

## License

MIT

## Contributing

This is a personal project, but suggestions and improvements are welcome!

