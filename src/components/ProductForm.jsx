import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadProductImage } from '../utils/uploadImage';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast'; 

const ProductForm = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    image_url: '',
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user, profile } = useAuth();

  // 1. Load data for editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || '',
        is_public: product.is_public ?? true,
      });
      if (product.image_url) {
        setImagePreview(product.image_url);
      }
    }
  }, [product]);

  // 2. Handle simple input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // 3. Handle image upload to Supabase Storage
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  // 4. Handle form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error("User authentication is incomplete. Please reload.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        is_public: formData.is_public,
        updated_at: new Date().toISOString(),
      };

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
  
  // 5. Handle form cancellation
  const resetForm = () => {
    // Reset form data only if user cancels, otherwise keep changes for context
    setFormData({ 
      name: product?.name || '', 
      description: product?.description || '', 
      price: product?.price || '', 
      category: product?.category || '', 
      stock_quantity: product?.stock_quantity || '', 
      image_url: product?.image_url || '', 
      is_public: product?.is_public ?? true
    });
    onClose(); 
    toast('Form cancelled'); 
  };
  
  // 6. RENDER GUARD: Show loader while profile is loading
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


  // 7. RENDERED JSX
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- IMAGE UPLOAD --- */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Product Image
              </label>
              
              <div className="mb-4">
                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center mx-auto">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
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
                <div className="w-full px-4 py-3 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 text-center font-medium transition-all cursor-pointer">
                  Choose Product Image
                </div>
              </label>
              </div>
              {/* --- END IMAGE UPLOAD --- */}
              
              {/* --- PRODUCT FIELDS --- */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none border-gray-300 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Description
                </label>
                <textarea
                  placeholder="Describe your product (optional)"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none border-gray-300 focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    name="stock_quantity"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none border-gray-300 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Electronics, Clothing (optional)"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none border-gray-300 focus:border-blue-500"
                />
              </div>

            {/* 🚀 Wholesaler Public/Private Toggle */}
            {profile.role === 'wholesaler' && (
              <div className="pt-4 flex items-center justify-between border-t border-gray-200">
                <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                  Display to Customers (Main Shop)?
                </label>
                <div className="relative flex items-center">
                  <input
                    id="is_public"
                    name="is_public"
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded"
                    style={{ accentColor: '#ff5757' }}
                  />
                  <span className="ml-2 text-sm font-bold text-gray-800">
                    {formData.is_public ? 'Public (Main Page)' : 'Catalog Only'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;