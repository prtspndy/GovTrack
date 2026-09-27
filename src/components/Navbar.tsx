import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { notificationService } from '../services/notificationService.js';
import { NotificationItem } from '../types/index.js';
import {
  ShieldCheck,
  Bell,
  User as UserIcon,
  LogOut,
  FileText,
  Search,
  LayoutDashboard,
  CheckCircle,
  Menu,
  X,
  FilePlus,
  Users,
  History,
  Layers,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Poll/fetch notifications when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    async function loadNotifications() {
      try {
        const res = await notificationService.getAll();
        if (res.success && res.data) {
          setNotifications(res.data);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {}
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const handleQuickSwitch = async (role: 'citizen' | 'admin') => {
    await quickLogin(role);
    setUserMenuOpen(false);
    navigate(role === 'admin' ? '/admin/dashboard' : '/citizen/dashboard');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Government Portal Branding Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-100">GOVTRACK</span>
          <span className="text-slate-400">· Citizen Document Request & Real-time Status Portal</span>
        </div>

        {/* Quick Demo Switcher for fast evaluation */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">1-Click Demo Login:</span>
          <button
            onClick={() => handleQuickSwitch('citizen')}
            className="px-2 py-0.5 rounded bg-blue-950 text-blue-200 hover:bg-blue-900 text-xs font-medium border border-blue-800 transition-colors"
          >
            👤 Citizen (Rahul)
          </button>
          <button
            onClick={() => handleQuickSwitch('admin')}
            className="px-2 py-0.5 rounded bg-amber-950 text-amber-200 hover:bg-amber-900 text-xs font-medium border border-amber-800 transition-colors"
          >
            🛡️ Officer (Admin)
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue-900 text-amber-400 flex items-center justify-center font-bold shadow-sm group-hover:bg-blue-800 transition-colors">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                GovTrack
                <span className="text-[10px] font-semibold tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                  e-District
                </span>
              </span>
              <p className="text-[11px] text-slate-500 leading-none">Citizen Services Department</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/services"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === '/services' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Available Documents
            </Link>
            <Link
              to="/track-request"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                location.pathname === '/track-request' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-blue-700" />
              Track Status
            </Link>

            {/* Citizen-specific links */}
            {isAuthenticated && user?.role === 'citizen' && (
              <>
                <div className="w-px h-5 bg-slate-200 mx-2" />
                <Link
                  to="/citizen/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname === '/citizen/dashboard' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  Dashboard
                </Link>
                <Link
                  to="/citizen/apply"
                  className="ml-1 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FilePlus className="w-4 h-4" />
                  Apply for Document
                </Link>
              </>
            )}

            {/* Admin-specific links */}
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <div className="w-px h-5 bg-slate-200 mx-2" />
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname === '/admin/dashboard' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  Admin Console
                </Link>
                <Link
                  to="/admin/requests"
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    location.pathname.startsWith('/admin/requests') ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  Requests
                </Link>
                <Link
                  to="/admin/document-types"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin/document-types' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Document Types
                </Link>
                <Link
                  to="/admin/audit-logs"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/admin/audit-logs' ? 'text-blue-900 bg-blue-50 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Audit Logs
                </Link>
              </>
            )}
          </nav>

          {/* User & Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setUserMenuOpen(false);
                    }}
                    className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-800">
                          Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-700 hover:text-blue-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-6">No notifications yet.</p>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n._id}
                              className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                                !n.isRead ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-slate-900">{n.title}</span>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="px-4 py-2 border-t border-slate-100 text-center">
                        <Link
                          to={user.role === 'citizen' ? '/citizen/notifications' : '/admin/dashboard'}
                          onClick={() => setNotifDropdownOpen(false)}
                          className="text-xs text-blue-700 hover:underline font-medium"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs uppercase">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div className="text-left text-xs">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-slate-500 uppercase text-[10px] font-mono tracking-wider">
                        {user.role}
                      </p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 text-xs">
                        <p className="font-semibold text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-slate-500 truncate">{user.email}</p>
                      </div>

                      {user.role === 'citizen' ? (
                        <>
                          <Link
                            to="/citizen/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-500" />
                            My Dashboard
                          </Link>
                          <Link
                            to="/citizen/requests"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-4 h-4 text-slate-500" />
                            My Applications
                          </Link>
                          <Link
                            to="/citizen/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <UserIcon className="w-4 h-4 text-slate-500" />
                            Profile Details
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-500" />
                            Admin Console
                          </Link>
                          <Link
                            to="/admin/requests"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-4 h-4 text-slate-500" />
                            Process Requests
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <Users className="w-4 h-4 text-slate-500" />
                            Citizen Accounts
                          </Link>
                          <Link
                            to="/admin/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <UserIcon className="w-4 h-4 text-slate-500" />
                            Officer Profile
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-700 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-md text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 transition-colors shadow-xs"
                >
                  Citizen Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Home
          </Link>
          <Link
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Available Documents
          </Link>
          <Link
            to="/track-request"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Track Status
          </Link>

          {isAuthenticated && user?.role === 'citizen' && (
            <>
              <Link
                to="/citizen/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
              <Link
                to="/citizen/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-blue-700 bg-blue-50"
              >
                Apply for Document
              </Link>
              <Link
                to="/citizen/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                My Requests
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/requests"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Process Requests
              </Link>
              <Link
                to="/admin/document-types"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Document Types
              </Link>
              <Link
                to="/admin/audit-logs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Audit Logs
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-slate-200">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
              >
                Sign Out
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-md font-medium text-slate-700 border border-slate-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 rounded-md font-medium text-white bg-blue-800"
                >
                  Citizen Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
