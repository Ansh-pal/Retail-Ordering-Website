# API Smoke Test Checklist

Base URL: https://localhost:7036

## 1. Auth Phase

1. Register a new user
- Open Register page
- Submit: name, email, password, phoneNo
- Expect: success message, then redirect to Login

2. Login as manager account
- Submit: email, password
- Expect: token stored in localStorage as authToken
- Expect: userRole resolved as Manager
- Expect: dashboard opens with Product view

3. Login as user account
- Submit: email, password
- Expect: token stored in localStorage as authToken
- Expect: userRole resolved as User
- Expect: dashboard opens with Product + Shopping Cart menu

## 2. Category Phase (Manager)

1. GET /api/category
- Open Dashboard as Manager
- Verify categories load in product filter and add-product category dropdown

2. POST /api/category
- In Add Category form, submit category name
- Expect: success message and category appears in filter/dropdown

## 3. Product Phase

1. GET /api/product (Manager/User)
- Open Products view
- Expect: product table loads

2. GET /api/product/category/{categoryId}
- Choose a category from Filter by Category
- Expect: product list updates to selected category

3. POST /api/product (Manager only)
- Use Add Product form with: name, price, categoryId, quantity, isAvailable
- Expect: success message and new product appears

4. DELETE /api/product/{id} (Manager only)
- Click Delete on a product row
- Expect: success and row removed

## 4. Cart Phase (User only)

1. POST /api/cart/add
- Login as User and click Add to Cart on product row
- Expect: success message

2. GET /api/cart
- Open Shopping Cart view
- Expect: items loaded from backend

3. PUT /api/cart/update/{productId}
- Change quantity from cart table
- Expect: success message and quantity updates

4. DELETE /api/cart/remove/{productId}
- Click Remove
- Expect: success and item disappears

## 5. Order Phase (User only)

1. POST /api/order/place
- In cart with items, click Proceed to Checkout
- Expect: order placed success message

2. GET /api/order
- Click Refresh Orders in Order Actions
- Expect: orders JSON rendered

3. GET /api/order/{orderId}
- Enter order ID, click Get Order Details
- Expect: selected order JSON rendered

4. GET /api/order/{orderId}/items
- Enter order ID, click Get Order Items
- Expect: selected order items JSON rendered

## 6. Auth/Error Checks

1. 401 behavior
- Remove authToken manually and call protected action
- Expect: redirected to login

2. 403 behavior
- Login as User, attempt manager action (add/delete product/add category)
- Expect: permission error shown

3. 400/404 behavior
- Send invalid form data or invalid order ID
- Expect: specific error message shown in UI
