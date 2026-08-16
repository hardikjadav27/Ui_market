const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} = require("docx");

const outputDir = path.join(__dirname, "..", "docs");

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } });
}

function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
}

function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } });
}

function p(text, bold = false) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold })],
  });
}

function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function numbered(text) {
  return new Paragraph({
    text,
    numbering: { reference: "default-numbering", level: 0 },
    spacing: { after: 60 },
  });
}

function table(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(
      (text) =>
        new TableCell({
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
          shading: { fill: "1E293B" },
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, color: "FFFFFF" })],
            }),
          ],
        }),
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (text) =>
            new TableCell({
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: String(text) })],
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [headerRow, ...dataRows],
  });
}

function buildIssuesDocument() {
  return new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "DPASA Paper Trading Platform", bold: true, size: 32 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: "Issues Resolved — Technical Report", bold: true, size: 28 }),
            ],
          }),
          p("Document Version: 1.0"),
          p("Date: July 2026"),
          p("Project: Share_Front (React) + API_Backend (.NET)"),
          p("Purpose: This document lists all bugs and issues identified during the Login → Dashboard review, what was fixed, and what was intentionally excluded."),

          h1("1. Executive Summary"),
          p(
            "A full review was performed on the Share_Front web application integrated with the API_Backend paper-trading system. Thirteen issues were identified across critical, medium, and low severity levels. Twelve issues were resolved. Issue #4 (Zerodha broker credentials not configured) was excluded from fixes as requested — live market ticks still require valid Zerodha Kite configuration in appsettings.json on the API server.",
          ),

          h1("2. Issues Fixed"),
          h2("2.1 Critical / High-Impact Issues"),
          table(
            ["#", "Issue", "Resolution"],
            [
              [
                "1",
                "Demo login used hardcoded user_1 / 123456 that did not exist in the database",
                "Demo button now auto-registers demo@dpasa.local (password Demo@123, role User) via POST /api/users if login fails, then logs in successfully.",
              ],
              [
                "2",
                "reloadTradingData() swallowed API errors with .catch(() => undefined)",
                "MarketContext now uses Promise.allSettled, sets loadError state, shows toast notification, and displays TradingAlertBanner on the dashboard when data fails to load.",
              ],
              [
                "3",
                "Many watchlist symbols were invalid for Zerodha instrument mapping — LTP stayed at 0",
                "watchlistSymbols.ts rebuilt with valid NSE equities, NFO futures, and MCX commodities. Each row has explicit symbol + exchange + instrumentType. Unsupported segments show a clear empty-state message.",
              ],
              [
                "4",
                "Zerodha credentials not configured — no live ticks",
                "INTENTIONALLY NOT FIXED (per user request). Configure Zerodha section in API appsettings.json to enable live prices.",
              ],
              [
                "5",
                "Production URL placeholder your-api-domain.com in authConfig",
                "Removed hardcoded placeholder. API URLs now read from VITE_API_BASE_URL and VITE_HUB_BASE_URL environment variables. Added .env.development and .env.example files.",
              ],
            ],
          ),

          h2("2.2 Medium Issues (Auth / Navigation)"),
          table(
            ["#", "Issue", "Resolution"],
            [
              [
                "6",
                "Rules page was not protected; rules acceptance was not enforced before dashboard access",
                "ProtectedRoute component extended with requireRules prop. /rules requires login. /dashboard/* requires login AND rulesAccepted flag in localStorage.",
              ],
              [
                "7",
                "Login page did not redirect users who were already logged in",
                "Login page checks localStorage token on mount and redirects to /rules or /dashboard/home based on rules acceptance status.",
              ],
              [
                "8",
                "Redux state was not hydrated from localStorage on page refresh",
                "hydrateFromStorage action added to login reducer and dispatched in main.tsx on app startup. Token, userName, fullName, and role persist across refresh.",
              ],
              [
                "9",
                "refresh-token endpoint requires JWT authentication",
                "No change required — Refresh Kite Token button is only available on the authenticated dashboard Home page, which is correct behavior.",
              ],
            ],
          ),

          h2("2.3 Low / Cosmetic Issues"),
          table(
            ["#", "Issue", "Resolution"],
            [
              [
                "10",
                "React StrictMode caused double SignalR connection in development",
                "MarketContext uses a cancelled flag in useEffect cleanup to stop stale connections when StrictMode remounts components.",
              ],
              [
                "11",
                "Promise.all in reloadTradingData — one API failure blocked all data loading",
                "Replaced with Promise.allSettled so orders, positions, market status, and broker status load independently.",
              ],
              [
                "12",
                "Watchlist exchange/tab mapping was incorrect for some symbols",
                "Removed resolveExchange/resolveInstrumentType guessing. Each instrument now declares its exchange explicitly in watchlistInstruments config.",
              ],
              [
                "13",
                "Create Account link on login page was not wired",
                "Signup modal added on login page. Calls POST /api/users then auto-logs in the new user with generated username from email.",
              ],
            ],
          ),

          h1("3. Files Modified"),
          bullet("src/store/login/login.reducer.tsx — loginDemoUser, registerAndLogin, hydrateFromStorage"),
          bullet("src/context/MarketContext.tsx — loadError, Promise.allSettled, SignalR cleanup"),
          bullet("src/config/watchlistSymbols.ts — valid Zerodha instrument map"),
          bullet("src/components/ProtectedRoute.tsx — requireRules support"),
          bullet("src/components/TradingAlertBanner.tsx — dashboard error banner"),
          bullet("src/pages/login/login.tsx — signup modal, redirect if logged in, demo login"),
          bullet("src/pages/rules/rules.tsx — auth guard and redirect"),
          bullet("src/pages/watchlist/Watchlist.tsx — new instrument structure"),
          bullet("src/layouts/DashboardLayout.tsx — TradingAlertBanner"),
          bullet("src/main.tsx — Redux hydration on startup"),
          bullet("src/authConfig.ts — environment-based API URLs"),
          bullet("src/services/authApi.ts — user registration helper"),
          bullet("src/utils/authStorage.ts — centralized localStorage helpers"),
          bullet(".env.development, .env.example — environment configuration"),

          h1("4. Testing Recommendations"),
          numbered("Start API (dotnet run on port 5044) and frontend (npm run dev on port 5173)."),
          numbered("Click Try Demo Account — should register and login without manual DB setup."),
          numbered("Click Create Account — register a new user and verify auto-login."),
          numbered("Accept rules — verify dashboard is blocked until rules are accepted."),
          numbered("Refresh browser — verify session persists without re-login."),
          numbered("Open Watchlist — verify NSE equity symbols show structure (LTP requires Zerodha config)."),
          numbered("Disconnect API — verify error banner appears instead of silent failure."),
          numbered("Configure Zerodha in appsettings.json — verify live ticks on Watchlist and Home."),

          h1("5. Known Remaining Items"),
          bullet("Admin, Sub Admin, and Client management pages have navigation links but routes are not yet implemented in App.tsx."),
          bullet("Backend has no role-based API authorization — all authenticated users can access all endpoints."),
          bullet("Wallet page is UI placeholder only — no wallet API exists yet."),
          bullet("User hierarchy create/edit buttons on Super/Master/User list pages are placeholders."),

          p("— End of Issues Resolved Report —", true),
        ],
      },
    ],
  });
}

function buildUserManualDocument() {
  return new Document({
    numbering: {
      config: [
        {
          reference: "default-numbering",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "DPASA Paper Trading Platform", bold: true, size: 32 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: "Complete User Manual", bold: true, size: 28 }),
            ],
          }),
          p("Document Version: 1.0  |  For training and education purposes only"),
          p(
            "This manual is written for completely new users. It explains how to install, log in, navigate the web application, place paper trades, and use role-specific management screens for Super Admin, Admin, Sub Admin, Master, Client, and User accounts.",
          ),

          h1("1. What Is DPASA?"),
          p(
            "DPASA is a paper-trading (simulated trading) web application. It uses live market prices from Zerodha Kite WebSocket feed, but all orders and positions are stored in the database — nothing is sent to a real broker terminal. This makes it safe for learning stock market basics without financial risk.",
          ),
          bullet("Frontend (web UI): Share_Front — React application"),
          bullet("Backend (API): API_Backend — ASP.NET Core on port 5044"),
          bullet("Database: PostgreSQL"),
          bullet("Live prices: Zerodha Kite (configured on the server only)"),

          h1("2. System Requirements"),
          bullet("Windows PC with internet access"),
          bullet("PostgreSQL database running locally or on a server"),
          bullet(".NET 9 SDK (for running the API)"),
          bullet("Node.js 18+ (for running the frontend)"),
          bullet("Modern browser: Chrome, Edge, or Firefox"),
          bullet("Optional: Zerodha Kite API credentials for live market data"),

          h1("3. How to Start the Application"),
          h2("3.1 Start the API (Backend)"),
          numbered("Open PowerShell or Command Prompt."),
          numbered("Navigate to: D:\\WEB\\API_Backend\\API_Backend"),
          numbered("Run: dotnet run"),
          numbered("Wait until you see the API listening on http://localhost:5044"),
          numbered("Optional: Open http://localhost:5044/swagger to view API documentation."),

          h2("3.2 Start the Web Application (Frontend)"),
          numbered("Open a new terminal window."),
          numbered("Navigate to: D:\\Yash\\Share\\Share_Front"),
          numbered("First time only: run npm install"),
          numbered("Run: npm run dev"),
          numbered("Open your browser at: http://localhost:5173"),

          h2("3.3 First-Time Database Setup"),
          p(
            "The API automatically runs database migrations on startup. You must ensure PostgreSQL connection string in appsettings.json is correct. Roles can be created via POST /api/roles or directly in the database. Users can register themselves from the login page.",
          ),

          h1("4. User Roles and Hierarchy"),
          p(
            "DPASA uses a hierarchical role system. Each role can manage users below it in the chain. All roles can use paper trading features (Watchlist, Orders, Positions). Management menus differ by role.",
          ),
          table(
            ["Role", "Level", "Can Manage", "Trading Access"],
            [
              ["SuperAdmin", "Top", "Admins, Sub Admins, Masters, Clients, Users", "Yes"],
              ["Admin", "2", "Sub Admins, Masters, Clients, Users", "Yes"],
              ["SubAdmin", "3", "Masters, Clients, Users", "Yes"],
              ["Master", "4", "Clients, Users", "Yes"],
              ["Client", "5", "Own account only", "Yes"],
              ["User", "Trader", "Own account only", "Yes"],
            ],
          ),
          p(
            "Note: When you register from the login page, you are created as role User. Higher roles (SuperAdmin, Admin, etc.) must be created by a parent role or via the API/database by an administrator.",
          ),

          h1("5. Login — Step by Step (New User)"),
          h2("5.1 Option A: Try Demo Account (Fastest)"),
          numbered("Open http://localhost:5173"),
          numbered('Click the "Try Demo Account" button.'),
          numbered("The system automatically creates demo@dpasa.local if it does not exist, then logs you in."),
          numbered("Demo credentials: username demo, password Demo@123"),
          numbered("You will be taken to the Rules page."),

          h2("5.2 Option B: Create Your Own Account"),
          numbered("On the login page, click Create Account."),
          numbered("Fill in: Full Name, Email, Password, Confirm Password."),
          numbered('Click "Create & Login".'),
          numbered("Your username is auto-generated from your email (e.g. john from john@email.com)."),
          numbered("You are logged in automatically and redirected to Rules."),

          h2("5.3 Option C: Login with Existing Account"),
          numbered("Enter your Username and Password."),
          numbered('Click "Login to Account".'),
          numbered("If already logged in (token saved), you are redirected automatically."),

          h2("5.4 Rules and Regulations Page"),
          numbered("Read all rules carefully — this is a training platform only."),
          numbered('Check the box: "I have read and agree to the rules".'),
          numbered('Click "Accept & Continue".'),
          numbered("You must accept rules before accessing the dashboard."),
          numbered("Rules acceptance is saved in your browser (localStorage)."),

          h1("6. Dashboard Overview"),
          p("After accepting rules, you land on the Home dashboard. The layout has three main areas:"),
          bullet("Top Header — Logo, navigation menu, your role and name"),
          bullet("Main Content — Page you selected (Home, Watchlist, etc.)"),
          bullet("Footer — Live profit/loss summary and Logout button"),

          h2("6.1 Common Menu Items (All Roles)"),
          table(
            ["Menu", "Purpose"],
            [
              ["Home", "Summary cards: open positions, pending orders, executed trades, market feed status"],
              ["Watchlist", "Live symbol list with BUY/SELL buttons to place paper orders"],
              ["Standing", "Open positions — set Stop Loss, Target, Square Off"],
              ["Trade", "List of completed (executed) orders"],
              ["Pending", "Pending orders — cancel if needed"],
              ["Holding", "Open positions with live Mark-to-Market P&L"],
              ["Wallet", "Wallet view (UI placeholder — coming soon)"],
            ],
          ),

          h1("7. Paper Trading — How to Place a Trade"),
          h2("7.1 From Watchlist"),
          numbered("Go to Watchlist from the top menu."),
          numbered("Select a tab: WATCHLIST (NSE stocks), NSE-FUTURE, or MCX-FUTURE."),
          numbered("Find a symbol. LIVE indicator shows SignalR connection; KITE OK shows price feed."),
          numbered("Click the green BUY price or red SELL price on a row."),
          numbered("Order Entry modal opens — set Quantity, Order Type (MARKET/LIMIT/SL), Price if needed."),
          numbered("Submit the order. It appears in Pending until filled by the paper engine."),
          numbered("When filled, check Standing (open position) or Trade (completed order)."),

          h2("7.2 Order Types"),
          bullet("MARKET — Fills immediately at current LTP (Last Traded Price)"),
          bullet("LIMIT — Fills when LTP reaches your limit price"),
          bullet("SL (Stop Loss) — Trigger order; fills when price hits trigger"),
          bullet("SL-M — Stop Loss Market variant"),

          h2("7.3 Managing Open Positions (Standing Page)"),
          numbered("Go to Standing to see all open positions."),
          numbered("Set Stop Loss (SL) and Target prices on a position."),
          numbered("The paper engine auto-closes the position when LTP hits SL or Target."),
          numbered('Click SQ-OFF to manually close (square off) a position at current LTP.'),

          h2("7.4 Cancelling Pending Orders"),
          numbered("Go to Pending page."),
          numbered("Find your pending order in the list."),
          numbered("Click Cancel. Order status changes to Cancelled."),

          h2("7.5 Viewing P&L"),
          bullet("Footer bar shows aggregate live P/L across open positions"),
          bullet("Holding page shows per-position Mark-to-Market profit/loss"),
          bullet("Trade page shows completed order history with execution prices"),

          h1("8. Role-Specific Guides"),
          h2("8.1 Super Admin"),
          p("Super Admin is the top-level administrator with full visibility."),
          bullet("Menu: Super Admin — view and manage Super Admin accounts (roleId=1)"),
          bullet("Menu: Admin — manage Admin accounts (route planned; use API or DB today)"),
          bullet("Menu: Sub Admin — manage Sub Admin accounts"),
          bullet("Menu: Master — view Master accounts"),
          bullet("Menu: Client — manage Client accounts"),
          bullet("All trading menus available for personal paper trading"),
          p("To create a Super Admin: use POST /api/users with role SuperAdmin and appropriate hierarchy IDs, or create via database by an existing administrator."),

          h2("8.2 Admin"),
          p("Admin manages the organization below Super Admin level."),
          bullet("Cannot see Super Admin menu"),
          bullet("Menu: Sub Admin — manage Sub Admins under this Admin"),
          bullet("Menu: Master — manage Masters"),
          bullet("Menu: Client — manage Clients"),
          bullet("Full paper trading access"),
          p("When creating users as Admin, the system sets AdminId to your user ID automatically (createPayload pattern)."),

          h2("8.3 Sub Admin"),
          p("Sub Admin sits between Admin and Master."),
          bullet("Menu: Master — manage Masters under this Sub Admin"),
          bullet("Menu: Client — manage Clients"),
          bullet("No Admin or Super Admin menus"),
          bullet("Full paper trading access"),

          h2("8.4 Master"),
          p("Master manages Clients and Users in their branch."),
          bullet("Menu: Client — manage Client accounts"),
          bullet("No hierarchy menus above Master level"),
          bullet("Full paper trading access"),
          bullet("Master List page (roleId=4) shows Masters when logged in as higher role"),

          h2("8.5 Client"),
          p("Client is an end-user account managed by Master or above."),
          bullet("Does NOT see the Client management menu (cannot manage other clients)"),
          bullet("Full access to trading: Watchlist, Standing, Trade, Pending, Holding, Wallet"),
          bullet("Typical use: supervised trading under a Master account"),

          h2("8.6 User (Trader)"),
          p("User is the default role for self-registration and demo accounts."),
          bullet("Simplest account — no management menus"),
          bullet("Full paper trading access"),
          bullet("Ideal for students and trainees learning market basics"),

          h1("9. Home Dashboard Details"),
          bullet("OPEN POSITIONS — count of positions with status Open"),
          bullet("PENDING ORDERS — orders waiting to be filled"),
          bullet("EXECUTED — count of completed orders"),
          bullet("MARKET FEED — SignalR and Kite WebSocket connection status"),
          bullet("Refresh Kite Token — refreshes Zerodha access token (requires server Zerodha config)"),
          bullet("Market boxes — live LTP for NIFTY, BANKNIFTY, RELIANCE, TCS"),
          bullet("Recent orders table — last 10 orders"),

          h1("10. Watchlist Segments"),
          table(
            ["Tab", "Content", "Status"],
            [
              ["WATCHLIST", "NSE equities: RELIANCE, TCS, INFY, HDFCBANK, etc.", "Supported"],
              ["NSE-FUTURE", "NFO futures: NIFTY, BANKNIFTY, stock futures", "Supported"],
              ["MCX-FUTURE", "MCX commodities: GOLD, SILVER, CRUDEOIL", "Supported"],
              ["NSE-OPTIONS", "Options contracts", "Not available on feed yet"],
              ["MCX-OPTIONS", "MCX options", "Not available on feed yet"],
              ["COMEX, CRYPTO, FOREX, US-STOCK, SGX, DGCX", "International segments", "Not available on feed yet"],
            ],
          ),

          h1("11. Logout and Session"),
          numbered("Click Logout in the footer."),
          numbered("Your token is cleared from browser storage."),
          numbered("You are returned to the login page."),
          numbered("On next login, you must accept rules again only if localStorage was cleared."),
          p("Tip: Refreshing the page keeps you logged in — session is stored in localStorage."),

          h1("12. Troubleshooting"),
          table(
            ["Problem", "Solution"],
            [
              ["Cannot login — Invalid username or password", "Use Try Demo Account or Create Account. Verify API is running on port 5044."],
              ["Dashboard redirects to Rules", "You must accept rules before trading. Check the checkbox and click Accept."],
              ["LTP shows 0.00 on Watchlist", "Zerodha Kite must be configured in API appsettings.json. Contact your administrator."],
              ["SignalR OFFLINE", "Ensure API is running and you are logged in. Check browser console for errors."],
              ["Red error banner on dashboard", "Some API calls failed. Check API logs and network tab in browser DevTools."],
              ["Demo login fails", "Ensure PostgreSQL is running and API migrations completed."],
              ["Page blank after refresh", "Clear browser cache and log in again."],
            ],
          ),

          h1("13. Production Deployment (Administrators)"),
          numbered("Deploy API_Backend to your server with PostgreSQL connection string."),
          numbered("Configure Jwt:SigningKey (minimum 32 characters) in appsettings.json."),
          numbered("Configure Zerodha section for live market data."),
          numbered("Set CORS AllowedOrigins to your frontend domain."),
          numbered("Build frontend: npm run build in Share_Front."),
          numbered("Set environment variables: VITE_API_BASE_URL and VITE_HUB_BASE_URL to your API host."),
          numbered("Serve the dist/ folder via nginx, IIS, or any static file host."),

          h1("14. Important Disclaimers"),
          bullet("THIS APPLICATION IS FOR TRAINING PURPOSE ONLY."),
          bullet("No real money is involved in paper trading."),
          bullet("Developer and owner take no responsibility for monetary transactions."),
          bullet("Short-duration trades (under 20 minutes) may have profits voided per platform rules."),
          bullet("Platform reserves the right to cancel default trades and charge simulated brokerage on long-held positions."),

          h1("15. Quick Reference — URLs"),
          bullet("Web App (dev): http://localhost:5173"),
          bullet("API (dev): http://localhost:5044"),
          bullet("API Swagger: http://localhost:5044/swagger"),
          bullet("SignalR Hub: /hubs/market"),
          bullet("Login API: POST /api/Auth/login"),
          bullet("Register API: POST /api/users"),

          p("— End of User Manual —", true),
        ],
      },
    ],
  });
}

async function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const issuesDoc = buildIssuesDocument();
  const manualDoc = buildUserManualDocument();

  const issuesPath = path.join(outputDir, "DPASA_Issues_Resolved.docx");
  const manualPath = path.join(outputDir, "DPASA_User_Manual.docx");

  const issuesBuffer = await Packer.toBuffer(issuesDoc);
  const manualBuffer = await Packer.toBuffer(manualDoc);

  fs.writeFileSync(issuesPath, issuesBuffer);
  fs.writeFileSync(manualPath, manualBuffer);

  console.log("Created:");
  console.log(" ", issuesPath);
  console.log(" ", manualPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
