# One Market - API Reference & Function Guide

## 📌 Quick Links

- [Configuration Objects](#configuration-objects)
- [Validation Functions](#validation-functions)
- [Calculation Functions](#calculation-functions)
- [Storage Functions](#storage-functions)
- [Format Functions](#format-functions)
- [Messaging Functions](#messaging-functions)
- [DOM Functions](#dom-functions)
- [Application Functions](#application-functions)

---

## Configuration Objects

### PRODUCTS
Global product definitions with prices and metadata.

```javascript
PRODUCTS = {
  tomato: {
    label: '🍅 طماطم',           // Display label with emoji
    emoji: '🍅',                  // Emoji only
    name: 'طماطم',                // Arabic name
    unit: 'كجم',                  // Unit of measurement
    unitPrice: 15                 // Price per unit
  },
  onion: { ... },
  cucumber: { ... },
  chili: { ... },
  potato: { ... }
}
```

**Usage:**
```javascript
const tomatoPrice = PRODUCTS.tomato.unitPrice;  // 15
const tomatoLabel = PRODUCTS.tomato.label;      // "🍅 طماطم"
```

---

### PACKAGES
Pre-defined package templates.

```javascript
PACKAGES = {
  week: {
    id: 'week',                   // Unique identifier
    name: 'أسبوعية',              // Display name
    emoji: '📦',                  // Package emoji
    frequency: 'أسبوعي',          // Frequency text
    basePrice: 186,               // Base price in EGP
    deliveryDays: 7,              // Delivery interval in days
    items: {                      // Items in package
      tomato: 5,
      onion: 3,
      cucumber: 1.5,
      chili: 2,
      potato: 5
    }
  },
  daily: { ... },
  half: { ... },
  month: { ... }
}
```

**Usage:**
```javascript
const weeklyPrice = PACKAGES.week.basePrice;  // 186
const weeklyItems = PACKAGES.week.items;      // {tomato: 5, ...}

Object.values(PACKAGES).forEach(pkg => {
  console.log(`${pkg.emoji} ${pkg.name}: ${pkg.basePrice} EGP`);
});
```

---

### ERROR_MESSAGES
Centralized error message strings.

```javascript
ERROR_MESSAGES = {
  INVALID_QTY: 'الكمية غير صحيحة...',
  INVALID_PRICE: 'السعر غير صحيح...',
  INVALID_NAME: 'الاسم مطلوب...',
  INVALID_PHONE: 'رقم الهاتف غير صحيح...',
  INVALID_ADDRESS: 'العنوان مطلوب...',
  EMPTY_PACKAGE: 'اختر باقة...',
  EMPTY_CART: 'العربة فارغة',
  SUBMISSION_ERROR: 'حدث خطأ أثناء إرسال الطلب...',
  NETWORK_ERROR: 'خطأ في الاتصال...'
}
```

**Usage:**
```javascript
showErrorMessage(ERROR_MESSAGES.INVALID_PHONE);
```

---

### SUCCESS_MESSAGES
Success notification strings.

```javascript
SUCCESS_MESSAGES = {
  ORDER_SUBMITTED: 'تم إرسال طلبك بنجاح! ✅',
  PRICE_UPDATED: 'تم تحديث السعر',
  PACKAGE_ADDED: 'تمت إضافة الباقة للعربة'
}
```

---

## Validation Functions

### validateName(name)
Validates customer name.

**Parameters:**
- `name` (string): Customer name

**Returns:**
- `boolean`: true if valid, false otherwise

**Rules:**
- Minimum 3 characters
- Maximum 100 characters
- Must be non-empty string

**Example:**
```javascript
validateName('محمد أحمد');        // true
validateName('علي');             // false (too short)
validateName('');                // false (empty)
```

---

### validatePhone(phone)
Validates phone number (Egyptian format).

**Parameters:**
- `phone` (string): Phone number

**Returns:**
- `boolean`: true if valid, false otherwise

**Rules:**
- Must be 11 or 12 digits
- Spaces and hyphens are stripped
- Format: 010xxxxxxxxx or +201xxxxxxxxx

**Example:**
```javascript
validatePhone('01001234567');      // true (11 digits)
validatePhone('201001234567');     // true (12 digits)
validatePhone('123');              // false (too short)
validatePhone('010-0123-4567');    // true (hyphens stripped)
```

---

### validateAddress(address)
Validates delivery address.

**Parameters:**
- `address` (string): Delivery address

**Returns:**
- `boolean`: true if valid, false otherwise

**Rules:**
- Minimum 10 characters
- Maximum 500 characters
- Must be non-empty string

**Example:**
```javascript
validateAddress('القاهرة - المعادي - شارع النيل');  // true
validateAddress('شارع');                            // false (too short)
```

---

### validateQuantity(qty)
Validates quantity (must be positive number).

**Parameters:**
- `qty` (number|string): Quantity amount

**Returns:**
- `boolean`: true if valid, false otherwise

**Rules:**
- Must be positive number
- Maximum 1000 units
- Decimals allowed (0.25, 0.5, etc.)

**Example:**
```javascript
validateQuantity(5);               // true
validateQuantity(0.5);             // true (decimals OK)
validateQuantity(0);               // false (must be positive)
validateQuantity(-1);              // false (no negatives)
validateQuantity('abc');           // false (not a number)
```

---

### validatePrice(price)
Validates price amount.

**Parameters:**
- `price` (number): Price amount

**Returns:**
- `boolean`: true if valid, false otherwise

**Rules:**
- Must be non-negative number
- Maximum 100,000
- Can be zero

**Example:**
```javascript
validatePrice(150);                // true
validatePrice(0);                  // true
validatePrice(-5);                 // false (no negatives)
validatePrice(150000);             // false (exceeds max)
```

---

## Calculation Functions

### calculatePackagePrice(pkg, items)
Calculates total price for a package.

**Parameters:**
- `pkg` (object): Package object
- `items` (object, optional): Items with quantities (defaults to pkg.items)

**Returns:**
- `number`: Total price (rounded to integer)

**Example:**
```javascript
const price = calculatePackagePrice(PACKAGES.week);
// Returns: 186

const customItems = {tomato: 10, onion: 5};
const customPrice = calculatePackagePrice(PACKAGES.week, customItems);
// Returns: calculated price based on unit prices
```

---

### calculateTotalWeight(items)
Calculates total weight (kg) in a package.

**Parameters:**
- `items` (object): Items with quantities

**Returns:**
- `number`: Total weight in kg

**Example:**
```javascript
const weight = calculateTotalWeight(PACKAGES.week.items);
// Returns: 16.5 (5+3+1.5+0+5, excluding chili which is units)

const customWeight = calculateTotalWeight({
  tomato: 2.5,
  onion: 1.5,
  chili: 1
});
// Returns: 4 (only kg items counted)
```

---

### formatPrice(price)
Formats price for display.

**Parameters:**
- `price` (number): Price amount

**Returns:**
- `string`: Formatted price string

**Example:**
```javascript
formatPrice(150);     // "150 جنيه"
formatPrice(1000.5);  // "1001 جنيه" (rounded)
```

---

### roundToDecimals(num, places)
Rounds number to specified decimal places.

**Parameters:**
- `num` (number): Number to round
- `places` (number, optional): Decimal places (default: 2)

**Returns:**
- `number`: Rounded number

**Example:**
```javascript
roundToDecimals(3.14159);       // 3.14
roundToDecimals(3.14159, 1);    // 3.1
roundToDecimals(3.14159, 3);    // 3.142
```

---

## Storage Functions

### savePackageToStorage(packageData)
Saves package to localStorage.

**Parameters:**
- `packageData` (object|null): Package data to save (null to remove)

**Returns:**
- `void`

**Example:**
```javascript
const pkg = {
  id: 'week',
  name: 'أسبوعية',
  price: 186,
  items: {...}
};
savePackageToStorage(pkg);

// Clear storage
savePackageToStorage(null);
```

---

### loadPackageFromStorage()
Loads package from localStorage.

**Parameters:**
- None

**Returns:**
- `object|null`: Package data or null if not found

**Example:**
```javascript
const pkg = loadPackageFromStorage();
if (pkg) {
  console.log(`Loaded: ${pkg.name} - ${formatPrice(pkg.price)}`);
}
```

---

### clearPackageFromStorage()
Clears package from storage.

**Parameters:**
- None

**Returns:**
- `void`

**Example:**
```javascript
clearPackageFromStorage();
```

---

### isDuplicateOrder(orderData)
Checks if order was recently submitted (prevents duplicates).

**Parameters:**
- `orderData` (object): Order data to check

**Returns:**
- `boolean`: true if duplicate detected within 5 minutes

**Example:**
```javascript
const order = {
  name: 'محمد',
  phone: '01001234567',
  address: 'القاهرة',
  price: 150
};

if (isDuplicateOrder(order)) {
  console.log('This order was recently submitted');
}
```

---

### recordSubmittedOrder(orderData)
Records submitted order to prevent duplicates.

**Parameters:**
- `orderData` (object): Order data to record

**Returns:**
- `void`

**Example:**
```javascript
recordSubmittedOrder(orderData);
// Keeps last 50 orders
```

---

## Format Functions

### formatItemDisplay(itemId, quantity)
Formats item display string.

**Parameters:**
- `itemId` (string): Item identifier (tomato, onion, etc.)
- `quantity` (number): Item quantity

**Returns:**
- `string`: Formatted display string

**Example:**
```javascript
formatItemDisplay('tomato', 5);        // "🍅 طماطم 5 كجم"
formatItemDisplay('chili', 2);         // "🌶️ شطة 2 وحدة"
```

---

### formatOrderDetails(packageData)
Formats order details for display.

**Parameters:**
- `packageData` (object): Package data

**Returns:**
- `string`: Formatted order details (newline separated)

**Example:**
```javascript
const details = formatOrderDetails(currentPackage);
// Returns: "🍅 طماطم 5 كجم\n🧅 بصل 3 كجم\n..."
```

---

### formatDateArabic(date)
Formats date to Arabic locale.

**Parameters:**
- `date` (Date, optional): Date to format (default: today)

**Returns:**
- `string`: Arabic formatted date

**Example:**
```javascript
formatDateArabic();                    // "الجمعة، 31 يناير 2026"
formatDateArabic(new Date(2026, 0, 1)); // "الخميس، 1 يناير 2026"
```

---

### sanitizeHTML(text)
Escapes HTML special characters (XSS prevention).

**Parameters:**
- `text` (string): Text to sanitize

**Returns:**
- `string`: Sanitized text

**Example:**
```javascript
sanitizeHTML('<script>alert("xss")</script>');
// Returns: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"

sanitizeHTML('محمد & علي');
// Returns: "محمد &amp; علي"
```

---

## Messaging Functions

### encodeForWhatsApp(text)
URL encodes string for WhatsApp API.

**Parameters:**
- `text` (string): Text to encode

**Returns:**
- `string`: URL encoded text

**Example:**
```javascript
encodeForWhatsApp('مرحباً، كيف حالك؟');
// Returns: "%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D9%83%D9%8A%D9%81%20%D8%AD%D8%A7%D9%84%D9%83%D8%9F"
```

---

### buildWhatsAppUrl(phoneNumber, message)
Builds WhatsApp message URL.

**Parameters:**
- `phoneNumber` (string): Recipient phone (format: 20XXX...)
- `message` (string): Message text

**Returns:**
- `string`: WhatsApp URL

**Example:**
```javascript
const url = buildWhatsAppUrl(
  '201001234567',
  'مرحباً، كيف حالك؟'
);
// Returns: "https://wa.me/201001234567?text=..."
```

---

### openWhatsAppChat(phoneNumber, message)
Opens WhatsApp with pre-filled message.

**Parameters:**
- `phoneNumber` (string): Recipient phone
- `message` (string): Message text

**Returns:**
- `void`

**Example:**
```javascript
openWhatsAppChat('201001234567', 'هل توجد حلويات متاحة؟');
// Opens WhatsApp with message
```

---

### sendWhatsAppNotification(orderData)
Sends WhatsApp notification to customer.

**Parameters:**
- `orderData` (object): Order data {name, phone, price}

**Returns:**
- `void`

**Example:**
```javascript
sendWhatsAppNotification({
  name: 'محمد أحمد',
  phone: '201001234567',
  price: 150
});
```

---

### submitOrderToSheets(orderData)
Submits order to Google Sheets.

**Parameters:**
- `orderData` (object): Order data {name, phone, address, price, packageData, frequency}

**Returns:**
- `Promise<boolean>`: true if successful

**Example:**
```javascript
const orderData = {
  name: 'محمد أحمد',
  phone: '201001234567',
  address: 'القاهرة - المعادي',
  price: 150,
  packageData: currentPackage,
  frequency: 'أسبوعي'
};

const success = await submitOrderToSheets(orderData);
if (success) {
  console.log('Order submitted successfully');
}
```

---

## DOM Functions

### getElement(id)
Safely gets element by ID.

**Parameters:**
- `id` (string): Element ID

**Returns:**
- `HTMLElement|null`: Element or null if not found

**Example:**
```javascript
const cartEl = getElement('cartContent');
if (cartEl) {
  cartEl.innerHTML = '<p>Cart loaded</p>';
}
```

---

### createElement(tag, className, content)
Creates element with class and content.

**Parameters:**
- `tag` (string): HTML tag name
- `className` (string, optional): CSS class name
- `content` (string, optional): Element content (HTML)

**Returns:**
- `HTMLElement`: Created element

**Example:**
```javascript
const div = createElement('div', 'error-message', '❌ حدث خطأ');
document.body.appendChild(div);
```

---

### showElement(el)
Shows element by clearing display property.

**Parameters:**
- `el` (HTMLElement): Element to show

**Returns:**
- `void`

**Example:**
```javascript
const modal = getElement('packageModal');
showElement(modal);
```

---

### hideElement(el)
Hides element by setting display to none.

**Parameters:**
- `el` (HTMLElement): Element to hide

**Returns:**
- `void`

**Example:**
```javascript
const modal = getElement('packageModal');
hideElement(modal);
```

---

## Application Functions

### selectPackage(packageId)
Selects and saves predefined package.

**Parameters:**
- `packageId` (string): Package ID (week, half, daily, month)

**Returns:**
- `void`

**Example:**
```javascript
selectPackage('week');
// Saves to localStorage and redirects to cart.html
```

---

### openPackageOptions(packageId)
Opens package customization dialog.

**Parameters:**
- `packageId` (string): Package ID

**Returns:**
- `void`

**Example:**
```javascript
openPackageOptions('week');
```

---

### confirmPackageOptions()
Confirms package customization and adds to cart.

**Parameters:**
- None

**Returns:**
- `void`

**Example:**
```javascript
// Called from confirmation button in modal
confirmPackageOptions();
```

---

### addCustomPackageToCart()
Adds custom package to cart.

**Parameters:**
- None

**Returns:**
- `void`

**Example:**
```javascript
// Called after custom item selection
addCustomPackageToCart();
```

---

### updateCartDisplay()
Updates cart display on current page.

**Parameters:**
- None

**Returns:**
- `void`

**Example:**
```javascript
updateCartDisplay();
```

---

### renderCart()
Renders full cart page with form.

**Parameters:**
- None

**Returns:**
- `void`

**Example:**
```javascript
renderCart();
```

---

### handleOrderSubmit(e)
Handles order form submission.

**Parameters:**
- `e` (Event): Form submit event

**Returns:**
- `Promise<void>`

**Example:**
```javascript
form.addEventListener('submit', handleOrderSubmit);
```

---

## Notification Functions

### showSuccessMessage(message, title)
Shows success alert using SweetAlert.

**Parameters:**
- `message` (string): Success message
- `title` (string, optional): Alert title

**Returns:**
- `void`

**Example:**
```javascript
showSuccessMessage('تم حفظ البيانات', '✅ نجح');
```

---

### showErrorMessage(message, title)
Shows error alert using SweetAlert.

**Parameters:**
- `message` (string): Error message
- `title` (string, optional): Alert title

**Returns:**
- `void`

**Example:**
```javascript
showErrorMessage(ERROR_MESSAGES.INVALID_PHONE);
```

---

### showWarningMessage(message, title)
Shows warning alert.

**Parameters:**
- `message` (string): Warning message
- `title` (string, optional): Alert title

**Returns:**
- `void`

**Example:**
```javascript
showWarningMessage('هذا الإجراء لا يمكن التراجع عنه');
```

---

### showConfirmation(message, title)
Shows confirmation dialog.

**Parameters:**
- `message` (string): Confirmation message
- `title` (string, optional): Dialog title

**Returns:**
- `Promise<boolean>`: User confirmation

**Example:**
```javascript
const confirmed = await showConfirmation('هل تريد المتابعة؟');
if (confirmed) {
  // User confirmed
}
```

---

## Usage Examples

### Complete Order Flow

```javascript
// 1. Select package
selectPackage('week');

// 2. User fills form (automatic via renderCart)

// 3. Submit order (automatic via handleOrderSubmit)

// 4. Validation (automatic via validateName, etc.)

// 5. Save to sheets (automatic via submitOrderToSheets)

// 6. Send notification (automatic via sendWhatsAppNotification)

// 7. Success message (automatic via showSuccessMessage)
```

### Custom Package

```javascript
// 1. Show custom form
showCustomPackageForm();

// 2. User selects items
// (automatic input handling)

// 3. Add to cart
addCustomPackageToCart();

// 4. View cart
loadCartData();
```

### Price Update

```javascript
// Update item price
PRODUCTS.tomato.unitPrice = 20;

// Recalculate
const newPrice = calculatePackagePrice(PACKAGES.week);

// Update display
updateCartDisplay();

// Show notification
showSuccessMessage('تم تحديث السعر', '💰 سعر جديد');
```

---

**Last Updated**: January 31, 2026  
**Version**: 1.0.0
