# Backend Scripts

## Seed reference data

Inserts initial disciplines, stables, and horses into the database. Safe to run multiple times (uses `findOrCreate`; existing rows are skipped).

**From repo root (Equestrian):**
```bash
cd backend
npm run seed
```

**Production (Railway):** Run the seed against production DB by using Railway's CLI or one-off run with production env vars. The script uses the same config as the app (`NODE_ENV=production` → Railway-injected `MYSQL*` vars when run in Railway).

**What gets seeded:**
- **Disciplines:** Dressage, Jumping, Gymnastics, Flatwork
- **Stables:** Elite Equestrian, Sawari Stables, Alma Stables, Ghazzawi Stables, Moka Academy, Trio Ranch (all approved, active; address placeholder until updated in admin)
- **Horses:** Elite Equestrian → Ferrari, Bahr, Beauty; Moka Academy → Liva, Sierra, Zamzam (linked to Dressage discipline)

**Course focus types** (Rider focused, Horse focused, Balanced) are not stored in a separate table. They are the `focus_type` enum on the `Course` model (`rider_focused`, `horse_focused`, `balanced`). The app and admin can use these values when creating/editing courses; no seed needed.
