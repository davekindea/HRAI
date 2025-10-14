# 🚀 Quick Deployment Instructions

## Option 1: Quick Deploy (Recommended)

### Step 1: Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd client

# Install dependencies
npm install

# Deploy to Vercel
vercel --prod
```

### Step 2: Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate back to root
cd ..

# Install backend dependencies
npm install

# Login to Railway
railway login

# Initialize and deploy
railway init
railway up
```

## Option 2: Alternative Platforms

### Netlify (Frontend)
```bash
npm install -g netlify-cli
cd client
npm run build
netlify deploy --prod --dir=build
```

### Heroku (Backend)
```bash
npm install -g heroku
heroku create your-app-name
git push heroku main
```

## Environment Variables

### Vercel (Frontend)
- `REACT_APP_API_URL`: Your Railway backend URL
- `REACT_APP_VERSION`: 9.0.0

### Railway (Backend)
- Copy all variables from `.env.example`
- Railway provides `DATABASE_URL` automatically

## Testing Deployment
1. Frontend: Visit your Vercel URL
2. Backend: Test `https://your-backend.railway.app/api/health`
3. Full app: Login and test features

## Quick URLs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Health Check**: Your-backend-URL/api/health

# TODO: Review implementation
