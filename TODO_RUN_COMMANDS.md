# Run commands

## Run in browser (frontend)
1) Go to frontend folder:
```bat
cd "c:/Users/palacharla chandu/OneDrive/Documents/3rd Year/All Project/mental-health-bot-main/mental-health-bot-main"
```
2) Start dev server:
```bat
npm run dev
```

## If you want to install deps first
```bat
cd "c:/Users/palacharla chandu/OneDrive/Documents/3rd Year/All Project/mental-health-bot-main/mental-health-bot-main"
npm install
npm run dev
```

## Important blocker right now
The repo root `mental-health-bot-main/package.json` is invalid JSON (it starts with `"name`).
That breaks tools that resolve the project from the root. Fix that file before attempting any repo-wide "run entire project".

