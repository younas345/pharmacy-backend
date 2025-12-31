# Deal of the Day - Design & Implementation

## Scenarios & Requirements

### Scenario 1: Manual Selection by Admin (Primary)
- Admin manually selects which deal should be "Deal of the Day"
- Admin can change it anytime
- Admin can set expiration date (optional)
- Only one deal can be "Deal of the Day" at a time
- When admin sets a new one, the old one is automatically unset

### Scenario 2: Automatic Fallback (Secondary)
- If no manual "Deal of the Day" exists or it has expired
- System automatically selects based on criteria:
  - **Best Savings %** (highest discount percentage)
  - **Most Popular** (most items sold)
  - **Newest Deal** (most recently posted)
  - **Highest Stock** (most quantity available)
- Selection rotates daily or when criteria changes

### Scenario 3: Priority System
1. **Manual Selection** (Highest Priority)
   - Admin explicitly sets a deal
   - Stays until admin changes it or expiration date
   
2. **Automatic Selection** (Fallback)
   - Only used if no manual selection exists
   - Criteria: Best savings percentage among active deals
   - Updates automatically when better deals appear

## Database Schema

### Add to `marketplace_deals` table:
```sql
ALTER TABLE marketplace_deals
ADD COLUMN is_deal_of_the_day BOOLEAN DEFAULT FALSE,
ADD COLUMN deal_of_the_day_until TIMESTAMP WITH TIME ZONE NULL;

-- Index for quick lookup
CREATE INDEX idx_marketplace_deals_deal_of_day 
ON marketplace_deals(is_deal_of_the_day) 
WHERE is_deal_of_the_day = TRUE;
```

### Fields:
- `is_deal_of_the_day`: Boolean flag (only one TRUE at a time)
- `deal_of_the_day_until`: Optional expiration timestamp
  - If NULL: Manual selection stays until admin changes it
  - If set: Auto-expires at that time, falls back to automatic

## Business Logic

### Rules:
1. **Only ONE deal can be "Deal of the Day" at a time**
2. **Manual selection always takes priority**
3. **Automatic selection only when no manual selection exists**
4. **Expired manual selections automatically fall back to automatic**
5. **Deal must be "active" to be Deal of the Day**

### Selection Criteria (Automatic):
1. Status = 'active'
2. Expiry date > today
3. Remaining quantity > 0
4. Sort by: Savings percentage (descending)
5. If tie: Sort by posted_date (newest first)

## API Endpoints

### For Pharmacy (Frontend):
- `GET /api/marketplace/deal-of-the-day`
  - Returns current Deal of the Day
  - Returns automatic selection if no manual one exists

### For Admin:
- `POST /api/admin/marketplace/deals/:id/set-deal-of-the-day`
  - Sets a deal as Deal of the Day
  - Body: `{ expiresAt?: string }` (optional)
  
- `DELETE /api/admin/marketplace/deals/:id/unset-deal-of-the-day`
  - Removes Deal of the Day status
  - Falls back to automatic selection

- `GET /api/admin/marketplace/deal-of-the-day`
  - Get current Deal of the Day (manual or automatic)

## Implementation Plan

1. **Database Migration** - Add columns
2. **RPC Function** - `get_deal_of_the_day()` - Returns current deal
3. **Admin RPC Functions** - Set/unset deal of the day
4. **Backend Service** - Handle business logic
5. **Backend Routes** - API endpoints
6. **Frontend Update** - Use new API instead of first deal

