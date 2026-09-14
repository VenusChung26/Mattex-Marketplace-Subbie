# Spec — Product Category admin page

Products nav third tab: **Mattex Products | Product Category | Mattex Chain Products**.

- Add / rename / delete categories (seed and custom). Delete only when **count is 0**, including soft-deleted products.
- List shows **count** (includes soft-deleted). Click a category to see its products.
- One product, one category. Select products and **Move** to another category. **Add products** searches the rest of the catalog and assigns them here.
- Do **not** leave a product with no category.
- Soft-deleted rows are grey and read-only (no move, no Publish). Restore on Mattex Products → Soft deleted.
- Product add/edit form still has Category dropdown **and Add category**.

This replaces the old lock that forbade a standalone Category page.

```jsx
// ❌ BAD
deleteAdminCategory(categoryWithProducts.id);
assignAdminProductsCategory(ids, "");

// ✅ GOOD
if (adminProductsInCategory(name).length) return { error: "in_use" };
assignAdminProductsCategory(ids, otherCategoryName);
```
