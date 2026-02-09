# One Market - Quick Setup Guide

## 🚀 Getting Started

### 1. Local Development Setup

1. **Clone/Download the project**
   ```bash
   # Navigate to project directory
   cd "New folder"
   ```

2. **Start a local server** (required for testing)
   
   **Option A: Using Python 3**
   ```bash
   python -m http.server 8000
   ```
   
   **Option B: Using Node.js**
   ```bash
   npx http-server
   ```
   
   **Option C: Using VS Code Live Server**
   - Install extension: "Live Server"
   - Right-click `index.html`
   - Select "Open with Live Server"

3. **Open in browser**
   ```
   http://localhost:8000
   ```

---

## 📊 Google Sheets Setup

### Step 1: Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click "+ New Spreadsheet"
3. Name it: `One Market Orders`
4. Create these columns in Row 1:
   - A: `customer_name`
   - B: `phone`
   - C: `address`
   - D: `order_details`
   - E: `order_price`
   - F: `order_date`
   - G: `frequency`
   - H: `submission_timestamp`

5. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
                                          ^^^^^^^^
   ```

### Step 2: Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy code from `docs/GoogleAppsScript.gs`
4. Paste into the editor
5. Update line 10 with your SHEET_ID:
   ```javascript
   const SHEET_ID = 'YOUR_SHEET_ID_HERE';
   ```
6. Save the project
7. Click "Deploy" → "New Deployment"
8. Select type: "Web app"
9. Execute as: Your email
10. Who has access: "Anyone"
11. Click "Deploy"
12. Copy the **Deployment URL**

### Step 3: Update Frontend

1. Open `js/config.js`
2. Find the `SHEETS_API` section (around line 140)
3. Update with your Deployment URL:
   ```javascript
   const SHEETS_API = {
     SCRIPT_URL: 'https://script.google.com/macros/d/{YOUR_DEPLOYMENT_ID}/usercontent/abc'
   };
   ```

### Step 4: Test the Integration

1. Go to `http://localhost:8000`
2. Select a package
3. Fill in the order form
4. Submit the order
5. Check your Google Sheet - order should appear!

---

## 💬 WhatsApp Configuration

### Basic Setup

1. Open `js/config.js`
2. Find `WHATSAPP_CONFIG` section
3. Add your business phone number (Egyptian format):
   ```javascript
   const WHATSAPP_CONFIG = {
     BUSINESS_PHONE: '201001234567',  // ← Your business number
     MESSAGE_TEMPLATE: {
       // Templates are pre-configured
     }
   };
   ```

### Enable WhatsApp Notifications

The app currently logs notifications without opening WhatsApp. To enable:

In `utils.js`, find the `sendWhatsAppNotification` function and uncomment:

```javascript
// Uncomment this line to enable auto-open WhatsApp
openWhatsAppChat(businessPhone, message);
```

---

## 📦 Product & Package Management

### Updating Prices

Edit `js/config.js`:

```javascript
// Update product unit prices
const PRODUCTS = {
  tomato: {
    label: '🍅 طماطم',
    unitPrice: 15,  // ← Change price here
    // ...
  },
  // ... other products
};

// Or update package base prices
const PACKAGES = {
  week: {
    name: 'أسبوعية',
    basePrice: 186,  // ← Change price here
    items: {
      tomato: 5,
      // ...
    }
  },
  // ... other packages
};
```

### Adding New Products

1. Add to `PRODUCTS` object in `config.js`:
```javascript
const PRODUCTS = {
  // ... existing products
  carrot: {
    label: '🥕 جزر',
    emoji: '🥕',
    name: 'جزر',
    unit: 'كجم',
    unitPrice: 10
  }
};
```

2. Add to package items in `PACKAGES`:
```javascript
const PACKAGES = {
  week: {
    items: {
      // ... existing items
      carrot: 1.5  // ← Add new item
    }
  }
};
```

### Creating New Packages

Add to `PACKAGES` in `config.js`:

```javascript
const PACKAGES = {
  // ... existing packages
  custom_premium: {
    id: 'custom_premium',
    name: 'باقة بريميوم',
    emoji: '👑',
    frequency: 'أسبوعي',
    basePrice: 250,
    deliveryDays: 7,
    items: {
      tomato: 10,
      onion: 5,
      cucumber: 3,
      chili: 2,
      potato: 8
    }
  }
};
```

---

## 🎨 Customizing Appearance

### Brand Colors

Edit `theme.css`:

```css
:root {
  --primary: #2d8f4e;              /* Main green */
  --primary-dark: #1f6a39;         /* Dark green */
  --secondary: #a8d5ba;            /* Light green */
  --accent: #2d8f4e;               /* Accent color */
  --text-dark: #1a3a2a;            /* Dark text */
  /* ... other colors */
}
```

### Store Name & Tagline

Edit `index.html`:

```html
<div class="site-brand">
  <h1>🥬 One market</h1>  <!-- ← Change name -->
  <p>خضار طازة يومياً</p>  <!-- ← Change tagline -->
</div>
```

Update in all HTML files for consistency.

---

## 📧 Email Notifications

### Set Up Admin Email Alerts

In `docs/GoogleAppsScript.gs`:

1. Find `sendAdminNotification()` function
2. Update admin email:
   ```javascript
   const adminEmail = 'your-email@gmail.com';
   ```

3. Redeploy the Google Apps Script

Now you'll receive an email for each order!

---

## 🔐 Security Checklist

- [ ] Update all configuration values (Sheet ID, phone number, etc.)
- [ ] Remove test data from Google Sheet
- [ ] Enable HTTPS on your hosting
- [ ] Test form validation with invalid inputs
- [ ] Test XSS protection (try entering `<script>alert('xss')</script>`)
- [ ] Verify duplicate order prevention works
- [ ] Check localStorage for sensitive data exposure
- [ ] Test on mobile devices
- [ ] Review all error messages for security issues

---

## 🧪 Testing Checklist

### Functionality Tests

- [ ] Select weekly package
- [ ] Select half-weekly package
- [ ] Create custom package
- [ ] Change package quantity
- [ ] Update delivery frequency
- [ ] Remove package from cart
- [ ] Submit order with valid data
- [ ] Try submitting with invalid data

### Validation Tests

- [ ] Name validation (too short)
- [ ] Phone validation (invalid format)
- [ ] Address validation (too short)
- [ ] Quantity validation (negative/zero)
- [ ] Price calculation is correct

### Integration Tests

- [ ] Order appears in Google Sheet
- [ ] Order date is correct
- [ ] All fields saved correctly
- [ ] Duplicate prevention works
- [ ] Email notification received
- [ ] WhatsApp notification works

### UI/UX Tests

- [ ] Layout works on mobile
- [ ] Layout works on tablet
- [ ] Layout works on desktop
- [ ] All buttons are clickable
- [ ] All forms are usable
- [ ] Success/error messages display

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Access your site**
   ```
   https://your-project.vercel.app
   ```

### Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site"
3. Drag & drop your project folder
4. Your site is live!

### Deploy to GitHub Pages

1. Create GitHub repository
2. Push code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/one-market.git
   git push -u origin main
   ```
3. Enable GitHub Pages in repo settings
4. Access: `https://yourusername.github.io/one-market/`

---

## 🆘 Troubleshooting

### Orders Not Saving

**Problem**: Order submitted but not appearing in Google Sheet

**Solutions**:
1. Check SHEETS_API.SCRIPT_URL is correct in `config.js`
2. Verify Google Apps Script is deployed as Web App
3. Check browser console (F12) for error messages
4. Test Google Apps Script directly: `https://script.google.com/...`
5. Check Google Sheet permissions (should be accessible)

### WhatsApp Not Working

**Problem**: WhatsApp links don't open

**Solutions**:
1. Check phone number format (should be without + and spaces)
2. Test on mobile device (desktop may not have WhatsApp)
3. Verify WhatsApp Web is working
4. Check browser allows opening new tabs

### Page Not Loading

**Problem**: Blank page or JavaScript errors

**Solutions**:
1. Check browser console (F12) for errors
2. Verify all script files are loading: `js/config.js`, `js/utils.js`, `js/main.js`
3. Check file paths are relative (not absolute)
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try different browser

### Validation Errors

**Problem**: Forms rejecting valid input

**Solutions**:
1. Check validation rules in `utils.js`
2. Phone must be exactly 11 digits
3. Name must be 3+ characters
4. Address must be 10+ characters
5. Try removing spaces/special characters

---

## 📞 Support

For issues or questions:

1. Check console logs (F12) for error messages
2. Review `docs/DOCUMENTATION.md` for detailed info
3. Test with example data from `docs/GoogleAppsScript.gs`
4. Verify all configuration values are correct

---

## ✅ Success!

If everything is working:
- ✅ Site loads without errors
- ✅ Can select packages
- ✅ Can fill order form
- ✅ Orders appear in Google Sheet
- ✅ Validation works correctly
- ✅ Responsive on mobile

**Congratulations! Your One Market store is ready for business! 🎉**

---

**Last Updated**: January 31, 2026  
**Version**: 1.0.0
