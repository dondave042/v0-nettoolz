# Category Management Feature Documentation

## Overview

This document outlines the comprehensive category management system that has been implemented for the admin dashboard. The feature allows administrators to create, edit, and manage product categories with integrated image/icon upload capabilities.

## Features Implemented

### 1. **Category Management Page** (`/admin/categories`)

The dedicated categories page provides a complete interface for managing product categories with the following capabilities:

#### Create New Category Form
- **Category Name Input** - Required field for category name
- **Description Input** - Optional field for category description
- **Icon/Image Upload** - Drag-and-drop or click-to-upload interface for category icons
  - Accepts all common image formats (PNG, JPG, GIF, WebP, etc.)
  - File size limit: 5MB
  - Real-time preview of selected image
  - Clear/remove button to change selection

#### Category List Display
- Shows all existing categories in a sortable list
- Each category displays:
  - Category icon/image (or Package icon placeholder if none)
  - Category name
  - Category description
  - Edit and delete action buttons
  
#### Edit Category Functionality
- Click the pencil icon to edit any category
- In-place editing of:
  - Category name
  - Description
  - Icon/image (with preview and upload capability)
- Keyboard shortcuts:
  - Enter: Save changes
  - Escape: Cancel edit mode
- Loading state during save with spinner feedback

#### Delete Category Functionality
- Confirmation dialog before deletion
- Prevents deletion if category has products assigned
- Visual feedback with loading spinner during deletion

### 2. **Product Upload Integration**

The product upload form includes seamless category integration:

#### Category Selection Dropdown
- Pre-populated with all available categories
- "Uncategorized" option for products without a category
- Quick category switching without page reload

#### Create Category On-the-Fly
- "New" button next to the category dropdown
- Modal dialog for quick category creation
- Includes:
  - Category name (required)
  - Description (optional)
  - Icon upload (optional)
- Auto-selects newly created category in the product form
- Success notification confirms category was created

### 3. **API Endpoints**

#### GET `/api/admin/categories`
- Returns list of all categories
- Automatically creates default categories on first load
- Returns fields: `id`, `name`, `description`, `icon`, `sort_order`
- Requires admin authentication

#### POST `/api/admin/categories`
- Creates a new category
- Accepts FormData with:
  - `name` (string, required) - Category name
  - `description` (string, optional) - Category description
  - `icon` (File, optional) - Image file for category icon
- Stores icon as base64 data URL in database
- Returns created category with all fields

#### PUT `/api/admin/categories`
- Updates existing category
- Accepts FormData with:
  - `id` (number, required) - Category ID
  - `name` (string, required) - Updated name
  - `description` (string, optional) - Updated description
  - `icon` (File, optional) - New icon image
- Only updates icon if new image is provided
- Returns updated category

#### DELETE `/api/admin/categories`
- Deletes a category
- Prevents deletion if products are assigned
- Accepts JSON body with `id` field

## Technical Implementation

### Image Storage
- Images are converted to base64 data URLs for database storage
- Format: `data:image/png;base64,...`
- Stored in the `icon` column of the categories table
- Allows direct usage in img src attributes without separate file hosting

### Form Handling
- FormData API used for multipart/form-data submissions
- Automatic image validation:
  - File type checking (image files only)
  - File size validation (max 5MB)
  - User-friendly error messages
- Client-side preview before submission

### Database Schema
The `categories` table includes:
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR, UNIQUE)
- slug (VARCHAR, UNIQUE)
- description (TEXT, nullable)
- icon (VARCHAR, nullable) - Stores base64 data URL
- sort_order (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### UI/UX Features
- **Responsive Design**: Mobile-friendly image upload interfaces
- **Visual Feedback**: Loading spinners during API calls
- **Error Handling**: Clear error messages for validation failures
- **Icon Display**: Category icons shown as 10x10px thumbnails in list
- **Keyboard Navigation**: Enter and Escape keys for form submission/cancellation
- **Real-time Preview**: Image preview updates as soon as file is selected

## User Workflow

### Creating a Category
1. Navigate to Admin Dashboard → Categories
2. Fill in category name (required)
3. Add description (optional)
4. Click image upload area to select icon
5. Click "Create Category" button
6. Category appears in list immediately

### Editing a Category
1. Locate category in the list
2. Click pencil icon to enter edit mode
3. Update name, description, or icon as needed
4. Press Enter or click Save to confirm
5. Press Escape or click Cancel to discard changes

### Adding Product to Category
1. Navigate to Products page
2. Click "Add Product" or "Create New Product"
3. Select category from dropdown
4. Or click "New" button to create new category on-the-fly
5. Fill in product details and save

## Validation Rules

### Category Creation/Update
- **Name**: Required, must be at least 1 character
- **Description**: Optional, no length limit
- **Icon**: Optional
  - Must be a valid image file
  - Maximum file size: 5MB
  - Supported formats: PNG, JPG, GIF, WebP, AVIF, etc.

### Error Handling
- Duplicate category names: "Category already exists" (409 Conflict)
- File type errors: "Please select a valid image file"
- File size errors: "Image size must be less than 5MB"
- Database errors: Specific error messages from server

## Accessibility Features
- Semantic HTML labels for all form inputs
- Alt text for category icons in the list display
- Keyboard navigation support
- Screen reader friendly error messages
- Clear visual hierarchy with proper heading levels

## Future Enhancements
- Bulk category import/export
- Category hierarchy (parent/child categories)
- Category-specific product filtering
- Icon library/preset selection
- Category analytics and usage statistics
- Drag-to-reorder categories

## Testing Checklist
- [ ] Create category with all fields
- [ ] Create category with only name
- [ ] Create category and upload icon
- [ ] Edit category and update icon
- [ ] Edit category and remove icon
- [ ] Delete empty category
- [ ] Attempt to delete category with products
- [ ] Create category from product upload page
- [ ] Upload oversized image (>5MB)
- [ ] Upload non-image file
- [ ] Test keyboard shortcuts (Enter, Escape)
- [ ] Test on mobile devices
- [ ] Test category selection in product form
- [ ] Verify base64 images display correctly
