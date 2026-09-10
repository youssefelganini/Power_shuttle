# Power Shuttle — Frontend Build Prompt

Act as a senior frontend developer and UI/UX designer. Build "Power Shuttle" — a used-car history platform for the Egyptian market. This is a **responsive React application**. 

**CRITICAL INSTRUCTION: SCALABILITY & ARCHITECTURE**
This hackathon demo is the foundation for a **long-term, highly scalable project**. Write clean, maintainable, and well-documented code that is structured for future growth. 
- Do not output one massive file. Slice the application into small, reusable React components (e.g., `App.jsx`, `Navbar.jsx`, `Footer.jsx`, `Landing.jsx`, `CarDashboard.jsx`, `TimelineItem.jsx`). 
- **Strictly separate HTML and CSS:** Provide the standard `index.html` file and use completely separate `.css` files for all styling (e.g., `index.css`, `App.css`, or component-specific CSS files). 
- Do NOT use inline styles, Tailwind, or CSS-in-JS.
- Provide a clear file tree before generating the code for each separate file.

**CRITICAL INSTRUCTION: STRICTLY FRONTEND ONLY**
Do NOT generate any backend code (no Node.js, Python, Express, database configurations, or API servers). I only need the frontend UI code. Since we are presenting the MVP first, **mock the authentication state and all data** — we need it to look real, but it should just navigate between views and display hardcoded states using React state.

## 1. Landing Page (Main Entry)
- **Navbar:** "Power Shuttle" logo on the left. "Sign In" and "Sign Up" buttons aligned to the right. 
- **Hero Section:** A powerful tagline and a brief "About Us / How it Works" section explaining how we use AI to bring transparency to the Egyptian used car market.
- **Role Selection:** Two distinct choice cards (Buyer vs. Service Center) to route users to the correct mocked authentication flow.
- **Footer:** Contact information, Email, and WhatsApp links.

## 2. Authentication Views (Mocked Flow)
- Clean, simple Login/Signup modals or pages.
- **Buyer:** Email, Password, Google Auth mock.
- **Service Center:** Email, Password, **National ID Card Number**, and **Maintenance Center Name**.
- Successful mock login routes to the respective dashboard.

## 3. Buyer View (Car History Dashboard)
This is the core data visualization page. When a user enters a VIN, display a comprehensive, modern dashboard.

**A. Header Section:**
- Car Model (e.g., 2019 Skoda Octavia)
- VIN / Chassis Number
- Last Odometer Reading
- First Registration Date (First time on the street)

**B. AI & Market Overview:**
- **AI Verdict:** A prominent, plain-language recommendation (e.g., "Safe to Buy" or "High Risk").
- **Estimated Current Price:** Displayed in EGP (Egyptian Pounds).
- **Mileage Graph:** A visual chart or graph placeholder showing the average miles/odometer timeline over the years.

**C. Maintenance & Accident Timeline:**
A vertical timeline of the car's history. For each record, display:
- Date of service.
- **Damage Type & Affected Components:** (e.g., Panel repair, Engine maintenance). 
- **Visual Damage Indicator:** Create a UI component inspired by the provided reference image `image_e13688.png`. It should show a top-down car layout highlighting affected areas (like "Left rear, Rear").
- **Repair Cost:** Displayed in EGP.
- **AI Insights:** A dedicated text block on the right side of the timeline item where the AI gives its specific comment on this repair (e.g., "Routine brake pad change, cost is standard for the Egyptian market").

## 4. Service Center View (Mechanic logging a repair)
A clean form to log repairs:
- VIN, Odometer reading (km).
- Service type (dropdown: routine maintenance, panel/body repair, engine/transmission, electrical, other).
- Repair Cost (EGP).
- Insurance claim linked? (Yes / No).
- Notes (textarea).
- **Dynamic Uploads:** "Invoice Photo" is required. "Before" and "After" photos only appear if the service type is NOT "routine maintenance".

## Design & Theme Requirements
- **Theme:** Implement a simple **Light/Dark mode toggle**. AVOID generic "AI dark navy blue". Keep it grounded and industrial: pure whites/light grays for light mode, deep carbon blacks/dark grays for dark mode, and a bold accent color (like safety red or industrial orange).
- **Responsive:** Stacks vertically on mobile, uses grid/flex layouts on desktop.
- **Typography:** Minimum 16px body text, clean visual hierarchy, generous spacing.

Provide the complete file structure and the runnable code for each sliced component.