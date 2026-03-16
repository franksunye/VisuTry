# PROPOSAL: Reseller Incentive Scheme (Metadata-based Pilot)

> [!IMPORTANT]
> This is a **proposed** technical and business scheme for the reseller pilot. It has been designed but not yet implemented. Upon acceptance by the partner, implementation and launch will take approximately 2-3 business days.

## 1. Executive Summary
To quickly launch our reseller pilot (starting with Mohammed - Libya) while maintaining 100% system stability, we are using a **Metadata Interceptor** strategy. This means we leverage existing payment channels to grant bonuses without modifying our database schema or product catalog.

- **Objective**: Provide a 10% volume bonus to users and a 20% commission to partners.
- **Key Constraint**: Zero database migration, zero Stripe product configuration changes.

---

## 2. Business Rules & Policies

### 2.1 User Incentive (The "Bonus")
Users who enter a valid partner code (e.g., `MOH-MENA`) receive **10% extra quota** on our standard packs at the same price.
- **Credits Pack**: 30 -> **33** times
- **Monthly Plan**: 90 -> **99** times
- **Annual Plan**: 1080 -> **1188** times

### 2.2 Partner Incentive (The "Commission")
Partners receive a **20% referral fee** on the gross purchase price of every transaction using their code.
- **Settlement**: Manual monthly settlement based on system audit logs.
- **Example**: For a $2.99 pack, the partner earns **$0.60**.

---

## 3. User Experience (UX) Flow

### Entering the Code
1.  User navigates to the **Pricing Page**.
2.  User enters `VST-MENA-ALG2601` in the "Promo Code" field.
3.  **Visual Confirmation**: The UI immediately updates. For example, the "+30 times" label jumps to "**+33 times**". A success message "Partner Bonus Applied" is displayed.

### Checkout & Delivery
1.  User clicks "Buy" and is redirected to Stripe Checkout.
2.  **Price**: The price remains the standard `$2.99`.
3.  **Delivery**: Upon successful payment, the user is automatically granted the boosted amount (33 credits) instead of the standard 30.

---

## 4. Technical Implementation Detail

### The "Label" Mechanism
Instead of changing the Product ID (which would require a DB change), we pass the partner code through Stripe's `metadata` field.

1.  **Creation (`create-session`)**: We send `{ metadata: { promoCode: "VST-MENA-ALG2601" } }` to Stripe.
2.  **Detection (`webhook`)**: When Stripe notifies us of a successful payment, our server "intercepts" the metadata.
3.  **Logic Override**:
    ```typescript
    // Logic inside getProductQuota
    const baseQuota = 30;
    const multiplier = 1.1; // Derived from promoCode "VST-MENA-ALG2601"
    return Math.round(baseQuota * multiplier); // Returns 33
    ```
4.  **Audit Trail**: The promo code is appended to the `Payment` record's description in our database for future filtering.

---

## 5. Operations & Settlement

### How to calculate commissions?
Business teams or admins can export the payment records and filter by the description:
- **Search string**: `(Partner Bonus: VST-MENA-ALG2601)`
- **Calculation**: Number of transactions * (Price * 20%) = Commission due.

---

## 6. Verification & Quality Assurance (QA)

| Role | What to Verify | Expected Result |
| :--- | :--- | :--- |
| **Business** | Pricing Page | Entering code shows increased quota numbers (30 -> 33). |
| **QA** | Payment Request | API payload to Stripe includes `promoCode: "VST-MENA-ALG2601"`. |
| **Technical** | Fulfillment | User's credit balance increases by 33 after a test purchase. |
| **Admin** | DB Record | The resulting `Payment` description contains the partner tag. |

---

> [!IMPORTANT]
> This is a **pilot program**. For long-term scaling (100+ partners), we will transition to a fully automated attribution and database-backed partner management system.
