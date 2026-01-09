import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard'; // Step 1: Add this import

function App() {
  // Logic to check if user is already authenticated
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

return (
    <div className="min-h-screen bg-gray-50">
      {/* Step 2: Add a professional Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">
            AssetManager <span className="text-blue-600">Pro</span>
          </span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Logout
        </button>
      </nav>

      {/* Step 3: Render the Dashboard Component */}
      <main className="max-w-7xl mx-auto py-6">
        <Dashboard />
      </main>
    </div>
);
}

export default App;