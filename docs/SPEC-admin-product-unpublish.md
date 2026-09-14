# Spec — Mattex product statuses (Publish / Unpublish / Draft / Soft delete)

- **Published**: live on the marketplace.
- **Unpublish**: not live, required fields complete (SKU, category, name, unit, MOQ, lead, unique SKU).
- **Draft**: not live, incomplete. May still go live after Publish confirm.
- **Soft deleted**: not on MM. Publish must not go live. **Restore** first → Draft or Unpublish (by completeness), never auto-live.

Marketplace only shows **Published**.

## Publish

- Unpublish (complete): can go live immediately.
- Draft: Publish / bulk Publish shows missing fields, then confirm.
- Save Draft does **not** need a confirmation checkbox.
- **Hard block** (skip, do not go live): official SKU (`productNo`), name, unit, category, duplicate SKU.
- **Warn only** (confirm and go live): MOQ, lead. Missing values show as — on MM.
- Bulk: one confirm list. Hard-blocked rows are skipped; the rest go live after confirm.
- Unpublish a live incomplete SKU → **Draft**. Unpublish a live complete SKU → **Unpublish**.

```jsx
// ❌ BAD — soft-deleted or missing SKU/name/unit/category still goes live
publishAdminProduct(deletedProduct.id);

// ✅ GOOD
if (product.deleted) return { error: "deleted" };
if (publishHardBlockers(product).length) return { error: "publish" };
```
