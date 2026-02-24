# AGENTS.md - PogoJump Development Guide

This file contains guidelines and commands for agents working on the PogoJump codebase.

## Project Overview

- **Project**: PogoJump E-commerce with Admin Dashboard
- **Stack**: Node.js + Express (backend), Vanilla HTML/CSS/JS (frontend)
- **Database**: JSON file-based (database.json)
- **Port**: 3000

---

## Commands

### Start Development Server
```bash
cd C:\Users\georg\Desktop\test
node server.js
```

### Install Dependencies
```bash
npm install
```

### Test API Endpoints
```bash
# Test products endpoint
curl http://localhost:3000/api/products

# Test register
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"email\":\"test@test.com\",\"password\":\"test123\"}"

# Test login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@test.com\",\"password\":\"admin123\"}"
```

### View Logs
```bash
tail -f server.log
```

---

## Code Style Guidelines

### General Principles

1. **Keep it simple** - Prefer readable, straightforward code over clever solutions
2. **Consistency** - Follow existing patterns in the codebase
3. **Single responsibility** - Each function/module should do one thing well
4. **Fail gracefully** - Always handle errors appropriately

### JavaScript (Node.js Backend)

#### Imports
- Use CommonJS `require()` for built-in Node modules
- Group imports: built-ins first, then third-party, then local
```javascript
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
```

#### Naming Conventions
- **Variables/functions**: camelCase (`getProducts`, `userData`)
- **Constants**: UPPER_SNAKE_CASE (`PORT`, `JWT_SECRET`)
- **Classes**: PascalCase (`UserService`, `OrderController`)
- **Files**: kebab-case (`auth-middleware.js`, `user-service.js`)

#### Functions
- Keep functions under 50 lines
- Use arrow functions for callbacks and simple transformations
- Use regular functions for methods that need `this` context

#### Error Handling
- Always wrap async route handlers in try/catch
- Return proper HTTP status codes:
  - `200` - Success
  - `201` - Created
  - `400` - Bad Request
  - `401` - Unauthorized
  - `403` - Forbidden
  - `404` - Not Found
  - `500` - Server Error
- Return consistent error response format:
```javascript
return res.status(400).json({ error: 'Error message' });
```

#### Database Operations
- Read-modify-write pattern: always read DB, modify, then write
- Use `JSON.parse()` and `JSON.stringify()` for DB operations
- Handle file not found errors gracefully

#### Authentication
- Use JWT tokens with expiration
- Store tokens in Authorization header: `Bearer <token>`
- First registered user automatically becomes admin

### HTML/CSS/JS (Frontend)

#### HTML Structure
- Use semantic HTML5 elements (`<nav>`, `<section>`, `<main>`, `<footer>`)
- Keep inline styles minimal; use CSS classes
- Use data attributes for JavaScript hooks: `data-id`, `data-action`

#### CSS
- Use CSS custom properties (variables) for colors and spacing
- Follow BEM naming for complex components: `block__element--modifier`
- Use flexbox and grid for layouts
- Mobile-first responsive design
- Neumorphism/futuristic style with neon accent colors

#### JavaScript
- Use ES6+ features (const/let, arrow functions, template literals)
- Keep scripts at bottom of body or use `defer`
- Use event delegation for dynamic elements
- Store API base URL as constant:
```javascript
const API_URL = 'http://localhost:3000/api';
```

#### State Management
- Use localStorage for persistence (cart, auth token)
- Keep UI state in memory, sync to localStorage when needed

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `GET /api/orders` - List all orders (admin only)
- `GET /api/orders/my` - Get user's orders
- `POST /api/orders` - Create order (requires auth)
- `PUT /api/orders/:id` - Update order status (admin only)
- `DELETE /api/orders/:id` - Delete order (admin only)

### Users
- `GET /api/users` - List all users (admin only)

---

## Database Schema

### Products
```javascript
{
  id: number,
  name: string,
  description: string,
  price: number,
  image: string,
  featured: boolean
}
```

### Users
```javascript
{
  id: number,
  email: string,
  name: string,
  password: string (hashed),
  isAdmin: boolean,
  createdAt: string (ISO date)
}
```

### Orders
```javascript
{
  id: number,
  userId: number,
  userName: string,
  userEmail: string,
  items: Array,
  total: number,
  status: 'pending' | 'processing' | 'completed' | 'cancelled',
  createdAt: string (ISO date)
}
```

---

## Testing Guidelines

1. **Manual API Testing**: Use curl or Postman to test endpoints
2. **Frontend Testing**: Open index.html in browser
3. **Regression Testing**: After changes, verify:
   - Server starts without errors
   - Products load on frontend
   - Login/register works
   - Cart functionality works
   - Admin dashboard loads for admin users

---

## Security Notes

- JWT_SECRET should be moved to environment variables in production
- Passwords are hashed with bcrypt (10 rounds)
- Admin routes are protected with middleware
- Input validation on all API endpoints

---

## Commit Guidelines

### Manual Commits
- Use clear, descriptive commit messages
- Commit format: `type: description`
- Types: `feat`, `fix`, `update`, `refactor`, `docs`
- Example: `feat: add product search functionality`

### Automatic Commits (Default)
All changes are automatically committed and pushed to the remote repository:
- After completing any task or making file changes, commit immediately
- Use a clear, descriptive commit message summarizing the changes
- Always push to remote after commit
- Commit message format: `type: brief description`
- Types: `feat`, `fix`, `update`, `refactor`, `docs`, `style`, `chore`

### Workflow
1. Make changes to files
2. Run `git add .` to stage changes
3. Run `git commit -m "message"` with descriptive message
4. Run `git push` to push to remote
5. Verify push was successful
