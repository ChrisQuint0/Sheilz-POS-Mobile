# Database Structure Documentation

## Overview

This is a comprehensive database schema for a Point of Sale (POS) system designed for a coffee shop or similar retail environment. The system manages products, inventory, orders, and user profiles with detailed tracking capabilities.

---

## Core Tables

### 1. **profiles**

Stores user account information and authentication details.

| Column       | Type                     | Description                                                 |
| ------------ | ------------------------ | ----------------------------------------------------------- |
| id           | uuid (PK, FK)            | Primary key, references auth.users(id)                      |
| display_name | text NOT NULL            | User's display name                                         |
| email        | text NOT NULL            | User's email address                                        |
| avatar_url   | text                     | Optional profile picture URL                                |
| role         | text NOT NULL            | Default: 'Cashier'; Values: Administrator, Manager, Cashier |
| status       | text NOT NULL            | Default: 'Active'; Values: Active, Inactive                 |
| last_login   | timestamp with time zone | Timestamp of last login                                     |
| created_at   | timestamp with time zone | Creation timestamp (default: now())                         |
| updated_at   | timestamp with time zone | Last update timestamp (default: now())                      |

**Relationships:**

- Foreign key to `auth.users` (Supabase Auth)
- Referenced by: `orders.cashier_id`, `orders.created_by`, `orders.last_modified_by`, `inventory_transactions.user_id`, `audit_logs.user_id`

---

## Product Management

### 2. **product_categories**

Product categorization for organizing items.

| Column     | Type                     | Description                 |
| ---------- | ------------------------ | --------------------------- |
| id         | uuid (PK)                | Primary key, auto-generated |
| name       | text NOT NULL UNIQUE     | Category name               |
| created_at | timestamp with time zone | Creation timestamp          |

**Relationships:**

- Referenced by: `products.category_id`

### 3. **sizes**

Product size options (e.g., Small, Medium, Large).

| Column     | Type                     | Description                  |
| ---------- | ------------------------ | ---------------------------- |
| id         | uuid (PK)                | Primary key, auto-generated  |
| name       | text NOT NULL UNIQUE     | Size name                    |
| sort_order | integer NOT NULL         | Default: 0; Display ordering |
| created_at | timestamp with time zone | Creation timestamp           |

**Relationships:**

- Referenced by: `product_variants.size_id`

### 4. **temperatures**

Product temperature options (e.g., Hot, Iced).

| Column     | Type                     | Description                  |
| ---------- | ------------------------ | ---------------------------- |
| id         | uuid (PK)                | Primary key, auto-generated  |
| name       | text NOT NULL UNIQUE     | Temperature name             |
| sort_order | integer NOT NULL         | Default: 0; Display ordering |
| created_at | timestamp with time zone | Creation timestamp           |

**Relationships:**

- Referenced by: `product_variants.temperature_id`

### 5. **products**

Core product catalog.

| Column      | Type                     | Description                                          |
| ----------- | ------------------------ | ---------------------------------------------------- |
| id          | uuid (PK)                | Primary key, auto-generated                          |
| name        | text NOT NULL            | Product name                                         |
| category_id | uuid NOT NULL (FK)       | References product_categories                        |
| type        | text NOT NULL            | Default: 'Beverage'; Values: Beverage, Pastry, Other |
| description | text                     | Optional description                                 |
| image_url   | text                     | Optional product image                               |
| has_recipe  | boolean NOT NULL         | Default: false; Indicates if product has ingredients |
| is_visible  | boolean NOT NULL         | Default: true; Controls product visibility           |
| created_at  | timestamp with time zone | Creation timestamp                                   |
| updated_at  | timestamp with time zone | Last update timestamp                                |

**Relationships:**

- Foreign key: `category_id` → `product_categories(id)`
- Referenced by: `product_variants.product_id`, `product_recipes.product_id`, `order_items.product_id`

### 6. **product_variants**

Product variants with specific size and temperature combinations.

| Column         | Type               | Description                        |
| -------------- | ------------------ | ---------------------------------- |
| id             | uuid (PK)          | Primary key, auto-generated        |
| product_id     | uuid NOT NULL (FK) | References products                |
| size_id        | uuid (FK)          | References sizes                   |
| temperature_id | uuid (FK)          | References temperatures            |
| price          | numeric NOT NULL   | Default: 0; Price for this variant |

**Relationships:**

- Foreign keys to: `products(id)`, `sizes(id)`, `temperatures(id)`
- Referenced by: `product_recipes.variant_id`

---

## Inventory Management

### 7. **inventory_categories**

Inventory item categorization.

| Column     | Type                     | Description                 |
| ---------- | ------------------------ | --------------------------- |
| id         | uuid (PK)                | Primary key, auto-generated |
| name       | text NOT NULL UNIQUE     | Category name               |
| created_at | timestamp with time zone | Creation timestamp          |

**Relationships:**

- Referenced by: `inventory_items.category_id`

### 8. **inventory_units**

Unit of measurement for inventory items.

| Column     | Type                     | Description                        |
| ---------- | ------------------------ | ---------------------------------- |
| name       | text (PK)                | Unit name (e.g., kg, liter, piece) |
| created_at | timestamp with time zone | Creation timestamp                 |

**Relationships:**

- Referenced by: `inventory_items.unit` (foreign key)

### 9. **inventory_items**

Track raw materials and stock levels.

| Column              | Type                     | Description                        |
| ------------------- | ------------------------ | ---------------------------------- |
| id                  | uuid (PK)                | Primary key, auto-generated        |
| name                | text NOT NULL            | Item name                          |
| category_id         | uuid NOT NULL (FK)       | References inventory_categories    |
| unit                | text NOT NULL (FK)       | References inventory_units         |
| current_stock       | numeric NOT NULL         | Default: 0; Current quantity       |
| max_capacity        | numeric NOT NULL         | Default: 0; Maximum stock capacity |
| low_stock_threshold | numeric NOT NULL         | Default: 0; Alert threshold        |
| image_url           | text                     | Optional item image                |
| notes               | text                     | Optional notes                     |
| created_at          | timestamp with time zone | Creation timestamp                 |
| updated_at          | timestamp with time zone | Last update timestamp              |

**Relationships:**

- Foreign keys to: `inventory_categories(id)`, `inventory_units(name)`
- Referenced by: `product_recipes.inventory_item_id`, `inventory_transactions.inventory_item_id`

### 10. **product_recipes**

Recipe definitions linking products to inventory items.

| Column            | Type               | Description                 |
| ----------------- | ------------------ | --------------------------- |
| id                | uuid (PK)          | Primary key, auto-generated |
| product_id        | uuid NOT NULL (FK) | References products         |
| inventory_item_id | uuid NOT NULL (FK) | References inventory_items  |
| quantity          | numeric NOT NULL   | Quantity required           |
| unit              | text NOT NULL      | Unit of measurement         |
| variant_id        | uuid NOT NULL (FK) | Variant-specific recipe     |

**Relationships:**

- Foreign keys to: `products(id)`, `inventory_items(id)`, `product_variants(id)`

### 11. **inventory_transactions**

Tracks all inventory changes with detailed metadata.

| Column                 | Type                     | Description                                                                                         |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| id                     | uuid (PK)                | Primary key, auto-generated                                                                         |
| inventory_item_id      | uuid NOT NULL (FK)       | References inventory_items                                                                          |
| type                   | text NOT NULL            | Values: Replenishment, Automatic POS Deduction, Manual Adjustment, Waste/Spoilage, Stock Correction |
| previous_stock         | numeric NOT NULL         | Stock before transaction                                                                            |
| quantity_changed       | numeric NOT NULL         | Change amount (positive or negative)                                                                |
| new_stock              | numeric NOT NULL         | Stock after transaction                                                                             |
| user_id                | uuid (FK)                | References profiles                                                                                 |
| notes                  | text                     | Optional notes                                                                                      |
| delivery_cost          | numeric                  | Cost associated with delivery                                                                       |
| expense_payment_method | text                     | How delivery was paid                                                                               |
| supplier               | text                     | Supplier name                                                                                       |
| received_by            | text                     | Person who received items                                                                           |
| delivery_date          | date                     | Date of delivery                                                                                    |
| delivery_time          | text                     | Time of delivery                                                                                    |
| created_at             | timestamp with time zone | Transaction timestamp                                                                               |

**Relationships:**

- Foreign keys to: `inventory_items(id)`, `profiles(id)`

---

## Sales Management

### 12. **orders**

Core sales transaction table.

| Column             | Type                     | Description                                                               |
| ------------------ | ------------------------ | ------------------------------------------------------------------------- |
| id                 | uuid (PK)                | Primary key, auto-generated                                               |
| order_id           | text NOT NULL UNIQUE     | Human-readable order identifier                                           |
| customer_name      | text NOT NULL            | Default: 'Walk-In'; Customer name                                         |
| status             | text NOT NULL            | Default: 'Completed'; Values: Completed, Void (Not Made), Void (Consumed) |
| amount             | numeric NOT NULL         | Default: 0; Total order amount                                            |
| payment_method     | text NOT NULL            | Payment method used                                                       |
| cashier_id         | uuid (FK)                | References profiles (cashier)                                             |
| cashier_name       | text NOT NULL            | Denormalized cashier name                                                 |
| created_by         | uuid (FK)                | References profiles (creator)                                             |
| last_modified_by   | uuid (FK)                | References profiles (last modifier)                                       |
| last_modified_at   | timestamp with time zone | Last modification timestamp                                               |
| synced_from_device | text                     | Device identifier for sync                                                |
| synced_at          | timestamp with time zone | Sync timestamp                                                            |
| created_at         | timestamp with time zone | Order creation timestamp                                                  |

**Relationships:**

- Foreign keys to: `profiles(id)` (for cashier_id, created_by, last_modified_by)
- Referenced by: `order_items.order_id`

### 13. **order_items**

Line items within orders.

| Column      | Type               | Description                            |
| ----------- | ------------------ | -------------------------------------- |
| id          | uuid (PK)          | Primary key, auto-generated            |
| order_id    | uuid NOT NULL (FK) | References orders                      |
| product_id  | uuid (FK)          | References products                    |
| name        | text NOT NULL      | Denormalized product name              |
| size        | text               | Size selected (e.g., Small, Medium)    |
| temperature | text               | Temperature selected (e.g., Hot, Iced) |
| quantity    | integer NOT NULL   | Default: 1; Quantity ordered           |
| unit_price  | numeric NOT NULL   | Default: 0; Price per unit             |
| subtotal    | numeric NOT NULL   | Default: 0; Total for this item        |

**Relationships:**

- Foreign keys to: `orders(id)`, `products(id)`

---

## System Management

### 14. **payment_methods**

Available payment options.

| Column     | Type                     | Description                          |
| ---------- | ------------------------ | ------------------------------------ |
| id         | uuid (PK)                | Primary key, auto-generated          |
| name       | text NOT NULL UNIQUE     | Payment method name                  |
| is_enabled | boolean NOT NULL         | Default: true; Controls availability |
| created_at | timestamp with time zone | Creation timestamp                   |

### 15. **audit_logs**

Comprehensive audit trail for system actions.

| Column      | Type                     | Description                                                                            |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------- |
| id          | uuid (PK)                | Primary key, auto-generated                                                            |
| user_id     | uuid (FK)                | References profiles                                                                    |
| user_name   | text NOT NULL            | Denormalized user name                                                                 |
| user_role   | text NOT NULL            | User's role at time of action                                                          |
| user_email  | text NOT NULL            | User's email at time of action                                                         |
| category    | text NOT NULL            | Values: Authentication, Sales, Inventory, Team Management, Products, Analytics, System |
| action      | text NOT NULL            | Description of action taken                                                            |
| severity    | text NOT NULL            | Default: 'Low'; Values: Low, Medium, High, Critical                                    |
| target_type | text                     | Type of target entity                                                                  |
| target_id   | text                     | ID of target entity                                                                    |
| target_name | text                     | Name of target entity                                                                  |
| ip_address  | text                     | Source IP address                                                                      |
| device      | text                     | Device information                                                                     |
| details     | jsonb                    | Additional structured data                                                             |
| created_at  | timestamp with time zone | Log timestamp                                                                          |

**Relationships:**

- Foreign key: `user_id` → `profiles(id)`

---

## Key Relationships & Dependencies

### Product → Variant → Recipe Flow

```
products (1) ──┬── product_variants (many) ──┬── product_recipes (many)
               │                              │
               └── product_recipes (many)─────┘
```

- Products can have multiple variants (size/temperature combinations)
- Each product can have a recipe linking to inventory items
- Recipes can be specific to a variant

### Inventory Management Flow

```
inventory_categories (1) ── inventory_items (many)
inventory_units (1) ────── inventory_items (many)
inventory_items (1) ────── product_recipes (many)
inventory_items (1) ────── inventory_transactions (many)
```

### Order Processing Flow

```
profiles (1) ──── orders (many) ──── order_items (many)
products (1) ──── order_items (many)
```

### Audit Trail

```
profiles (1) ── audit_logs (many)
```

All significant actions are logged with user context and metadata.

---

## Important Business Rules & Constraints

### User Roles (Hierarchical)

- **Administrator**: Full system access
- **Manager**: Management-level access
- **Cashier**: Limited, sales-focused access

### Order Status Rules

- **Completed**: Successful transaction
- **Void (Not Made)**: Order canceled before preparation
- **Void (Consumed)**: Order canceled after preparation/consumption

### Inventory Transaction Types

- **Replenishment**: Stock added through purchase
- **Automatic POS Deduction**: Stock reduced by sales
- **Manual Adjustment**: Manual stock changes
- **Waste / Spoilage**: Removal due to waste
- **Stock Correction**: Correction of stock discrepancies

### Product Types

- Beverage
- Pastry
- Other

### Audit Categories

- Authentication: Login/logout, permission changes
- Sales: Order creation, modification, voiding
- Inventory: Stock changes, adjustments
- Team Management: Profile changes
- Products: Product catalog changes
- Analytics: Report generation
- System: System-level events

---

## Special Notes for AI Model

### Data Denormalization

The schema uses denormalization for performance in several places:

- `orders.cashier_name` stores the cashier name directly
- `order_items.name` stores product name
- `audit_logs.user_name`, `user_role`, `user_email` store user context at time of action

### Audit Trail Completeness

The `audit_logs` table is designed for comprehensive tracking:

- Stores both the target entity ID and its name at the time of action
- Includes IP address and device information for security
- Uses JSONB for flexible additional data storage

### Inventory Tracking

- Every inventory transaction stores before/after values
- Supports supplier and cost tracking for replenishment
- Includes delivery date/time for logistics management

### Recipe Management

- Products can have complex recipes with multiple inventory items
- Recipes can be variant-specific (e.g., different milk quantities for different sizes)
- Unit of measurement is tracked for each recipe component
- Variant recipes are required (NOT NULL constraint)

### Synchronization Support

- `orders.synced_from_device` and `synced_at` fields suggest offline/device synchronization support
- Indicates potential for multiple POS terminals or offline operations

### Database Constraints

- All tables use UUID primary keys with `gen_random_uuid()` for auto-generation
- Check constraints enforce valid values for enum-like columns (role, status, type, etc.)
- Foreign key constraints maintain referential integrity
