import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
    stock: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            ...formData,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock)
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
            stock: parseInt(formData.stock)
          }]);

        if (error) throw error;
      }

      setFormData({ name: '', description: '', price: '', stock: '', category: '', image_url: '' });
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
      stock: product.stock.toString(),
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
    setFormData({ name: '', description: '', price: '', stock: '', category: '', image_url: '' });
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
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                    style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                    style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none"
                  style={{ background: '#fff5f5', borderColor: '#fca5a5', color: '#b91c1c' }}
                  placeholder="https://example.com/image.jpg"
                />
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
                  <span className="text-sm" style={{ color: '#dc2626' }}>Stock: {product.stock}</span>
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