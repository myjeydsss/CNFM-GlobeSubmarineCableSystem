import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ element: Component }) => {
  const isLoggedIn = localStorage.getItem('loggedIn'); // Adjust this based on your authentication logic
  const role = localStorage.getItem('user_role'); // Adjust this based on your authentication logic

  if (!isLoggedIn || null) {
    return <Navigate to="/status/401" />;
  }

  if (isLoggedIn && role === 'User') {
    localStorage.setItem('loggedIn', 'false'); // Set loggedIn state to false
    return <Navigate to="/status/coming-soon" />;
  }

  // Additional security check: Prevent Simulator from accessing admin routes
  if (role === 'Simulator' && window.location.pathname.includes('/admin')) {
    return <Navigate to="/dashboard/simulator" replace />;
  }
  // Additional security check: Prevent Simulator from accessing admin routes
  if (role === 'User' && window.location.pathname.includes('/admin')) {
    return <Navigate to="/home" replace />;
  }
  // Additional security check: Prevent Simulator from accessing simulator routes
  if (role === 'User' && window.location.pathname.includes('/simulator')) {
    return <Navigate to="/home" replace />;
  }

  return <Component />;
};

export default PrivateRoute;
