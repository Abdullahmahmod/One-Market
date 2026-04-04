# Custom Products Feature - Testing Guide

## ✅ Overview
The custom products feature allows admin users to add new products to the store without modifying code. These products are stored in localStorage and automatically loaded on the main website.

## 🔄 How It Works

### Data Flow
1. **Admin Panel** (`/admin/price-control.html`)
   - User adds new product with: ID, Name, Emoji, Price, Unit
   - Product is saved to localStorage under `'customProducts'` key
   - Product also added to global `PRODUCTS` object in memory

2. **Main Website** (`/index.html` and `/shop.html`)
   - On page load, `initProductsPage()` / `initializeApp()` runs
   - Loads custom products from localStorage: `JSON.parse(localStorage.getItem('customProducts'))`
   - Merges with PRODUCTS: `Object.assign(PRODUCTS, customProducts)`
   - Proceeds with normal price loading and rendering

3. **Storage Format**
```javascript
// localStorage key: 'customProducts'
{
  "custom_id_1": {
    "emoji": "🥬",
    "name": "ملوخية",
    "unit": "كجم",
    "label": "🥬 ملوخية",
    "unitPrice": 12
  },
  "custom_id_2": {
    "emoji": "🍅",
    "name": "طماطم حمراء",
    "unit": "كجم",
    "label": "🍅 طماطم حمراء",
    "unitPrice": 10
  }
}
```

## 🧪 Testing Steps

### Test 1: Add Custom Product from Admin Panel

**Steps:**
1. Open: `/admin/price-control.html`
2. Scroll to "➕ إضافة منتج جديد" section
3. Fill in form:
   - المعرّف (ID): `molokhia`
   - اسم المنتج: `ملوخية`
   - الإيموجي: `🥬`
   - السعر: `12`
   - الوحدة: `كجم`
4. Click: "➕ إضافة المنتج"

**Expected Results:**
- ✅ Success message: "تم إضافة منتج جديد: ملوخية"
- ✅ Product appears in admin table with "مخصص" (Custom) badge
- ✅ In browser console: Check localStorage `customProducts` key
  ```javascript
  // Open DevTools → Console
  JSON.parse(localStorage.getItem('customProducts'))
  // Should show your new product
  ```

### Test 2: View Custom Product on Main Site

**Steps:**
1. Open: `/index.html`
2. Look for the new product in the grid (e.g., "ملوخية")
3. Check console for loading message

**Expected Results:**
- ✅ Product appears in products grid with:
  - Correct emoji: 🥬
  - Correct name: ملوخية
  - Correct price: 12 جنيه/كجم
  - Can add to cart and view quantity controls
- ✅ Console shows: `✅ تم تحميل المنتجات المخصصة: 1`
- ✅ Can search for it: Type "ملوخية" in search box

### Test 3: Add to Cart & View in Shop

**Steps:**
1. From main site, add the custom product to cart
2. Navigate to `/shop.html`
3. Find the same product in shop page

**Expected Results:**
- ✅ Product available and functional in shop page
- ✅ Quantity is remembered across pages
- ✅ Product can be added/removed same as regular products

### Test 4: Reload and Persistence

**Steps:**
1. Add custom product from admin panel
2. Navigate to `/index.html`
3. Add product to cart (quantity > 0)
4. Refresh page with F5
5. Check if product is still visible

**Expected Results:**
- ✅ After refresh, product still visible and in cart
- ✅ Custom products load on every page load
- ✅ Data persists across browser sessions (until localStorage is cleared)

### Test 5: Delete Custom Product

**Steps:**
1. Go to `/admin/price-control.html`
2. Find the custom product in table (has "مخصص" badge)
3. Click "🗑" (delete) button
4. Confirm deletion

**Expected Results:**
- ✅ Product removed from admin table
- ✅ Product removed from `customProducts` in localStorage
- ✅ When you reload `/index.html`, product no longer appears

### Test 6: Default vs Custom Products

**Steps:**
1. Add a custom product (e.g., "ملوخية")
2. Go to admin panel
3. Look at both types of products in the table

**Expected Results:**
- ✅ Default products show "نشط" (Active) badge - no delete button
- ✅ Custom products show "مخصص" (Custom) badge - have delete button
- ✅ Both can be edited for price updates

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Custom product doesn't appear on main site | Check browser console for errors. Verify `customProducts` key exists in localStorage |
| Product appears but price is wrong | Check if price was saved correctly in admin panel. Verify `productPrices` localStorage key |
| Can't add custom product | Ensure all form fields are filled. Check browser console for validation errors |
| Product disappears after refresh | This is normal if you didn't check "Repeat Order". Custom products persist, but cart selection requires saving |
| Multiple custom products not loading | Check localStorage size. Browser usually allows ~5-10MB |

## 🛠️ Developer Notes

### Key Code Locations

**index.html - Custom product loading:**
```javascript
// Line 611: initProductsPage()
const customProducts = JSON.parse(localStorage.getItem('customProducts') || '{}');
Object.assign(PRODUCTS, customProducts);
```

**js/main.js - Custom product loading for shop:**
```javascript
// Line 589: initializeApp()
const customProducts = JSON.parse(localStorage.getItem('customProducts') || '{}');
Object.assign(PRODUCTS, customProducts);
```

**admin/price-control.html - Product creation:**
```javascript
// Line 560: addNewProduct()
// Saves to: localStorage.setItem('customProducts', JSON.stringify(customProducts))
```

### localStorage Keys Used
- `customProducts` - Stores all custom product definitions
- `productPrices` - Stores all product prices (updated when admin changes prices)
- `cartPackage` - Stores current cart state

## 📋 Verification Checklist

- [ ] Can add custom product from admin panel
- [ ] Custom product appears on main site after refresh
- [ ] Custom product can be added to cart
- [ ] Custom product appears in shop page
- [ ] Price updates reflect in cart calculation
- [ ] Can delete custom product from admin panel
- [ ] Custom products have correct badge ("مخصص")
- [ ] Default products still have delete prevention ("نشط")
- [ ] Multiple custom products work together
- [ ] Search finds custom products

## 🚀 Next Steps (Optional Enhancements)

1. **Firebase Sync**: Save custom products to Firebase in addition to localStorage
2. **CSV Import**: Bulk upload custom products from CSV file
3. **Category Auto-Assignment**: Automatically set category based on product name
4. **Image Upload**: Allow custom product images instead of emoji
5. **Stock Management**: Track inventory for custom products
6. **Expiration**: Set expiration dates for limited-time custom products

---

**Last Updated**: 2026-03-21
**Feature Status**: ✅ Ready for Testing
