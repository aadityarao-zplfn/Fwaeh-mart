import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadProductImage } from '../utils/uploadImage';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast'; 
import { Clock, Globe, Lock, Check, X } from 'lucide-react';

const ProductForm = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    image_url: '',
    is_public: true,
    restock_days: '',
    restock_uncertain: false 
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user, profile } = useAuth();

  // 1. Load data for editing
  useEffect(() => {
    if (!profile) return;

    if (product) {
      // Handle logic for "Unsure" state (-1)
      const isUnsure = product.restock_days === -1;
      
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || '',
        is_public: product.is_public ?? true,
        restock_days: isUnsure ? '' : (product.restock_days || ''),
        restock_uncertain: isUnsure
      });
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock_quantity: '',
        image_url: '',
        is_public: profile.role !== 'wholesaler',
        restock_days: '',
        restock_uncertain: false
      });
    }
  }, [product, profile]);

  // 2. Handle simple input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 3. Handle visibility option change
  const handleVisibilityChange = (isPublic) => {
    setFormData(prev => ({
      ...prev,
      is_public: isPublic
    }));
  };

  // 4. Handle image upload to Supabase Storage
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const { url, error } = await uploadProductImage(file);
    setUploading(false);

    if (error) {
      toast.error(`Failed to upload image: ${error}`);
      setImagePreview(null);
    } else {
      toast.success('Image uploaded successfully!');
      setFormData(prev => ({ ...prev, image_url: url }));
    }
  };

  // 5. Handle form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("User authentication is incomplete. Please reload.");
      return;
    }

    setLoading(true);

    try {
      const stockQty = parseInt(formData.stock_quantity);
      
      // Determine restock_days value logic
      let restockValue = null;
      
      // Only save restock info if stock is 0
      if (stockQty === 0) {
        if (formData.restock_uncertain) {
          restockValue = -1; // -1 indicates "Unsure"
        } else if (formData.restock_days) {
          restockValue = parseInt(formData.restock_days);
        }
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: stockQty,
        restock_days: restockValue,
        is_public: formData.is_public,
        updated_at: new Date().toISOString(),
      };

      // Remove temporary frontend-only field before sending
      delete payload.restock_uncertain;

      if (product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
        toast.success('Product updated successfully!');
      } else {
        const { error } = await supabase.from('products').insert([
          {
            ...payload,
            seller_id: user.id,
            created_at: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
        toast.success('Product added successfully!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 6. Handle form cancellation
  const resetForm = () => {
    setFormData({ 
      name: product?.name || '', 
      description: product?.description || '', 
      price: product?.price || '', 
      category: product?.category || '', 
      stock_quantity: product?.stock_quantity || '', 
      image_url: product?.image_url || '', 
      is_public: product?.is_public ?? true,
      restock_days: product?.restock_days || '',
      restock_uncertain: false
    });
    onClose(); 
    toast('Form cancelled'); 
  };

  // Helper: Determine if Restock Field should be visible
  const shouldShowRestockField = () => {
    const stock = parseInt(formData.stock_quantity);
    // 1. Stock must be zero
    const isZeroStock = !stock || stock === 0;
    
    // 2. Must NOT be a proxy product
    // If product exists (editing), check is_proxy. If new, is_proxy is undefined (false).
    const isProxyProduct = product?.is_proxy === true;

    return isZeroStock && !isProxyProduct;
  };

  // 7. RENDER GUARD: Show loader while profile is loading
  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8 text-center shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  // 8. RENDERED JSX
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold" style={{ color: '#b91c1c' }}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button onClick={resetForm} className="p-2 rounded-full hover:bg-red-100" style={{ color: '#ff5757' }}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- IMAGE UPLOAD --- */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
              Product Image
            </label>
            
            <div className="mb-4">
              <div className="w-48 h-48 border-2 border-dashed border-red-300 rounded-xl overflow-hidden bg-red-50 flex items-center justify-center mx-auto">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-red-400">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No image selected</p>
                  </div>
                )}
              </div>
            </div>

            <label className="cursor-pointer block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="w-full px-4 py-3 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 text-center font-medium transition-all cursor-pointer">
                Choose Product Image
              </div>
            </label>
            
            <p className="text-xs text-red-600 mt-2 text-center">
              PNG, JPG, WebP up to 5MB
            </p>
            
            {formData.image_url && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-700 text-center">
                  ✅ Image uploaded successfully!
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter product name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 outline-none"
              style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
              Description
            </label>
            <textarea
              placeholder="Describe your product (optional)"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 outline-none"
              style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()} 
                className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                required
              />
            </div>
          </div>

          {/* 🚀 RESTOCK ALERT SECTION - PINK THEME */}
          {shouldShowRestockField() && (
            <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-300 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-orange-500" size={18} />
                <label className="block text-sm font-bold text-orange-800">
                  Restock Estimation (Alert)
                </label>
              </div>
              <p className="text-xs text-orange-600 mb-3">
                Since stock is 0, you can set an alert for customers.
              </p>
              
              <div className="space-y-3">
                {/* Input for Days */}
                <div className={`transition-all ${formData.restock_uncertain ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="relative">
                      <input
                        type="number"
                        min="1"
                        name="restock_days"
                        value={formData.restock_days}
                        onChange={handleChange}
                        placeholder="e.g., 5"
                        className="w-full pl-4 pr-12 py-2 rounded-lg border-2 border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none bg-white"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                          Days
                      </span>
                  </div>
                </div>

                <div className="flex items-center justify-center text-xs text-orange-400 font-bold">
                  - OR -
                </div>

                {/* Checkbox for Unsure */}
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition-colors">
                  <input 
                    type="checkbox"
                    name="restock_uncertain"
                    checked={formData.restock_uncertain}
                    onChange={handleChange}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-orange-800 font-medium">
                    I'm unsure when it will be back
                  </span>
                </label>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
              Category
            </label>
            <input
              type="text"
              placeholder="e.g., Electronics, Clothing (optional)"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 outline-none"
              style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
            />
          </div>

          {/* 🚀 WHOLESALER VISIBILITY OPTIONS */}
          {profile && profile.role === 'wholesaler' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                Product Visibility
              </label>
              
              {/* Option 1: Main Products Page */}
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.is_public 
                    ? 'bg-red-50 border-red-400 shadow-md' 
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => handleVisibilityChange(true)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      formData.is_public 
                        ? 'bg-red-500 border-red-500' 
                        : 'border-gray-400'
                    }`}>
                      {formData.is_public && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Globe size={16} className="mr-2 text-red-600" />
                        <span className="font-semibold text-gray-900">Main Products Page</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Your product will be visible to ALL customers in the main shopping area
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Wholesaler Catalog */}
              <div 
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  !formData.is_public 
                    ? 'bg-pink-50 border-pink-400 shadow-md' 
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => handleVisibilityChange(false)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      !formData.is_public 
                        ? 'bg-pink-500 border-pink-500' 
                        : 'border-gray-400'
                    }`}>
                      {!formData.is_public && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Lock size={16} className="mr-2 text-pink-600" />
                        <span className="font-semibold text-gray-900">Wholesaler Catalog</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Your product will only be visible to retailers who can import it to their stores
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  {formData.is_public 
                    ? '✅ Selected: Main Products Page - Visible to all customers' 
                    : '📦 Selected: Wholesaler Catalog - Only visible to retailers'}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;