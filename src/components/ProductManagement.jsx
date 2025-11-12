import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadProductImage } from '../utils/uploadImage';
import { X, Upload, Plus } from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      // Upload to Supabase
      const { url, error } = await uploadProductImage(file);

      if (error) {
        alert('Failed to upload image: ' + error);
      } else {
        // Auto-fill the image_url field
        setFormData(prev => ({
          ...prev,
          image_url: url
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
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
      }

      setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '', image_url: '' });
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
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
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock_quantity: '', category: '', image_url: '' });
    setShowForm(false);
    setEditingProduct(null);
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
                
                {/* Show status when image is uploaded */}
                {formData.image_url && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700 text-center">
                      ✅ Image uploaded successfully!
                    </p>
                  </div>
                )}
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
              <img
                src={product.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#b91c1c' }}>{product.name}</h3>
                <p className="text-sm mb-3 line-clamp-2" style={{ color: '#dc2626' }}>{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold" style={{ color: '#ff5757' }}>${product.price}</span>
                  <span className="text-sm" style={{ color: '#dc2626' }}>Stock: {product.stock_quantity}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 py-2 rounded-lg font-medium text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 py-2 rounded-lg font-medium transition-all"
                    style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
                  >
                    Delete
                  </button>
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