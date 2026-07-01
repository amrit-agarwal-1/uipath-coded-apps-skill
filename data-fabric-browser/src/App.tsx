import { AuthProvider, useAuth } from './hooks/useAuth';
import type { UiPathSDKConfig } from '@uipath/uipath-typescript/core';
import EntityBrowser from './components/EntityBrowser';

const authConfig: UiPathSDKConfig = {
  clientId: import.meta.env.VITE_UIPATH_CLIENT_ID,
  orgName: import.meta.env.VITE_UIPATH_ORG_NAME,
  tenantName: import.meta.env.VITE_UIPATH_TENANT_NAME,
  baseUrl: import.meta.env.VITE_UIPATH_BASE_URL,
  redirectUri: window.location.origin + window.location.pathname,
  scope: import.meta.env.VITE_UIPATH_SCOPE,
};

function AppContent() {
  const { isAuthenticated, isLoading, error, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-sm w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Authentication Error</h2>
          <p className="text-sm text-red-600 mb-6">{error}</p>
          <button onClick={login} className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4m0 0c4.418 0 8-1.79 8-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Data Fabric Browser</h1>
          <p className="text-slate-500 text-sm mb-8">
            Explore your UiPath Data Fabric entities and records.
          </p>
          <button
            onClick={login}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold text-sm shadow-lg shadow-blue-200"
          >
            Sign in with UiPath
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4m0 0c4.418 0 8-1.79 8-4" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-sm">Data Fabric Browser</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        <EntityBrowser />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider config={authConfig}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
