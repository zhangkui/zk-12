import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import MainLayout from '../components/Layout/MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ScriptList from '../pages/ScriptList';
import ScriptDetail from '../pages/ScriptDetail';
import SessionList from '../pages/SessionList';
import SessionDetail from '../pages/SessionDetail';
import BookingList from '../pages/BookingList';
import OrderList from '../pages/OrderList';
import HostList from '../pages/HostList';
import HostSchedulePage from '../pages/HostSchedulePage';
import RoomList from '../pages/RoomList';
import UserList from '../pages/UserList';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Wallet from '../pages/Wallet';
import RechargeManage from '../pages/RechargeManage';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="scripts" element={<ScriptList />} />
        <Route path="scripts/:id" element={<ScriptDetail />} />
        <Route path="sessions" element={<SessionList />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="orders" element={<OrderList />} />
        <Route
          path="hosts"
          element={
            <PrivateRoute roles={['admin', 'owner']}>
              <HostList />
            </PrivateRoute>
          }
        />
        <Route
          path="host-schedules"
          element={
            <PrivateRoute roles={['admin', 'owner']}>
              <HostSchedulePage />
            </PrivateRoute>
          }
        />
        <Route
          path="rooms"
          element={
            <PrivateRoute roles={['admin', 'owner']}>
              <RoomList />
            </PrivateRoute>
          }
        />
        <Route
          path="users"
          element={
            <PrivateRoute roles={['admin', 'owner']}>
              <UserList />
            </PrivateRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
        <Route path="wallet" element={<Wallet />} />
        <Route
          path="recharge-manage"
          element={
            <PrivateRoute roles={['admin', 'owner']}>
              <RechargeManage />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
