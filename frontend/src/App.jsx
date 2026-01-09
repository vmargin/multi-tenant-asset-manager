/**
 * MAIN APP COMPONENT
 * 
 * This is the root component of the React application.
 * It handles:
 * - Authentication state (logged in or not)
 * - Conditional rendering (Login vs Dashboard)
 * - Navigation bar
 * - Logout functionality
 * 
 * This component acts as a "router" - deciding what to show based on auth state.
 */

// useState is a React Hook that lets you add state to functional components
// State is data that can change, and when it changes, React re-renders the component
import { useState } from 'react';

// Import child components
import Login from './components/Login';
import Dashboard from './components/Dashboard';

/**
 * APP COMPONENT FUNCTION
 * 
 * This is a functional component (modern React style).
 * It returns JSX (JavaScript XML) which describes what to render.
 */
function App() {
  /**
   * AUTHENTICATION STATE
   * 
   * useState() creates a state variable and a function to update it.
   * 
   * Syntax: const [stateVariable, setStateFunction] = useState(initialValue);
   * 
   * !!localStorage.getItem('token') explanation:
   * - localStorage.getItem('token') returns the token string or null
   * - !null = true (first ! converts null to true)
   * - !true = false (second ! converts true to false)
   * - !!null = false (double negation converts null to false)
   * - !!'token' = true (double negation converts string to true)
   * 
   * So: isLoggedIn is true if token exists, false if it doesn't
   * 
   * When isLoggedIn changes, React automatically re-renders this component!
   */
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  /**
   * LOGOUT HANDLER FUNCTION
   * 
   * This function runs when user clicks the logout button.
   * It:
   * 1. Clears all data from localStorage (including token)
   * 2. Updates isLoggedIn state to false
   * 3. React re-renders, showing Login component instead
   */
  const handleLogout = () => {
    localStorage.clear(); // Remove all stored data (token, orgId, etc.)
    setIsLoggedIn(false); // Update state, triggers re-render
  };

  /**
   * CONDITIONAL RENDERING - LOGIN SCREEN
   * 
   * If user is NOT logged in, show the Login component.
   * 
   * onLoginSuccess is a callback prop - a function passed to child component.
   * When login succeeds, Login component calls this function.
   * This updates isLoggedIn to true, causing React to re-render and show Dashboard.
   */
  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  /**
   * CONDITIONAL RENDERING - DASHBOARD SCREEN
   * 
   * If user IS logged in, show the Dashboard with navigation.
   * 
   * JSX (JavaScript XML) looks like HTML but is actually JavaScript.
   * - className instead of class (class is reserved in JavaScript)
   * - onClick instead of onclick (camelCase for event handlers)
   * - {} for JavaScript expressions (like {isLoggedIn})
   * 
   * Tailwind CSS classes:
   * - min-h-screen = minimum height of 100vh (full viewport height)
   * - bg-gray-50 = light gray background
   * - flex = CSS flexbox layout
   * - etc.
   */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVIGATION BAR */}
      {/* 
        This nav bar appears at the top when user is logged in.
        It shows the app name/logo and a logout button.
      */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        {/* Logo/Brand Section */}
        <div className="flex items-center gap-2">
          {/* Logo Icon - simple blue square with "A" */}
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {/* App Name */}
          <span className="text-xl font-bold text-gray-800 tracking-tight">
            AssetManager <span className="text-blue-600">Pro</span>
          </span>
        </div>
        
        {/* Logout Button */}
        {/* 
          onClick={handleLogout} - when clicked, run handleLogout function
          className - Tailwind CSS classes for styling
        */}
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Logout
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      {/* 
        max-w-7xl = maximum width constraint (responsive design)
        mx-auto = center horizontally (margin auto)
        py-6 = vertical padding
      */}
      <main className="max-w-7xl mx-auto py-6">
        {/* Render the Dashboard component - this shows all the assets */}
        <Dashboard />
      </main>
    </div>
  );
}

// Export the component so other files can import it
export default App;