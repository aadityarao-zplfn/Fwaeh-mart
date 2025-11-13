import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadProductImage } from '../utils/uploadImage';
import { X, Upload, Plus, Edit, Save, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [quickEditData, setQuickEditData] = useState({});
  const [hoveredImage, setHoveredImage] = useState(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to perform bulk action');
      return;
    }

    try {
      const productIds = Array.from(selectedProducts);
      const toastId = toast.loading(`Processing ${productIds.length} product(s)...`);
      
      if (action === 'delete') {
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', productIds);

        if (error) throw error;
        toast.success(`Successfully deleted ${productIds.length} product(s)`, { id: toastId });
      } else if (action === 'activate' || action === 'deactivate') {
        const { error } = await supabase
          .from('products')
          .update({ active: action === 'activate' })
          .in('id', productIds);

        if (error) throw error;
        toast.success(`${action === 'activate' ? 'Activated' : 'Deactivated'} ${productIds.length} product(s)`, { id: toastId });
      }

      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  // Quick edit inline
  const startQuickEdit = (product) => {
    setEditingId(product.id);
    setQuickEditData({
      name: product.name,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
  };

  const cancelQuickEdit = () => {
    setEditingId(null);
    setQuickEditData({});
    toast('Quick edit cancelled');
  };

  const saveQuickEdit = async (productId) => {
    try {
      const toastId = toast.loading('Updating product...');
      const { error } = await supabase
        .from('products')
        .update({
          name: quickEditData.name,
          price: parseFloat(quickEditData.price),
          stock_quantity: parseInt(quickEditData.stock_quantity)
        })
        .eq('id', productId);

      if (error) throw error;

      setEditingId(null);
      setQuickEditData({});
      toast.success('Product updated successfully!', { id: toastId });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(`Error updating product: ${error.message}`);
    }
  };

  const handleQuickEditChange = (field, value) => {
    setQuickEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      const toastId = toast.loading('Uploading image...');
      const { url, error } = await uploadProductImage(file);

      if (error) {
        toast.error(`Failed to upload image: ${error}`, { id: toastId });
      } else {
        setFormData(prev => ({
          ...prev,
          image_url: url
        }));
        toast.success('Image uploaded successfully!', { id: toastId });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const toastId = toast.loading(editingProduct ? 'Updating product...' : 'Adding product...');
      
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            ...formData,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity)
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully!', { id: toastId });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...formData,
            seller_id: user.id,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity)
          }]);

        if (error) throw error;
        toast.success('Product added successfully!', { id: toastId });
      }

      setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '', image_url: '' });
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Error saving product: ${error.message}`);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || '',
      image_url: product.image_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const toastId = toast.loading('Deleting product...');
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted successfully!', { id: toastId });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(`Error deleting product: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '', image_url: '' });
    setShowForm(false);
    setEditingProduct(null);
    toast('Form cancelled');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#ff5757' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: '#b91c1c' }}>My Products</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
        >
          <Plus size={20} className="mr-2" />
          Add New Product
        </button>
      </div>

      {/* Bulk Actions */}
      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedProducts.size === products.length && products.length > 0}
              onChange={selectAllProducts}
              className="rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium" style={{ color: '#b91c1c' }}>
              Select All ({selectedProducts.size} selected)
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-2 text-sm rounded-lg font-medium transition-all"
              style={{ background: '#fff5f5', color: '#16a34a', border: '2px solid #86efac' }}
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-2 text-sm rounded-lg font-medium transition-all"
              style={{ background: '#fff5f5', color: '#dc2626', border: '2px solid #fca5a5' }}
            >
              Deactivate Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-2 text-sm rounded-lg font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#b91c1c' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={resetForm} className="p-2 rounded-full hover:bg-red-100" style={{ color: '#ff5757' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                  Product Image
                </label>
                
                {/* Image Preview */}
                <div className="mb-4">
                  <div className="w-48 h-48 border-2 border-dashed border-red-300 rounded-xl overflow-hidden bg-red-50 flex items-center justify-center mx-auto">
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-red-400">
                        <Upload size={48} className="mx-auto mb-2" />
                        <p className="text-sm">No image selected</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-full px-4 py-3 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 text-center font-medium transition-all cursor-pointer">
                    Choose Product Image
                  </div>
                </label>
                
                <p className="text-xs text-red-600 mt-2 text-center">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>

              {/* Product Name - REQUIRED */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  required
                  placeholder="Enter product name"
                />
              </div>

              {/* Description - OPTIONAL */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  rows="3"
                  placeholder="Describe your product (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price - REQUIRED */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                    Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                    style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                    required
                    placeholder="0.00"
                  />
                </div>

                {/* Stock - REQUIRED */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                    style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category - OPTIONAL */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  placeholder="e.g., Electronics, Clothing (optional)"
                />
              </div>

              {/* Required Fields Note */}
              <div className="pt-2">
                <p className="text-xs text-red-600">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
                  style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
          <p className="mb-4" style={{ color: '#dc2626' }}>You haven't added any products yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl overflow-hidden shadow-lg" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
              {/* Image with hover preview */}
              <div 
                className="relative w-full h-48 overflow-hidden"
                onMouseEnter={() => setHoveredImage(product.id)}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={product.name}
                  className="w-full h-48 object-cover transition-transform duration-300"
                />
                
                {/* Image preview overlay */}
                {hoveredImage === product.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <Eye size={32} className="mx-auto mb-2" />
                      <p className="text-sm">Click Edit to change image</p>
                    </div>
                  </div>
                )}

                {/* Selection checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="rounded border-red-300 text-red-600 focus:ring-red-500 w-5 h-5"
                  />
                </div>
              </div>

              <div className="p-4">
                {/* Stock Alert */}
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <div className="bg-orange-100 border-l-4 border-orange-500 p-3 mb-4">
                    <p className="text-sm text-orange-700">
                      ⚠️ Low stock alert! Only {product.stock_quantity} units remaining
                    </p>
                  </div>
                )}

                {/* Quick Edit Fields */}
                {editingId === product.id ? (
                  <div className="space-y-3 mb-4">
                    <input
                      type="text"
                      value={quickEditData.name || ''}
                      onChange={(e) => handleQuickEditChange('name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 outline-none text-sm"
                      style={{ background: '#fff', borderColor: '#fca5a5', color: '#b91c1c' }}
                      placeholder="Product name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={quickEditData.price || ''}
                        onChange={(e) => handleQuickEditChange('price', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 outline-none text-sm"
                        style={{ background: '#fff', borderColor: '#fca5a5', color: '#b91c1c' }}
                        placeholder="Price"
                      />
                      <input
                        type="number"
                        value={quickEditData.stock_quantity || ''}
                        onChange={(e) => handleQuickEditChange('stock_quantity', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 outline-none text-sm"
                        style={{ background: '#fff', borderColor: '#fca5a5', color: '#b91c1c' }}
                        placeholder="Stock"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#b91c1c' }}>{product.name}</h3>
                    <p className="text-sm mb-3 line-clamp-2" style={{ color: '#dc2626' }}>{product.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold" style={{ color: '#ff5757' }}>${product.price}</span>
                      <span className="text-sm" style={{ color: '#dc2626' }}>Stock: {product.stock_quantity}</span>
                    </div>
                  </>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-blue-100 p-2 rounded">
                    <p className="text-xs text-gray-600">Views</p>
                    <p className="font-bold text-blue-600">0</p>
                  </div>
                  <div className="bg-green-100 p-2 rounded">
                    <p className="text-xs text-gray-600">Sold</p>
                    <p className="font-bold text-green-600">0</p>
                  </div>
                  <div className="bg-rose-200 p-2 rounded">
                    <p className="text-xs text-gray-600">Rating</p>
                    <p className="font-bold text-rose-600">⭐ 0</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {editingId === product.id ? (
                    <>
                      <button
                        onClick={() => saveQuickEdit(product.id)}
                        className="flex items-center justify-center flex-1 py-2 rounded-lg text-sm text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}
                      >
                        <Save size={14} className="mr-1" />
                        Save
                      </button>
                      <button
                        onClick={cancelQuickEdit}
                        className="flex-1 py-2 rounded-lg text-sm transition-all"
                        style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startQuickEdit(product)}
                        className="flex items-center justify-center flex-1 py-2 rounded-lg text-sm text-white transition-all"
style={{ background: 'linear-gradient(135deg, #f87171 0%, #fca5a5 100%)' }}

                      >
                        <Edit size={14} className="mr-1" />
                        Quick Edit
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 py-2 rounded-lg text-sm text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                      >
                        Full Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 py-2 rounded-lg text-sm transition-all"
                        style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;