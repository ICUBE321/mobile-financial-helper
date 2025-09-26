# Budget Allocation Feature - Usage Guide

## Overview
The Budget Allocation feature allows users to:
- Set their monthly income
- Allocate percentages to Needs, Wants, and Savings
- View calculated amounts for each category
- Edit and update their budget allocation
- Select their preferred currency

## How to Use

### 1. Navigate to Budget Tab
- Open the app and tap on the "Budget" tab (calculator icon) at the bottom

### 2. Create Your First Budget
- If no budget exists, you'll see an empty state with a pie-chart icon
- Tap the "Edit" button (pencil icon) in the header
- Fill in your monthly income
- Select your currency from the dropdown
- Adjust allocation percentages (default follows 50-30-20 rule):
  - **Needs**: 50% (housing, utilities, groceries, minimum debt payments)
  - **Wants**: 30% (entertainment, dining out, hobbies, non-essential shopping)
  - **Savings**: 20% (emergency fund, retirement, investments, future goals)

### 3. Budget Rules
- All percentages must add up to exactly 100%
- The submit button is disabled until this requirement is met
- Real-time calculation shows current total percentage

### 4. View Your Budget
- Once created, you'll see:
  - Monthly income at the top
  - Three allocation cards showing:
    - Percentage allocated
    - Calculated dollar amount
    - Category icons (home, shopping bag, bank)

### 5. Edit Your Budget
- Tap the edit button to modify your allocation
- All fields are pre-populated with current values
- Save changes or cancel to revert

## Features Implemented

### ✅ Core Functionality
- Monthly income input
- Percentage-based allocation (Needs, Wants, Savings)
- Currency selection (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BTC, ETH)
- Real-time calculation of amounts
- Data persistence using local storage

### ✅ User Experience
- Clean, intuitive interface
- Form validation
- Error handling
- Empty state for new users
- Responsive layout
- Currency symbols display

### ✅ Navigation
- Added Budget tab to bottom navigation
- Calculator icon for easy identification
- Integrated with existing app structure

## Files Created/Modified

1. **`src/types/budget.ts`** - TypeScript interfaces
2. **`app/(tabs)/budget.tsx`** - Main budget screen component
3. **`src/utils/localStorageAPI.ts`** - Budget API functions added
4. **`app/(tabs)/_layout.tsx`** - Added budget tab to navigation

## Technical Implementation

### Data Structure
```typescript
interface BudgetAllocation {
  _id: string;
  userId: string;
  monthlyIncome: number;
  needs: { amount: number; percentage: number };
  wants: { amount: number; percentage: number };
  savings: { amount: number; percentage: number };
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Local Storage
- Data persists between app sessions
- User-specific budget storage
- CRUD operations (Create, Read, Update)

### Validation
- Percentage total must equal 100%
- Monthly income is required
- Currency selection is required

## Future Enhancements

Consider adding:
- Budget categories within Needs/Wants (housing, food, entertainment)
- Expense tracking against budget
- Monthly reports and analytics
- Budget notifications and alerts
- Historical budget data
- Goal setting integration
- Visual charts and graphs

## Testing Checklist

- [ ] Create new budget allocation
- [ ] Edit existing budget
- [ ] Try different currency selections
- [ ] Test percentage validation (not equal to 100%)
- [ ] Test with various income amounts
- [ ] Verify data persistence after app restart
- [ ] Test on both iOS and Android simulators