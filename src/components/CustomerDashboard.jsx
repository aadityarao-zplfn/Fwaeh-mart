import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, History, User, ArrowRight } from 'lucide-react';

const CustomerDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-rose-400 to-rose-400 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Your Dashboard!</h2>
        <p className="opacity-90">Manage your orders, track shipments, and view your account details.</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Tracking Card */}
        <Link 
          to="/orders" 
          className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 hover:shadow-lg transition-all hover:border-pink-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-xl">
                <Package className="text-pink-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Order Tracking</h3>
                <p className="text-gray-600 text-sm">Track your orders & details</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-pink-600 transition-colors" size={20} />
          </div>
        </Link>

        {/* Shopping Card */}
        <Link 
          to="/products" 
          className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 hover:shadow-lg transition-all hover:border-pink-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ShoppingBag className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Continue Shopping</h3>
                <p className="text-gray-600 text-sm">Browse more products</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-blue-600 transition-colors" size={20} />
          </div>
        </Link>

        {/* Order History Card */}
        <Link 
          to="/dashboard/orders" 
          className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 hover:shadow-lg transition-all hover:border-pink-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <History className="text-orange-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Order History</h3>
                <p className="text-gray-600 text-sm">View all past orders</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-orange-600 transition-colors" size={20} />
          </div>
        </Link>

        {/* Profile Card */}
        <Link 
          to="/profile" 
          className="bg-white p-6 rounded-2xl shadow-md border border-pink-100 hover:shadow-lg transition-all hover:border-pink-300 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <User className="text-purple-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Profile Settings</h3>
                <p className="text-gray-600 text-sm">Manage your account</p>
              </div>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={20} />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CustomerDashboard;