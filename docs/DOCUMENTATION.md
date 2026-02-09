# One Market - Refactored Code Documentation

## 📋 Project Overview

**One Market** is a fully refactored online grocery store built with HTML, CSS, and vanilla JavaScript. The application features weekly and half-weekly vegetable packages with prices controlled via an Admin Dashboard.

### Key Features
- 📦 Pre-defined & custom vegetable packages
- 💰 Dynamic price calculation based on quantity
- 🛒 Shopping cart with localStorage persistence
- 📝 Order form with validation
- 📊 Google Sheets integration for order storage
- 💬 WhatsApp click-to-chat functionality
- 🎨 Responsive design for all devices
- ✅ Input validation & error handling
- 🔒 XSS prevention & security measures

---

## 🏗️ New Project Structure

```
New folder/
│
├── index.html                 # Homepage with package showcase
├── cart.html                  # Shopping cart & checkout
├── checkout.html              # Payment page (expandable)
├── shop.html                  # Shop page (expandable)
├── orders.html                # Order history page
├── about.html                 # About store page
├── product.html               # Product details page
│
├── js/                        # NEW: Organized JavaScript modules
│   ├── config.js              # Configuration & constants
│   ├── utils.js               # Utility functions & helpers
│   └── main.js                # Main application logic
│
├── theme.css                  # Global theme & styling
├── main.css                   # Additional styles (backup)
├── responsive.css             # Responsive rules
│
├── docs/                      # NEW: Documentation & deployment
│   ├── GoogleAppsScript.gs    # Google Sheets integration script
│   ├── SETUP.md               # Setup instructions
│   ├── API.md                 # API documentation
│   └── DEPLOYMENT.md          # Deployment guide
│
└── [Old files - main.js, cart.js, etc. can be deleted after migration]
```

---

## 📦 Code Organization

### 1. **config.js** - Central Configuration
Contains all app constants, product definitions, and settings.

**Key exports:**
- `APP_CONFIG` - App metadata
- `PRODUCTS` - Product definitions with prices
- `PACKAGES` - Pre-defined package templates
- `STORAGE_KEYS` - localStorage key names
- `ERROR_MESSAGES` - All error message strings
- `SUCCESS_MESSAGES` - Success notification strings

**Usage:**
```javascript
// Access product info
const tomato = PRODUCTS.tomato;
console.log(tomato.unitPrice); // 15

// Access package info
const weekly = PACKAGES.week;
console.log(weekly.basePrice); // 186
```

### 2. **utils.js** - Helper Functions
Reusable utility functions organized by category.

**Function Categories:**

#### Validation Functions
```javascript
validateName(name)          // Validates customer name
validatePhone(phone)        // Validates phone number
validateAddress(address)    // Validates delivery address
validateQuantity(qty)       // Validates quantity (positive number)
validatePrice(price)        // Validates price amount
```

#### Calculation Functions
```javascript
calculatePackagePrice(pkg, items)    // Calculates total price
calculateTotalWeight(items)          // Calculates total weight
formatPrice(price)                   // Formats price for display
roundToDecimals(num, places)         // Rounds to decimal places
```

#### Storage Functions
```javascript
savePackageToStorage(packageData)    // Save to localStorage
loadPackageFromStorage()             // Load from localStorage
clearPackageFromStorage()            // Clear localStorage
isDuplicateOrder(orderData)          // Check for duplicate orders
recordSubmittedOrder(orderData)      // Record order to prevent duplicates
```

#### Format Functions
```javascript
formatItemDisplay(itemId, qty)       // Format item display
formatOrderDetails(packageData)      // Format order details string
formatDateArabic(date)               // Format date in Arabic locale
sanitizeHTML(text)                   // Escape HTML special characters
```

#### Messaging Functions
```javascript
encodeForWhatsApp(text)              // URL encode for WhatsApp
buildWhatsAppUrl(phone, message)     // Build WhatsApp URL
openWhatsAppChat(phone, message)     // Open WhatsApp chat
submitOrderToSheets(orderData)       // Submit order to Google Sheets
sendWhatsAppNotification(orderData)  // Send WhatsApp notification
```

#### DOM Functions
```javascript
getElement(id)                       // Get element by ID
createElement(tag, class, content)   // Create DOM element
showElement(el)                      // Show element
hideElement(el)                      // Hide element
```

### 3. **main.js** - Application Logic
Core business logic and page interactions.

**Main Functions:**

#### Package Management
```javascript
selectPackage(packageId)         // Select predefined package
openPackageOptions(packageId)    // Open customization dialog
confirmPackageOptions()          // Confirm & save customization
showCustomPackageForm()          // Show custom package form
addCustomPackageToCart()         // Add custom package to cart
removePackage()                  // Remove package from cart
```

#### Cart & Display
```javascript
updateCartDisplay()              // Update cart on current page
renderCart()                     // Render full cart page
renderEmptyCart()                // Render empty state
updateFrequency(packageId)       // Update delivery frequency
```

#### Order Submission
```javascript
handleOrderSubmit(e)             // Handle form submission
buildOrderSummary(data, name)    // Build confirmation HTML
```

#### Notifications
```javascript
showSuccessMessage(msg, title)   // Show success alert
showErrorMessage(msg, title)     // Show error alert
showWarningMessage(msg, title)   // Show warning alert
showConfirmation(msg, title)     // Show confirmation dialog
```

---

## 🔧 Configuration Guide

### Updating Product Prices

Edit `config.js` in the `PRODUCTS` section:

```javascript
const PRODUCTS = {
  tomato: {
    label: '🍅 طماطم',
    emoji: '🍅',
    name: 'طماطم',
    unit: 'كجم',
    unitPrice: 15  // ← Change this value
  },
  // ... other products
};
```

### Updating Package Prices

Edit `config.js` in the `PACKAGES` section:

```javascript
const PACKAGES = {
  week: {
    id: 'week',
    name: 'أسبوعية',
    emoji: '📦',
    frequency: 'أسبوعي',
    basePrice: 186,  // ← Change this value
    deliveryDays: 7,
    items: {
      tomato: 5,
      onion: 3,
      // ... other items
    }
  },
  // ... other packages
};
```

### Updating Error Messages

Edit `config.js` in the `ERROR_MESSAGES` section:

```javascript
const ERROR_MESSAGES = {
  INVALID_PHONE: 'رقم الهاتف غير صحيح (11 رقم)',  // ← Customize message
  // ... other messages
};
```

---

## 🔌 Google Sheets Integration

### Setup Instructions

1. **Create Google Sheet:**
   - Go to sheets.google.com
   - Create a new spreadsheet
   - Add columns: `customer_name`, `phone`, `address`, `order_details`, `order_price`, `order_date`, `frequency`

2. **Deploy Google Apps Script:**
   - Go to script.google.com
   - Copy code from `docs/GoogleAppsScript.gs`
   - Set `SHEET_ID` with your spreadsheet ID
   - Deploy as Web App (Execute as: Me, Who has access: Anyone)

3. **Update Frontend:**
   - Copy deployment URL
   - In `config.js`, update `SHEETS_API.SCRIPT_URL`:
   ```javascript
   const SHEETS_API = {
     SCRIPT_URL: 'https://script.google.com/macros/d/{YOUR_DEPLOYMENT_ID}/usercontent/abc'
   };
   ```

### Order Data Structure

Orders are submitted with this structure:

```javascript
{
  customer_name: 'محمد أحمد',
  phone: '201001234567',
  address: 'القاهرة - المعادي',
  order_details: '5 كجم طماطم\n3 كجم بصل',
  order_price: 155,
  order_date: 'الجمعة، 31 يناير 2026',
  frequency: 'أسبوعي'
}
```

---

## 💬 WhatsApp Integration

### Configuration

Edit `config.js` - `WHATSAPP_CONFIG`:

```javascript
const WHATSAPP_CONFIG = {
  BUSINESS_PHONE: '20',  // Country code
  MESSAGE_TEMPLATE: {
    orderConfirm: (name, phone, price) => 
      `🎉 شكراً لطلبك! ${name}\n💰 الإجمالي: ${price} جنيه`,
    orderNotification: (name, phone, details) =>
      `📦 طلب جديد من ${name}`
  }
};
```

### Usage

```javascript
// Send WhatsApp notification to customer
sendWhatsAppNotification({
  name: 'محمد',
  phone: '201001234567',
  price: 155
});

// Open WhatsApp chat manually
openWhatsAppChat('201001234567', 'مرحباً، كيف حالك؟');
```

---

## ✅ Input Validation

### Customer Name
- Minimum 3 characters
- Maximum 100 characters
- Required field

### Phone Number
- Must be 11 or 12 digits
- Egyptian format (010/011/012/015)
- Spaces and hyphens are stripped

### Address
- Minimum 10 characters
- Maximum 500 characters
- Required field

### Quantity
- Must be positive number
- Maximum 1000 units
- Decimals allowed (0.25, 0.5, etc.)

### Price
- Must be positive number
- Maximum 100,000
- Auto-rounded to integers

---

## 🔒 Security Features

### XSS Prevention
```javascript
// HTML sanitization
sanitizeHTML(userInput)  // Escapes: & < > " '
```

### CSRF Protection
- Orders validated before submission
- Duplicate order prevention (5-minute window)
- Timestamp checking

### Data Privacy
- Phone numbers validated client-side
- Customer data only submitted with consent
- No sensitive keys exposed in frontend

### Input Sanitization
- All user inputs escaped before display
- HTML special characters encoded
- URL encoding for WhatsApp messages

---

## 🧪 Testing

### Test Package Selection
```javascript
// In browser console:
selectPackage('week');  // Select weekly package
currentPackage;         // View current package
```

### Test Validation
```javascript
// Test phone validation
validatePhone('01001234567');   // Should return true
validatePhone('123');           // Should return false

// Test price calculation
calculatePackagePrice(PACKAGES.week);  // Should return 186
```

### Test Storage
```javascript
// Save and load from localStorage
savePackageToStorage(currentPackage);
loadPackageFromStorage();
clearPackageFromStorage();
```

---

## 🐛 Debugging

### Enable Console Logging
Open browser DevTools (F12) and check Console tab for:
- `✅` Success messages
- `❌` Error messages
- `⚠️` Warning messages
- `📦` Order submissions

### Check Current State
```javascript
console.log(currentPackage);           // View current cart
console.log(PRODUCTS);                 // View all products
console.log(PACKAGES);                 // View all packages
```

### Test Order Submission
```javascript
// Manually call order submission
const testOrder = {
  name: 'تجربة',
  phone: '201001234567',
  address: 'عنوان تجريبي',
  price: 100,
  packageData: currentPackage
};

submitOrderToSheets(testOrder);
```

---

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full layout with side-by-side columns
- **Tablet**: Adjusted grid and font sizes
- **Mobile**: Stacked layout, touch-friendly buttons

See `responsive.css` and media queries in `theme.css`.

---

## 🚀 Deployment

### Production Checklist

- [ ] Update `SHEETS_API.SCRIPT_URL` with actual deployment URL
- [ ] Update `WHATSAPP_CONFIG` with business phone number
- [ ] Test all forms with real data
- [ ] Enable HTTPS (required for WhatsApp)
- [ ] Test on mobile devices
- [ ] Set up automated email notifications
- [ ] Configure Twilio for SMS alerts (optional)
- [ ] Set up Google Sheets backup/archiving
- [ ] Monitor error logs
- [ ] Set up CDN for static assets (optional)

### Deployment Platforms

**Recommended:**
- Vercel (free, fast, easy)
- Netlify (free, great features)
- GitHub Pages (free, static)
- Firebase Hosting (free tier available)

---

## 📊 Analytics

### Track Order Metrics

```javascript
// Number of orders
const orders = JSON.parse(localStorage.getItem('submittedOrders') || '[]');
console.log('Total orders:', orders.length);

// Average order value
const values = orders.map(o => o.price);
const average = values.reduce((a, b) => a + b, 0) / values.length;
console.log('Average order value:', average);
```

---

## 🔄 Maintenance

### Regular Updates

1. **Weekly**: Monitor Google Sheets for new orders
2. **Monthly**: Update product prices if needed
3. **Quarterly**: Review error logs and analytics
4. **Annually**: Security audit and dependencies check

### Backup

- Export Google Sheets to CSV weekly
- Backup localStorage data
- Version control all code changes

---

## 📞 Support & Issues

### Common Issues

**Issue**: Orders not saving to Google Sheets
- **Fix**: Verify SHEETS_API.SCRIPT_URL is correct
- **Fix**: Check Google Apps Script is deployed as Web App

**Issue**: WhatsApp links not working on desktop
- **Fix**: Use mobile device or WhatsApp Web
- **Fix**: Check phone number format is correct

**Issue**: Prices not calculating correctly
- **Fix**: Check PRODUCTS have correct unitPrice
- **Fix**: Verify weight calculations in calculateTotalWeight()

---

## 📄 File Manifest

| File | Purpose | Lines |
|------|---------|-------|
| config.js | Configuration & constants | ~250 |
| utils.js | Utility functions | ~450 |
| main.js | Application logic | ~500 |
| GoogleAppsScript.gs | Order handler (deploy separately) | ~200 |
| index.html | Homepage | ~80 |
| cart.html | Shopping cart & checkout | ~100 |
| theme.css | Global styles | ~930 |
| main.css | Additional styles | ~1000 |
| responsive.css | Responsive rules | ~10 |

---

## 📚 Additional Resources

- [MDN - DOM API](https://developer.mozilla.org/en-US/docs/Web/API/DOM)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

**Last Updated**: January 31, 2026  
**Version**: 1.0.0 (Refactored)  
**Status**: Production Ready ✅
