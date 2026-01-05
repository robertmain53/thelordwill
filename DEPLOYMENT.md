# Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Configure `DATABASE_URL` for PostgreSQL
- [ ] Configure `DIRECT_URL` for migrations (if using connection pooling)
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Obtain and configure `BIBLE_API_KEY`
- [ ] Obtain and configure `ESV_API_KEY` (optional)
- [ ] Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- [ ] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional)

### Database Setup
- [ ] Create production PostgreSQL database
- [ ] Run `npm run db:generate` to generate Prisma client
- [ ] Run `npx prisma migrate deploy` to apply migrations
- [ ] Seed initial data (biblical names, situations, professions)
- [ ] Verify database connections work

### Code Quality
- [ ] Run `npm run lint` - Fix all linting errors
- [ ] Run `npm run build` - Ensure build succeeds
- [ ] Test all dynamic routes locally
- [ ] Verify metadata generation works
- [ ] Check performance metrics (LCP, INP)

## Deployment to Vercel

### Initial Setup
1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel

   # Or use Vercel Dashboard:
   # https://vercel.com/new
   ```

2. **Configure Environment Variables**
   - Go to: Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - Ensure production values are set

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Node Version: 20.x

4. **Database Configuration**
   - Use Vercel Postgres (recommended) or external PostgreSQL
   - Set `DATABASE_URL` with connection pooling URL
   - Set `DIRECT_URL` with direct connection URL
   - Run migrations: `npx prisma migrate deploy`

### Deployment
```bash
# Using Vercel CLI
vercel --prod

# Or push to main branch (if connected to Git)
git push origin main
```

## Post-Deployment

### Verification
- [ ] Visit production URL
- [ ] Test homepage loads correctly
- [ ] Test dynamic routes:
  - `/meaning-of-john-in-the-bible`
  - `/bible-verses-for-anxiety`
  - `/bible-verses-for-teacher`
- [ ] Verify canonical URLs are absolute
- [ ] Check OpenGraph tags (use https://www.opengraph.xyz/)
- [ ] Validate JSON-LD schema (use https://validator.schema.org/)
- [ ] Test search functionality
- [ ] Verify database connections work

### Performance Testing
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Verify LCP < 2.0s
- [ ] Verify INP < 200ms
- [ ] Check CLS < 0.1
- [ ] Test on mobile and desktop
- [ ] Verify images load in AVIF/WebP format

### SEO Verification
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify `robots.txt` is accessible
- [ ] Check canonical URLs are correct
- [ ] Verify meta descriptions are unique
- [ ] Test structured data in Google Rich Results Test
- [ ] Ensure all pages return 200 status
- [ ] Check for broken links

### Monitoring Setup
- [ ] Set up Vercel Analytics
- [ ] Configure Google Analytics (if using)
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up performance alerts
- [ ] Enable database monitoring

## Post-Launch

### Content Population
- [ ] Import biblical names data
- [ ] Import situations data
- [ ] Import professions data
- [ ] Import Bible verses
- [ ] Create relationships between entities
- [ ] Verify data accuracy

### SEO Optimization
- [ ] Generate and submit XML sitemap
- [ ] Submit to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Create and submit robots.txt
- [ ] Set up Google Analytics events
- [ ] Monitor search rankings
- [ ] Track Core Web Vitals
- [ ] Analyze popular pages

### Ongoing Maintenance
- [ ] Weekly database backups
- [ ] Monthly performance audits
- [ ] Quarterly content updates
- [ ] Monitor error logs
- [ ] Update dependencies regularly
- [ ] Review and optimize slow queries
- [ ] Scale database if needed

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # Vercel dashboard: Deployments → Select previous → Promote to Production
   # Or CLI:
   vercel rollback
   ```

2. **Database Rollback**
   ```bash
   # If migrations failed, rollback to previous version
   npx prisma migrate resolve --rolled-back [migration_name]
   ```

3. **Diagnose Issues**
   - Check Vercel logs
   - Review build errors
   - Verify environment variables
   - Test database connections

## Scaling Plan

### When to Scale

**Database:**
- Query response time > 500ms
- Connection pool exhausted
- High CPU usage

**Application:**
- Server response time > 1s
- High memory usage
- Increased traffic

### How to Scale

1. **Database Scaling**
   - Upgrade PostgreSQL instance
   - Add read replicas
   - Implement Redis caching
   - Optimize indexes

2. **Application Scaling**
   - Increase Vercel function memory
   - Enable edge caching
   - Add CDN for static assets
   - Implement incremental static regeneration (if needed)

3. **Content Delivery**
   - Use Vercel Edge Network
   - Enable image optimization
   - Implement lazy loading
   - Add service worker for offline support

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **PostgreSQL Issues**: Database provider support
- **API Issues**: Bible API provider support
- **Development Team**: [Your contact info]

## Emergency Procedures

### Site Down
1. Check Vercel status: https://vercel.com/status
2. Review deployment logs
3. Verify environment variables
4. Check database connectivity
5. Rollback if necessary

### Database Issues
1. Check connection pool status
2. Review slow query logs
3. Verify credentials
4. Check database disk space
5. Contact database provider

### Performance Degradation
1. Run Lighthouse audit
2. Check Vercel Analytics
3. Review database query performance
4. Check external API status
5. Analyze error logs
6. Consider scaling resources

---

**Last Updated**: [Date]
**Maintained By**: Development Team
