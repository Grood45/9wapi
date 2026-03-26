# Server Deployment Guide (9Wicket API)

Since the project is already live on the server, follow these steps to deploy the new updates (Magic Stream API, Doc Export Page, and Security Patches).

## 1. Login to Server
SSH into your production server and navigate to the project directory:
```bash
cd /path/to/your/9wapi
```

## 2. Pull Latest Changes
Pull the updates I just pushed to GitHub:
```bash
git pull origin main
```

## 3. Update Admin Panel (Frontend)
The Admin Panel needs to be rebuilt to include the new **Documents Export** page and **Magic Stream API** settings.
```bash
cd admin-panel
npm install
npm run build
cd ..
```

## 4. Install Backend Dependencies
If there are any new packages (like `string-similarity`), install them:
```bash
npm install
```

## 5. Restart the Server
Restart the Node.js process using PM2 to apply backend changes (like the new `apiAccessGuard` security):
```bash
pm2 restart glive-server
# OR if you want to restart everything:
pm2 restart all
```

## 6. Verify Production
- Visit your production admin URL (e.g., `https://api.9x.live/admin`).
- Check if the **API Documentation** page redirects to the new export workspace.
- Test the **Magic Stream API** with a valid event ID.

---
**Note**: All changes are already bundled in the `admin-panel/dist` folder after step 3, so your server will automatically serve the latest UI.
