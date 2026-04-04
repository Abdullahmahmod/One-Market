# Category Management Feature - Documentation

**Feature Status**: ✅ Complete  
**Date Implemented**: 2026-03-23  
**Scope**: Admin dashboard with real-time category control on main website

## 📋 Overview

The Category Management feature allows admins to **enable/disable product categories** (Vegetables, Fruits, Herbs) with immediate effect on the store. When a category is disabled:
- Category filter button is hidden from customers
- Products in that category don't appear in search results
- Category is removed from filter options

## 🏗️ Architecture

### Admin Panel (Backend Control)
**Location**: `/admin/price-control.html`

**Section**: "📂 إدارة الأصناف" (Category Management)

**Features**:
- Toggle switches for each category
- Real-time product count per category
- Bulk actions: "Enable All" / "Disable All"
- Save settings with confirmation

### Settings Storage
**Key**: `localStorage.categorySettings`

```javascript
{
  "vegetables": true,      // خضار
  "fruits": true,          // فواكه  
  "herbs": true            // خضرة
}
```

**Default**: All categories enabled

### Main Website (Frontend Enforcement)
**Locations**: 
- `/index.html` - Product homepage
- `/shop.html` - Full shop page

**Integration**:
- Disabled categories' filter buttons are hidden
- Products in disabled categories are filtered out
- Real-time updates when admin changes settings

## 🎯 How It Works

```
┌─────────────────────────────┐
│    Admin Panel               │
│  price-control.html         │
│  ✓ Check/Uncheck category  │
│  ✓ Click "حفظ الإعدادات"    │
└──────────────┬──────────────┘
               │
               ↓ Saves to
         ┌─────────────────────┐
         │ localStorage         │
         │ categorySettings     │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────┐
         │ Triggers event:      │
         │categories:updated   │
         └──────────┬──────────┘
                    ↓
        ┌───────────────────────┐
        │  index.html /         │
        │  shop.html            │
        │  ✓ updateCategoryVis  │
        │  ✓ filterProducts      │
        │  ✓ Re-render           │
        └───────────────────────┘
                    │
                    ↓
         ✅ Customers see only
         enabled category buttons
         ✅ Products updated
```

## 📊 Category Definitions

### Vegetables (خضار)
Products with unit "كجم", "حبة", or "وحدة"  
Excludes fruits and herbs  
**Default Products**: tomato, cucumber, onion, potato, carrot, etc.

### Fruits (فواكه)
Predefined list: apple, orange, banana, strawberry, mango, etc.

### Herbs (خضرة)
Products with unit "حزمة"  
Examples: fresh herbs, lettuce bundles, etc.

## 🔧 Implementation Details

### Admin Panel JavaScript
**File**: `admin/price-control.html`

**Key Functions**:
- `getCategorySettings()` - Loads current state from localStorage
- `saveCategorySettings()` - Saves and broadcasts update event
- `enableAllCategories()` / `disableAllCategories()` - Bulk operations
- `toggleCategory(categoryId)` - Toggle individual category
- `renderCategoryManagement()` - Render UI with current state
- `getCategoryProductCount(categoryId)` - Display product stats

**CSS Classes**:
- `.category-section` - Main container
- `.category-card` - Individual category card
- `.category-card.active` - When enabled (green background)
- `.category-card.inactive` - When disabled (grayed out)

### Website JavaScript
**Files**: `index.html`, `shop.html`

**Key Functions**:
- `isActiveCategoryEnabled(categoryId)` - Check if category is enabled
- `getProductCategory(productId, product)` - Determine product's category
- `getVisibleProducts()` - Filter by enabled categories
- `updateCategoryVisibility()` - Show/hide filter buttons
- Event listener for `categories:updated` custom event

## 🧪 Testing Guide

### Test 1: Disable a Category

**Steps**:
1. Go to `/admin/price-control.html`
2. In "📂 إدارة الأصناف" section, uncheck "فواكه" (Fruits)
3. Click "💾 حفظ الإعدادات"
4. Go to `/index.html` in new tab

**Expected Results**:
- ✅ "فواكه" filter button is hidden
- ✅ Fruits (apple, banana, etc.) don't appear in grid
- ✅ Console shows: "تم حفظ إعدادات الأصناف بنجاح"
- ✅ Check browser DevTools Console:
  ```javascript
  JSON.parse(localStorage.getItem('categorySettings'))
  // Output: {vegetables: true, fruits: false, herbs: true}
  ```

### Test 2: Re-enable All Categories

**Steps**:
1. Go to `/admin/price-control.html`
2. Click "✅ تفعيل الكل"
3. Click "💾 حفظ الإعدادات"
4. Refresh `/index.html`

**Expected Results**:
- ✅ All category buttons visible
- ✅ All products appear in grid
- ✅ localStorage updated: `{vegetables: true, fruits: true, herbs: true}`

### Test 3: Mixed Disable/Enable

**Steps**:
1. Uncheck only "خضرة" (Herbs)
2. Save
3. Go to index.html

**Expected Results**:
- ✅ "خضار" and "فواكه" buttons visible
- ✅ "خضرة" button hidden
- ✅ Only vegetables and fruits displayed
- ✅ No herb products visible even if searched

### Test 4: Category Button Behavior

**Steps**:
1. Disable "فواكه"
2. Go to `/index.html`
3. Try clicking the hidden category buttons area

**Expected Results**:
- ✅ "فواكه" button area is empty (hidden with `display: none`)
- ✅ Can still click "الكل", "خضار", "خضرة"
- ✅ Cannot interact with disabled category

### Test 5: Search Respects Categories

**Steps**:
1. Disable "فواكه"
2. Go to `/index.html`
3. Search for "apple" in search box

**Expected Results**:
- ✅ No results shown
- ✅ Empty state: "لا توجد منتجات متاحة حالياً."
- ✅ Message appears even though "apple" product exists

### Test 6: Real-time Update

**Steps**:
1. Open `/index.html` in first browser tab
2. Open `/admin/price-control.html` in second tab
3. Disable "فواكه" and save
4. Go back to first tab (index.html)
5. You should see changes immediately if page refreshes (or refresh manually)

**Expected Results**:
- ✅ Category buttons update
- ✅ Products grid updates
- ✅ Fruits disappear from view

## 📊 Product Category Assignment

### Automatic Detection
**Vegetables** (`vegetables`):
- Default for most products
- Unit is "كجم", "حبة", or "وحدة" AND
- NOT in FRUIT_IDS list AND  
- Unit is NOT "حزمة"

**Fruits** (`fruits`):
- Product ID is in predefined FRUIT_IDS set
- FRUIT_IDS: apple, orange, banana, strawberry, mango, date, fig, guava, etc.

**Herbs** (`herbs`):
- Unit is "حزمة" (bundle)
- Examples: parsley bundle, lettuce bundle

### Custom Products
When adding custom product, category is auto-assigned based on unit selected:
- Select "كجم", "حبة", or "وحدة" → Vegetables
- Select "حزمة" → Herbs
- To create fruit, admin must manually update PRODUCTS object

## 💾 Data Persistence

### Storage Format
```javascript
// admin/price-control.html reads/writes:
localStorage.categorySettings = JSON.stringify({
  vegetables: boolean,
  fruits: boolean,
  herbs: boolean
});

// website reads this and stores in memory:
const settings = JSON.parse(localStorage.getItem('categorySettings'));
```

### Default Behavior
If `categorySettings` doesn't exist (first time):
```javascript
const settings = JSON.parse(
  localStorage.getItem('categorySettings') || 
  '{"vegetables":true,"fruits":true,"herbs":true}'
);
```

## 🔗 Event System

### Custom Event: `categories:updated`
Fired when admin saves category settings

**Listener Code** (in website):
```javascript
document.addEventListener('categories:updated', () => {
  updateCategoryVisibility();
  if (viewState.category !== 'all' && !isActiveCategoryEnabled(viewState.category)) {
    viewState.category = 'all';
  }
  renderProducts();
});
```

**Dispatch Code** (in admin):
```javascript
document.dispatchEvent(new CustomEvent('categories:updated', { detail: settings }));
```

## ⚙️ Configuration

### Edit Categories
To add/remove categories, modify in `admin/price-control.html`:

```javascript
const CATEGORIES = {
  vegetables: { name: 'خضار', emoji: '🥬', label: 'الخضراوات' },
  fruits: { name: 'فواكه', emoji: '🍎', label: 'الفواكه' },
  herbs: { name: 'خضرة', emoji: '🌿', label: 'الأعشاب' },
  // ADD NEW CATEGORY HERE
};
```

### Modify Fruit List
Edit in `index.html` and `shop.html`:

```javascript
const FRUIT_IDS = new Set([
  'apple', 'orange', ..., 'pineapple'
  // ADD FRUIT IDs HERE
]);
```

## 🚀 Future Enhancements

1. **Firebase Sync**: Save category settings to Firebase
2. **Category Icons**: Custom emoji/images per category
3. **Seasonal Toggles**: Schedule category enable/disable
4. **Bundle Categories**: Group multiple categories
5. **Mobile Optimization**: Better UI for small screens

## 📋 Checklist

- [x] Admin panel category management UI
- [x] localStorage storage and retrieval
- [x] Category filter buttons visibility toggle
- [x] Product filtering by enabled categories
- [x] Search respects category settings
- [x] Real-time updates via custom events
- [x] Both index.html and shop.html support
- [x] Default values for first use
- [x] Visual feedback (enabled/disabled styling)
- [x] Product count display

---

**Last Updated**: 2026-03-23  
**Feature Author**: Copilot  
**Status**: Ready for Testing ✅
