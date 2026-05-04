# PPAA Internal Portal - Project Structure & File Interaction Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Application Flow](#application-flow)
3. [Directory Structure](#directory-structure)
4. [Key Files & Their Roles](#key-files--their-roles)
5. [Data Flow & Interactions](#data-flow--interactions)
6. [Architecture Patterns](#architecture-patterns)

---

## 🎯 Project Overview

This is a **React-based internal portal application** built with:
- **Vite** as the build tool
- **React Router** for routing
- **Redux Toolkit** with **Redux Persist** for state management
- **Axios** for API communication
- **Material-UI** and custom CSS for styling

The application serves as a centralized portal connecting multiple services/modules within the Public Procurement Appeals Authority (PPAA) system.

---

## 🔄 Application Flow

### Entry Point Sequence

```
1. index.html
   ↓
2. main.jsx (Entry Point)
   ├─ Wraps App with BrowserRouter
   └─ Renders App component
   ↓
3. App.jsx (Main App Component)
   ├─ Checks route path (auth vs protected)
   ├─ Wraps with Redux Provider & PersistGate
   ├─ Conditionally renders:
   │  ├─ Blank layout (for auth pages)
   │  └─ Layout with ProtectedRoute (for app pages)
   ↓
4. AppRoutes.jsx (Route Configuration)
   ├─ Defines all application routes
   ├─ Imports route modules from router/
   └─ Renders appropriate page components
   ↓
5. Layout.jsx (Main Layout)
   ├─ Sidebar component
   ├─ Navbar component
   ├─ Content area (children)
   └─ Footer component
```

---

## 📁 Directory Structure

### Root Level
```
ppaa-internal-portal-frontend/
├── public/              # Static assets (images, fonts, vendor libs)
├── src/                 # Source code
├── index.html           # HTML entry point
├── vite.config.js       # Vite build configuration
├── package.json         # Dependencies & scripts
└── docker-compose.yml   # Docker configuration
```

### `/src` Directory Structure

```
src/
├── main.jsx                    # Application entry point
├── App.jsx                     # Root component with routing logic
├── api.jsx                     # Axios instance with interceptors
├── Costants.jsx                # Constants (API URL, token keys)
│
├── components/                 # Reusable UI components
│   ├── atoms/                  # Basic building blocks
│   ├── molecul/                # Composite components
│   ├── common/                 # Shared components
│   ├── wrapper/                # HOC/Wrapper components
│   │   └── ProtectedRoute.jsx  # Route protection wrapper
│   ├── ui-templates/           # UI template components
│   ├── loaders/                # Loading components
│   └── DashboardCharts/        # Chart components
│
├── layouts/                    # Layout components
│   ├── Layout.jsx              # Main app layout
│   ├── Blank.jsx               # Blank layout (auth pages)
│   ├── Sidebar.jsx             # Navigation sidebar
│   ├── Navbar.jsx              # Top navigation bar
│   ├── Footer.jsx              # Footer component
│   └── BreadCumb.jsx           # Breadcrumb navigation
│
├── pages/                      # Page components
│   ├── Services.jsx            # Home/services listing page
│   ├── authentication/         # Auth pages (login, register, etc.)
│   ├── account/                # User account pages
│   ├── services/               # Service-specific pages
│   │   └── PPAA-INTERNAL-PORTAL/
│   │       ├── Dashboards/
│   │       ├── departments/
│   │       └── documents/
│   ├── misc/                   # Error, maintenance pages
│   └── layouts/                # Layout demo pages
│
├── router/                     # Route definitions
│   ├── AppRoutes.jsx           # Main route aggregator
│   ├── authRoutes.jsx          # Authentication routes
│   ├── managementRoutes.jsx    # Management module routes
│   ├── ppaaInternalPortal.jsx  # PPAA portal routes
│   ├── ictAssetsRoutes.jsx     # ICT assets routes
│   ├── oxygenRoutes.jsx        # Oxygen service routes
│   ├── analyticsRoutes.jsx    # Analytics routes
│   ├── maoniRoutes.jsx         # MAONI routes
│   ├── trainingRoutes.jsx      # Training routes
│   └── externalReferralRoutes.jsx
│
├── redux/                      # State management
│   ├── store.jsx               # Redux store configuration
│   ├── actions/                # Action creators
│   │   └── authentication/
│   │       ├── loginActions.js
│   │       ├── logoutAction.js
│   │       └── signupActions.js
│   ├── reducer/                # Reducers
│   │   └── authentication/
│   │       ├── loginReducer.js
│   │       ├── userReducer.js
│   │       └── signupReducer.js
│   └── types/                  # Action type constants
│
├── data/                       # Static data & configuration
│   ├── servicesList.json       # Services configuration
│   ├── menuData.json           # Menu structure
│   ├── modules_code.json       # Module codes
│   └── [other JSON configs]
│
├── helpers/                    # Utility functions
│   ├── DataTable.js            # Data table utilities
│   ├── DateFormater.js         # Date formatting
│   ├── ToastHelper.jsx         # Toast notifications
│   └── [other helpers]
│
├── hooks/                      # Custom React hooks
│   ├── usePagination.js        # Pagination hook
│   ├── usePerfectScrollbar.jsx # Scrollbar hook
│   ├── AccessHandler.js        # Access control hook
│   └── CustomModal.jsx         # Modal hook
│
└── utils/                      # Utility functions
    ├── context.js              # React context
    ├── GlobalQueries.jsx       # Global query utilities
    ├── permissions.js          # Permission utilities
    └── greetingHandler.js      # Greeting logic
```

---

## 🔑 Key Files & Their Roles

### 1. **Entry Point Files**

#### `main.jsx`
- **Purpose**: Application entry point
- **Responsibilities**:
  - Initializes React DOM
  - Wraps App with `BrowserRouter` for routing
- **Key Code**:
```1:10:src/main.jsx
// import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
```

#### `App.jsx`
- **Purpose**: Root component that orchestrates the app
- **Responsibilities**:
  - Determines layout type (Blank vs Layout)
  - Wraps with Redux Provider
  - Handles route-based layout switching
- **Key Logic**:
```13:54:src/App.jsx
function App() {
  const location = useLocation();
  const isAuthPath =
    location.pathname.includes("auth") ||
    location.pathname.includes("error") ||
    location.pathname.includes("under-maintenance") |
    location.pathname.includes("blank");

  const isService = location.pathname === "/";

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {isAuthPath ? (
            <AppRoutes>
              <Blank />
            </AppRoutes>
          ) : (
            <ProtectedRoute>
              <Layout isService={isService}>
                <AppRoutes />
              </Layout>
            </ProtectedRoute>
          )}
        </PersistGate>
      </Provider>
    </>
  );
}
```

### 2. **Routing System**

#### `router/AppRoutes.jsx`
- **Purpose**: Central route configuration
- **Responsibilities**:
  - Aggregates all route modules
  - Defines route hierarchy
  - Handles 404/error routes
- **Structure**:
```18:56:src/router/AppRoutes.jsx
const AppRoutes = () => {
  return (
    <Routes>
      {/* Home & Services */}
      <Route path="/" element={<Services />} />

      {/* Auth Routes */}
      {authRoutes}

      {/* Management Routes */}
      {managementRoutes}

      {/* PPAA Internal Portal Routes */}
      {ppaaInternalPortalRoutes}

      {/* ICT Assets Routes */}
      {ictAssetsRoutes}

      {/* Oxygen Management Routes */}
      {oxygenRoutes}

      {/* Hospital Analitics Routes */}
      {analyticsRoutes}

      {/* MAONI Routes */}
      {maoniRoutes}

      {/* Training Management Routes */}
      {trainingRoutes}

      {/* External Referral Routes */}
      {externalReferralRoutes}

      {/* Catch-all 404 */}
      <Route path="*" element={<MaintenancePage />} />
      {/* <Route path="*" element={<ErrorPage />} /> */}
    </Routes>
  );
};
```

#### Route Module Example: `router/ppaaInternalPortal.jsx`
- **Purpose**: Defines routes for PPAA Internal Portal module
- **Features**:
  - Route-level permission checking
  - Nested routes with parameters
  - Protected route wrapping
- **Example**:
```9:42:src/router/ppaaInternalPortal.jsx
export const ppaaInternalPortalRoutes = (
  <>
    <Route path="/ppaa-internal-portal" element={<StaffDashboard />} />

    <Route
      path="/ppaa-internal-portal/departments"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
          requiredRoles={["admin"]}
        >
          <DepartmentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/departments/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
          requiredRoles={["admin"]}
        >
          <DepartmentOpenPage />
        </ProtectedRoute>
      }
    />
```

### 3. **Authentication & API**

#### `api.jsx`
- **Purpose**: Centralized API client with interceptors
- **Key Features**:
  - Automatic token injection
  - Token refresh on 401 errors
  - Login dialog on auth failure
  - 403 access denied handling
- **Request Interceptor**:
```18:30:src/api.jsx
// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    config.headers.Accept = "application/json";
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

#### `components/wrapper/ProtectedRoute.jsx`
- **Purpose**: Route protection wrapper
- **Responsibilities**:
  - Validates JWT token
  - Checks token expiration
  - Refreshes token if needed
  - Validates user permissions & roles
  - Redirects unauthorized users
- **Key Logic**:
```25:50:src/components/wrapper/ProtectedRoute.jsx
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        throw new Error("No token found");
      }

      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          localStorage.clear();
          dispatch(logout());
          throw new Error("Token refresh failed");
        }
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Authorization error:", error);
      setIsAuthorized(false);
      dispatch(logout());
    }
  };
```

### 4. **State Management**

#### `redux/store.jsx`
- **Purpose**: Redux store configuration
- **Features**:
  - Redux Persist for state persistence
  - Configured middleware
  - DevTools in development
- **Configuration**:
```15:35:src/redux/store.jsx
const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});
```

### 5. **Layout System**

#### `layouts/Layout.jsx`
- **Purpose**: Main application layout
- **Structure**:
  - Sidebar (navigation)
  - Navbar (top bar)
  - Content area (page content)
  - Footer
- **Implementation**:
```6:28:src/layouts/Layout.jsx
const Layout = ({ children, isService = false, activeService = null }) => {
  useEffect(() => {
    Main();
  }, []);

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        <Sidebar isService={isService} activeService={activeService} />
        <div className="layout-page">
          <Navbar isService={isService} activeService={activeService} />
          <div className="content-wrapper">
            <div className="flex-grow-1 container-p-y container-fluid">
              {children}
            </div>
            <Footer />
          </div>
        </div>
        <div className="layout-overlay layout-menu-toggle"></div>
      </div>
    </div>
  );
};
```

### 6. **Constants**

#### `Costants.jsx`
- **Purpose**: Application-wide constants
- **Contains**:
  - Token storage keys
  - API base URL
- **Definition**:
```1:5:src/Costants.jsx
export const ACCESS_TOKEN = "accessToken";
export const REFRESH_TOKEN = "refreshToken";
export const API_BASE_URL = "http://127.0.0.1:8000";
//export const API_BASE_URL = "http://192.168.10.166:8092";
```

---

## 🔀 Data Flow & Interactions

### 1. **Authentication Flow**

```
User Login
  ↓
LoginPage component
  ↓
Calls login action (Redux)
  ↓
API request via api.jsx
  ↓
Request interceptor adds token
  ↓
Response interceptor handles errors
  ↓
Token stored in localStorage
  ↓
User data stored in Redux store
  ↓
Redirect to dashboard
```

### 2. **Protected Route Flow**

```
User navigates to protected route
  ↓
ProtectedRoute component mounts
  ↓
Checks localStorage for token
  ↓
Validates token expiration
  ↓
If expired → refreshToken()
  ↓
Checks user permissions/roles
  ↓
If authorized → render children
  ↓
If not authorized → show error & redirect
```

### 3. **API Request Flow**

```
Component makes API call
  ↓
Uses api.jsx instance
  ↓
Request interceptor:
  ├─ Adds Authorization header
  └─ Adds Accept header
  ↓
Server processes request
  ↓
Response interceptor:
  ├─ 200: Return data
  ├─ 401: Try refresh → Show login dialog
  ├─ 403: Show access denied
  └─ Other: Reject with error
  ↓
Component receives response
```

### 4. **State Management Flow**

```
Component dispatches action
  ↓
Action creator (redux/actions/)
  ↓
Reducer processes action (redux/reducer/)
  ↓
State updated in Redux store
  ↓
Redux Persist saves to localStorage
  ↓
Components subscribed via useSelector() re-render
```

---

## 🏗️ Architecture Patterns

### 1. **Module-Based Routing**
- Each service/module has its own route file
- Routes are aggregated in `AppRoutes.jsx`
- Enables code splitting and maintainability

### 2. **Protected Routes Pattern**
- `ProtectedRoute` wrapper checks authentication
- Permission-based access control
- Role-based access control
- Automatic redirects for unauthorized access

### 3. **Centralized API Client**
- Single axios instance (`api.jsx`)
- Global interceptors for:
  - Token management
  - Error handling
  - Automatic retries

### 4. **Layout Composition**
- Conditional layout rendering based on route
- Blank layout for auth pages
- Full layout for app pages
- Reusable layout components

### 5. **State Persistence**
- Redux Persist for state hydration
- Token storage in localStorage
- User data persistence across sessions

---

## 🔗 File Interaction Examples

### Example 1: User Login

```
pages/authentication/LoginPage.jsx
  ↓ (dispatches action)
redux/actions/authentication/loginActions.js
  ↓ (makes API call)
api.jsx (with interceptors)
  ↓ (stores token)
localStorage
  ↓ (updates state)
redux/reducer/authentication/userReducer.js
  ↓ (triggers re-render)
Components using useSelector()
```

### Example 2: Accessing Protected Page

```
User clicks link → Navigate to /ppaa-internal-portal/departments
  ↓
AppRoutes.jsx matches route
  ↓
ProtectedRoute wrapper checks:
  ├─ Token exists? (localStorage)
  ├─ Token valid? (jwtDecode)
  ├─ Permissions match? (Redux state)
  └─ Roles match? (Redux state)
  ↓
If all pass → Render DepartmentPage
If fail → Show error & redirect
```

### Example 3: API Call with Auto-Refresh

```
Component calls: api.get('/departments')
  ↓
Request interceptor adds token
  ↓
Server returns 401 (token expired)
  ↓
Response interceptor catches 401
  ↓
Calls refreshToken()
  ↓
If refresh succeeds → Retry original request
If refresh fails → Show login dialog
  ↓
User logs in → New token stored
  ↓
Original request retried with new token
```

---

## 📝 Key Takeaways

1. **Entry Point**: `main.jsx` → `App.jsx` → `AppRoutes.jsx`
2. **Layout System**: Conditional rendering based on route type
3. **Authentication**: Token-based with automatic refresh
4. **State Management**: Redux Toolkit with persistence
5. **API Communication**: Centralized axios instance with interceptors
6. **Route Protection**: Permission & role-based access control
7. **Module Structure**: Service-based route organization

---

## 🛠️ Development Workflow

### Adding a New Service/Module

1. **Create route file**: `src/router/[serviceName]Routes.jsx`
2. **Define routes** with `ProtectedRoute` if needed
3. **Import in** `AppRoutes.jsx`
4. **Create page components** in `src/pages/services/[SERVICE-NAME]/`
5. **Add service data** to `src/data/servicesList.json` (if needed)

### Adding a New Protected Route

```jsx
<Route
  path="/your-route"
  element={
    <ProtectedRoute
      requiredPermissions={["permission_name"]}
      requiredRoles={["role_name"]}
    >
      <YourPageComponent />
    </ProtectedRoute>
  }
/>
```

### Making API Calls

```jsx
import api from '../api';

// In your component
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    // Handle response
  } catch (error) {
    // Error handled by interceptors
  }
};
```

---

This guide provides a comprehensive overview of how the project is structured and how different files interact. Use it as a reference when navigating and extending the codebase.

