import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadProductImage } from '../utils/uploadImage';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed
import toast from 'react-hot-toast'; // Make sure you have toast installed


const ProductForm = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useAuth();

  // 🔥 CRITICAL: Populate form when editing existing product
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category,
        stock_quantity: product.stock_quantity,
        image_url: product.image_url || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    const { url, error } = await uploadProductImage(file);
    setUploading(false);

if (error) {
  toast.error(`Failed to upload image: ${error}`);
  setImagePreview(null);
} else {
  toast.success('Image uploaded successfully!');
  setFormData({ ...formData, image_url: url });
}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.price || !formData.category || !formData.stock_quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            ...formData,
            price: parseFloat(formData.price), // Ensure number type
            stock_quantity: parseInt(formData.stock_quantity),
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([
            {
              ...formData,
              price: parseFloat(formData.price),
              stock_quantity: parseInt(formData.stock_quantity),
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Image
              </label>
              <div className="flex items-center space-x-4">
                {/* Image Preview */}
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">No image</p>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className={`px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-center font-medium transition ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}>
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG up to 5MB
                  </p>
                  {formData.image_url && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Image ready to save
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rest of form fields */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Food & Beverages">Food & Beverages</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Sports & Outdoors">Sports & Outdoors</option>
                <option value="Books & Media">Books & Media</option>
                <option value="Toys & Games">Toys & Games</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Other">Other</option>
              </select>
            </div>

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
                onClick={onClose}
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
