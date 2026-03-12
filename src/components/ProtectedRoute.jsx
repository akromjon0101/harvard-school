import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        // Redirect to appropriate login based on the required role
        const isAdminRoute = allowedRoles?.length === 1 && allowedRoles[0] === 'admin'
        return <Navigate to={isAdminRoute ? '/admin-login' : '/login'} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Admin trying to access student-only route → go to admin dashboard
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
