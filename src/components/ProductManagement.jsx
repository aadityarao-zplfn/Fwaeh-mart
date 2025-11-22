import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadProductImage } from '../utils/uploadImage';
import { setStock } from '../utils/inventory';
import { X, Upload, Plus, Edit, Save, Eye, Clock, HelpCircle, Power, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductForm from './ProductForm'; // Adjust path as needed

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [quickEditData, setQuickEditData] = useState({});
  const [hoveredImage, setHoveredImage] = useState(null);
  const { user, profile } = useAuth();

  // Added restock_uncertain to state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
    restock_days: '',
    restock_uncertain: false 
  });

  useEffect(() => {
    if (user) fetchProducts();
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

  // ✅ NEW: Toggle Product Activation Status
  const toggleProductStatus = async (product) => {
    const newStatus = !product.is_active;
    const toastId = toast.loading(newStatus ? 'Activating product...' : 'Deactivating product...');

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: newStatus })
        .eq('id', product.id);

      if (error) throw error;

      // Update local state instantly
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: newStatus } : p
      ));

      toast.success(newStatus ? 'Product is now Live' : 'Product Deactivated (Hidden)', { id: toastId });
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status', { id: toastId });
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
          .update({ is_active: action === 'activate' })
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
      const newStock = parseInt(quickEditData.stock_quantity);
      
      const updatePayload = {
        name: quickEditData.name,
        price: parseFloat(quickEditData.price),
        stock_quantity: newStock
      };

      // If stock added via quick edit, clear alert automatically
      if (newStock > 0) {
        updatePayload.restock_days = null;
      }

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
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
    setSaving(true);
    
    try {
      const toastId = toast.loading(editingProduct ? 'Updating product...' : 'Adding product...');
      
      const stockQty = parseInt(formData.stock_quantity);
      
      // Determine restock_days value
      let restockValue = null;
      if (stockQty === 0) {
        if (formData.restock_uncertain) {
          restockValue = -1; // -1 indicates "Unsure"
        } else if (formData.restock_days) {
          restockValue = parseInt(formData.restock_days);
        }
      }

      const productPayload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: stockQty,
        category: formData.category,
        image_url: formData.image_url,
        restock_days: restockValue,
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully!', { id: toastId });

      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productPayload,
            seller_id: user.id,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;
        toast.success('Product added successfully!', { id: toastId });
      }

      resetFormAndRefresh();
      
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Error saving product: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetFormAndRefresh = () => {
    setFormData({ 
      name: '', description: '', price: '', stock_quantity: '', 
      category: '', image_url: '', restock_days: '', restock_uncertain: false 
    });
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    // Handle logic for "Unsure" state (-1)
    const isUnsure = product.restock_days === -1;
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || '',
      image_url: product.image_url || '',
      restock_days: isUnsure ? '' : (product.restock_days || ''),
      restock_uncertain: isUnsure
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

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
    setFormData({ 
      name: '', description: '', price: '', stock_quantity: '', 
      category: '', image_url: '', restock_days: '', restock_uncertain: false 
    });
    setShowForm(false);
    setEditingProduct(null);
    toast('Form cancelled');
  };

  // Helper to determine visibility of restock fields
  const showRestockField = () => {
    const isStockZero = parseInt(formData.stock_quantity) === 0;
    // Only for own products, not proxies
    const isProxy = editingProduct?.is_proxy === true;
    return isStockZero && !isProxy;
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
              className="px-3 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-1"
              style={{ background: '#fff5f5', color: '#16a34a', border: '2px solid #86efac' }}
            >
              <CheckCircle size={14} /> Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-1"
              style={{ background: '#fff5f5', color: '#6b7280', border: '2px solid #9ca3af' }}
            >
              <Power size={14} /> Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-2 text-sm rounded-lg font-medium text-white transition-all flex items-center gap-1"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}
            >
              <Trash2 size={14} /> Delete
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
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                    Price (₹) <span className="text-red-500">*</span>
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

              {/* 🚀 RESTOCK ALERT SECTION */}
              {showRestockField() && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="text-orange-500" size={18} />
                    <label className="block text-sm font-bold text-orange-800">
                      Restock Estimation (Alert)
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Option 1: Specific Days */}
                    <div className={`transition-all ${formData.restock_uncertain ? 'opacity-50 pointer-events-none' : ''}`}>
                      <p className="text-xs text-orange-700 mb-1 font-medium">Estimated days until available:</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={formData.restock_days}
                          onChange={(e) => setFormData({ ...formData, restock_days: e.target.value })}
                          placeholder="e.g., 5"
                          className="w-full pl-4 pr-12 py-2 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-200 outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                          Days
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-xs text-orange-400 font-bold">
                      - OR -
                    </div>

                    {/* Option 2: Unsure */}
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-orange-100 transition-colors">
                      <input 
                        type="checkbox"
                        checked={formData.restock_uncertain}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          restock_uncertain: e.target.checked,
                          restock_days: e.target.checked ? '' : formData.restock_days 
                        })}
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
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  placeholder="e.g., Electronics, Clothing (optional)"
                />
              </div>

              <div className="pt-2">
                <p className="text-xs text-red-600">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
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
            <div 
              key={product.id} 
              className={`rounded-xl overflow-hidden shadow-lg transition-all ${!product.is_active ? 'opacity-75' : ''}`} 
              style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}
            >
              {/* Image with hover preview */}
              <div 
                className="relative w-full h-48 overflow-hidden group"
                onMouseEnter={() => setHoveredImage(product.id)}
                onMouseLeave={() => setHoveredImage(null)}
              >
                <img
                  src={product.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={product.name}
                  className={`w-full h-48 object-cover transition-transform duration-300 ${!product.is_active ? 'grayscale' : ''}`}
                />
                
                {/* STATUS BADGES */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 items-end">
                    {/* Is Active Badge */}
                    {product.is_active ? (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                             <CheckCircle size={10} /> Active
                        </div>
                    ) : (
                        <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm flex items-center gap-1">
                             <Power size={10} /> Inactive
                        </div>
                    )}

                    {product.is_proxy && (
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Proxy Product</div>
                    )}
                </div>

                {/* Restock Alert Badge */}
                {product.stock_quantity === 0 && product.restock_days && (
                   <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold flex items-center gap-1">
                     {product.restock_days === -1 ? (
                       <>
                         <HelpCircle size={12} />
                         <span>Unsure Restock</span>
                       </>
                     ) : (
                       <>
                         <Clock size={12} />
                         <span>In {product.restock_days} days</span>
                       </>
                     )}
                   </div>
                )}
        
                {/* Image preview overlay */}
                {hoveredImage === product.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20 cursor-pointer" onClick={() => handleEdit(product)}>
                    <div className="text-center text-white p-4">
                      <Eye size={32} className="mx-auto mb-2" />
                      <p className="text-sm">Click Edit to change image</p>
                    </div>
                  </div>
                )}

                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="rounded border-red-300 text-red-600 focus:ring-red-500 w-5 h-5"
                  />
                </div>
              </div>

              <div className="p-4">
                {/* Status Alert Block if Inactive */}
                {!product.is_active && (
                    <div className="bg-gray-200 p-2 rounded mb-3 text-center">
                         <p className="text-xs font-bold text-gray-600">⛔ Currently hidden from customers</p>
                    </div>
                )}

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
                      <span className="text-2xl font-bold" style={{ color: '#ff5757' }}>₹{product.price}</span>
                      <span className="text-sm" style={{ color: '#dc2626' }}>Stock: {product.stock_quantity}</span>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {editingId === product.id ? (
                    <>
                      <button
                        onClick={() => saveQuickEdit(product.id)}
                        className="col-span-1 flex items-center justify-center py-2 rounded-lg text-sm text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}
                      >
                        <Save size={14} className="mr-1" />
                        Save
                      </button>
                      <button
                        onClick={cancelQuickEdit}
                        className="col-span-1 flex items-center justify-center py-2 rounded-lg text-sm transition-all"
                        style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Activate/Deactivate Toggle Button */}
                      <button 
                        onClick={() => toggleProductStatus(product)}
                        className={`col-span-2 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${
                          product.is_active 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                        }`}
                      >
                        <Power size={14} className="mr-1" />
                        {product.is_active ? 'Deactivate Product' : 'Activate Product'}
                      </button>

                      <button
                        onClick={() => startQuickEdit(product)}
                        className="flex items-center justify-center py-2 rounded-lg text-sm text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #f87171 0%, #fca5a5 100%)' }}
                      >
                        <Edit size={14} className="mr-1" />
                        Quick
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex items-center justify-center py-2 rounded-lg text-sm text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                      >
                        Full Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="col-span-2 flex items-center justify-center py-2 rounded-lg text-sm transition-all hover:bg-red-50"
                        style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5' }}
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ✅ ADD PRODUCT FORM MODAL */}
      {showForm && (
        <ProductForm 
          product={editingProduct} 
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts(); // Refresh products after form closes
          }} 
        />
      )}
    </div>
  );
};

export default ProductManagement;