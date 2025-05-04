## Security Best Practices

### API Keys and Credentials

This project uses various external APIs and services that require authentication. To maintain security:

1. **Never commit API keys or credentials to the repository**
2. All sensitive information should be stored in environment variables
3. Use `.env.local` for local development (this file is in `.gitignore`)
4. For PowerShell scripts, use the environment variable loading pattern in `lib/supabase-migrations/README.md`

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here (optional)

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=your-email@example.com
EMAIL_TO=contact@example.com
```

### Security Resources

- For cleaning sensitive data from git history, see `scripts/clean-keys.ps1`
- Review security configurations regularly, especially Supabase database security
- Monitor GitHub security alerts and address them promptly 