import { useState } from 'react';
import api from '../api/axios';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('orgId', data.user.orgId);
      onLoginSuccess(); 
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Login failed. Check if backend is running on port 5000");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Tenant Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
          />
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
          />
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;