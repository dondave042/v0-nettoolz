# Category Selection - Data Flow & UI Interaction Diagram

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│          ADMIN PRODUCTS DASHBOARD LOADS                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Component mounts (useEffect)      │
        │  Calls: fetchData()                │
        └───────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ Fetch /api/  │        │ Fetch /api/  │
        │ admin/       │        │ admin/       │
        │ products     │        │ categories   │
        └──────────────┘        └──────────────┘
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ Products OK? │        │ Categories   │
        │ (200)        │        │ OK? (200)    │
        └──────────────┘        └──────────────┘
           │                        │
      YES  │   NO            YES    │   NO
          ▼   ▼                 ▼    ▼
          ✓  ✗                  ✓   ✗
          │  │                  │   └─────────────────┐
          │  └─ Error Toast     │                     │
          │     "Failed to      │                     │
          │      load products" │    setCategoriesError
          │                     │    Show error message
          ▼                     ▼    Disable dropdown
    Display table    Show available
    (empty if error) categories in
                     dropdown & filter
```

---

## Category Selection in Product Modal

```
┌─────────────────────────────────────────────────────────────┐
│       USER CLICKS "NEW PRODUCT" BUTTON                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  Modal opens (showProductModal)    │
        │  Form initialized (emptyForm)      │
        └───────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │   Render Product Form              │
        │   - SKU field                       │
        │   - Name field                      │
        │   - Price field                     │
        │   - Available Qty field             │
        │   ► CATEGORY DROPDOWN  ◄            │  CRITICAL!
        │   - Description field               │
        │   - Image URL field                 │
        │   - Shared Credentials              │
        │   - Individual Credentials          │
        └───────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  ┌──────────────────┐          ┌──────────────────┐
  │ Categories array │          │ categoriesError  │
  │ has items?       │          │ is set?          │
  └──────────────────┘          └──────────────────┘
        │                               │
    YES │   NO                      YES │   NO
        ▼   ▼                          ▼   ▼
        ✓   ✗                          ✗   ✓
        │   │                          │   │
        │   │                          │   └─ Show dropdown
        │   │                          │      with categories
        │   │                          │      (Enabled)
        │   │                          │
        │   └──────────────┐           │
        │                  │           │
        ▼                  ▼           ▼
    Select <option>    Show Error    Dropdown is
    dropdown with      Alert:        functional
    category list      "Cannot       User can
    (Enabled)          load         select category
                       categories"
                       - Retry btn
                       (Disabled)
```

---

## Category Data Loading - Detailed Flow

```
API REQUEST SEQUENCE
═══════════════════════════════════════════════════════════════

                    ┌──────────────────────────┐
                    │  /api/admin/categories   │
                    └──────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    ▼                        ▼
            ┌──────────────────┐    ┌──────────────────┐
            │ Check Admin      │    │ Get Admin        │
            │ Session Valid?   │    │ Session          │
            └──────────────────┘    └──────────────────┘
                    │                        │
              YES   │   NO                   │
                    ▼   ▼                    │
                    ✓   ✗                    │
                    │   │                    │
                    │   └─ Return 401        │
                    │      "Unauthorized"    │
                    │
                    ▼
        ┌──────────────────────────┐
        │ Ensure Default           │
        │ Categories in DB         │
        │ (if empty)               │
        └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ Query:                   │
        │ SELECT * FROM categories│
        │ ORDER BY sort_order      │
        └──────────────────────────┘
                    │
            ┌───────┴───────┐
            ▼               ▼
      ┌─────────┐    ┌──────────────┐
      │ Found 7 │    │ No categories│
      │ rows    │    │ found (0)    │
      └─────────┘    └──────────────┘
            │              │
            ▼              ▼
      Return 200    Return 200
      [Category]    []
      array         (empty array)
            │              │
            └──────┬───────┘
                   ▼
        ┌──────────────────────────┐
        │ Response reaches client  │
        │ setCategories([...])     │
        │ setCategoriesError(null) │
        └──────────────────────────┘
                    │
                    ▼
        Dropdown renders with
        available options
```

---

## Problem Scenarios - Decision Tree

```
╔════════════════════════════════════════════════════════════════╗
║         USER UNABLE TO ADD PRODUCT - ROOT CAUSE ANALYSIS        ║
╚════════════════════════════════════════════════════════════════╝

                    SYMPTOM OBSERVED
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
    Dropdown        No category        Category not
    appears         options visible    saving
    disabled              │                 │
        │                 │                 │
        │      ┌──────────┼──────────┐      │
        │      ▼          ▼          ▼      │
        │   Empty    API call   Categories
        │  categories  fails    not loaded
        │   array              (NULL)
        │      │                      │
        │      └───────┬──────────────┘
        │              ▼
        │    Check Network tab
        │    GET /api/admin/categories
        │              │
        │     ┌────────┼────────┐
        │     ▼                 ▼
        │   200 OK         Error (401/500)
        │   Empty []          │
        │     │               ▼
        │     │         Auth issue or
        │     │         server error
        │     │              │
        │     └──────┬───────┘
        │            ▼
        │    Database table
        │    not populated
        │            │
        ▼            ▼
    Categories   Run migration:
    not in DB    INSERT INTO
    yet          categories...
    │            │
    │            ▼
    │    Refresh admin page
    │            │
    │            ▼
    │    Retry fetching
    │    categories
    │            │
    └────────────┴─────────────────►  RESOLVED ✓
```

---

## Form State & Data Type Flow

```
FORM STATE IN COMPONENT:
═════════════════════════════════════════════════════════════════

    type ProductForm = {
        category_id: string      ← MUST BE STRING
        // ... other fields
    }

    Dropdown HTML:
    <select value={form.category_id}>
        <option value="">Uncategorized</option>
        <option value="1">APPLE ID</option>
        <option value="2">ESIM</option>
        ...
    </select>

    Event Handler:
    onChange={(event) => setForm((prev) => ({
        ...prev,
        category_id: event.target.value  ← Returns STRING
    }))}

    Saving to Backend:
    {
        category_id: form.category_id ? Number(form.category_id) : null
                                  ▲
                                  └─ Converted to number before saving
    }

    Result in Database:
    UPDATE products SET category_id = 42 WHERE id = 1
                                    ▲ (integer type in DB)
```

---

## Error Handling Flow - Enhanced Version

```
BEFORE (No error handling):
───────────────────────────────────────────────────────────────
    Categories API fails
           │
           ▼
    Error thrown
           │
           ▼
    Toast shows generic error
           │
           ▼
    Dropdown has no options
           │
           ▼
    User blocked from creating product
           │
           ▼
    No retry mechanism


AFTER (With error handling):
───────────────────────────────────────────────────────────────
    Categories API fails
           │
           ▼
    setCategoriesError(errorMsg)
           │
           ▼
    Products still load & display
           │
           ▼
    Error alert shown:
    ┌────────────────────────────┐
    │ ⚠️  Cannot load categories  │
    │ Connection timeout. Please  │
    │ try again.                  │
    │ [Retry] button              │
    └────────────────────────────┘
           │
           ▼
    User can:
    ✓ Still view existing products
    ✓ Edit other product details
    ✓ Click Retry to reload categories
           │
           ▼
    Click Retry → fetchData(true)
           │
           ▼
    Categories API called again
           │
    ┌──────┴──────┐
    ▼             ▼
   Success      Still fails
    │             │
    ▼             ▼
  Error cleared  User informed
  Dropdown      of persistent
  enabled       issue
  Products added ✓
```

---

## UI States - Category Dropdown

### State 1: Loading Categories (Initial)
```
┌─────────────────────────────────────────┐
│ Category                 Loading...      │
│ ┌─────────────────────────────────────┐ │
│ │ (spinner) Categories loading        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### State 2: Categories Loaded Successfully
```
┌─────────────────────────────────────────┐
│ Category                                │
│ ┌─────────────────────────────────────┐ │
│ │ ▼ Uncategorized                     │ │
│ │   APPLE ID                          │ │
│ │   ESIM                              │ │
│ │   FACEBOOK INSTAGRAM                │ │
│ │   ...                               │ │
│ └─────────────────────────────────────┘ │
│  [Enabled dropdown, ready for selection] │
└─────────────────────────────────────────┘
```

### State 3: Error Loading Categories
```
┌─────────────────────────────────────────┐
│ Category                                │
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️  Cannot load categories           │ │
│ │ Error: API returned 401 Unauthorized │ │
│ │ [Retry loading categories]           │ │
│ └─────────────────────────────────────┘ │
│  [Dropdown disabled, error shown]        │
└─────────────────────────────────────────┘
```

### State 4: No Categories in Database
```
┌─────────────────────────────────────────┐
│ Category                                │
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️  Cannot load categories           │ │
│ │ Error: Database table is empty      │ │
│ │ [Retry loading categories]           │ │
│ │ or create categories in Admin panel  │ │
│ └─────────────────────────────────────┘ │
│  [Instructions provided to user]        │
└─────────────────────────────────────────┘
```

---

## Database Query Execution

```
┌──────────────────────────────────────────┐
│   GET /api/admin/categories              │
└──────────────────────────────────────────┘
                    │
                    ▼
        ┌────────────────────────────┐
        │ const session =             │
        │   await getAdminSession()   │
        └────────────────────────────┘
                    │
            ┌───────┴───────┐
            ▼               ▼
        Session?        No session
            │               │
            ▼               ▼
           YES             Return
                           401 ✗
            │
            ▼
    const sql = getDb()
    await ensureDefaultCategories(sql)
            │
            ▼
    SELECT * FROM categories
            │
            ▼
    ┌─────────────────────────┐
    │ Categories found?       │
    └─────────────────────────┘
            │
        ┌───┴───┐
        ▼       ▼
       YES      NO
        │       └─ CREATE default
        │           categories
        ▼           │
    Return:        ▼
    200 OK       CREATE INSERT...
    [
      {id:1, name:"APPLE ID"},
      {id:2, name:"ESIM"},
      ...
    ]
```

---

## Impact Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    CATEGORY SELECTION FAILURE                    │
│                          IMPACT ANALYSIS                          │
├─────────────────────────────────────────────────────────────────┤
│ SCENARIO              │ USER IMPACT           │ SEVERITY          │
├───────────────────────┼───────────────────────┼───────────────────┤
│ Categories not in DB  │ Cannot create any     │ CRITICAL          │
│                       │ product with category │ 🔴 BLOCKS ALL OPS │
├───────────────────────┼───────────────────────┼───────────────────┤
│ API fails (401)       │ Must login as admin   │ HIGH              │
│                       │ again; session expired│ 🟠 LOGIN REQUIRED │
├───────────────────────┼───────────────────────┼───────────────────┤
│ API fails (500)       │ Must wait for server  │ HIGH              │
│                       │ recovery; no workaround│ 🟠 WAIT/RETRY     │
├───────────────────────┼───────────────────────┼───────────────────┤
│ Network timeout       │ Can retry; products   │ MEDIUM            │
│                       │ still display         │ 🟡 RETRY POSSIBLE │
├───────────────────────┼───────────────────────┼───────────────────┤
│ Category option not   │ Must manually enter   │ MEDIUM            │
│ visible (UI bug)      │ category ID or wait   │ 🟡 WORKAROUND OPS │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

```
□ Test: Categories load successfully
  - API returns 200 OK with category array
  - Dropdown displays all categories
  - User can select a category
  - Selection persists when form saves

□ Test: Categories API fails (401)
  - Error message displays to user
  - "Retry" button appears
  - Click retry → categories load
  - Can now proceed with product creation

□ Test: Categories API fails (500)
  - Error message displays
  - Retry button available
  - Shows server error details
  - Products can still be created (without category)

□ Test: Database table empty
  - Default categories auto-created on first call
  - Categories populate in dropdown
  - Selection works normally

□ Test: Network timeout
  - Error message shown
  - Products still display in table
  - Retry loads categories successfully

□ Test: Form state consistency
  - Selected category value stored correctly
  - Form category_id is string while in state
  - Converts to number before API call
  - Database stores correct integer ID
```
