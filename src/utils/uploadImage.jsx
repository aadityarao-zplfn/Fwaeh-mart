import { supabase } from '../lib/supabase';

export const uploadProductImage = async (file) => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, error: error.message };
  }
};

export const deleteProductImage = async (imageUrl) => {
  try {
    console.log('🗑️ Starting delete for:', imageUrl);

    // Extract filename from URL more carefully
    const urlObj = new URL(imageUrl);
    const pathSegments = urlObj.pathname.split('/');
    
    // Find the position of 'product-images' in the path
    const bucketIndex = pathSegments.indexOf('product-images');
    if (bucketIndex === -1) {
      throw new Error('Could not find product-images in URL');
    }
    
    // Get everything after 'product-images'
    const filePath = pathSegments.slice(bucketIndex + 1).join('/');
    console.log('📁 File path to delete:', filePath);

    // VERIFY FILE EXISTS FIRST
    const { data: fileExists, error: checkError } = await supabase.storage
      .from('product-images')
      .list('products', {
        search: filePath.replace('products/', '')
      });

    if (checkError) {
      console.error('❌ Error checking file existence:', checkError);
      throw checkError;
    }

    console.log('🔍 File exists check:', fileExists);

    if (!fileExists || fileExists.length === 0) {
      throw new Error('File not found in storage');
    }

    // ATTEMPT DELETE
    const { data: deleteResult, error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    console.log('📋 Delete result:', deleteResult);
    console.log('❌ Delete error:', deleteError);

    if (deleteError) {
      throw deleteError;
    }

    // VERIFY DELETE WAS SUCCESSFUL
    console.log('🔍 Verifying delete...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const { data: verifyFiles, error: verifyError } = await supabase.storage
      .from('product-images')
      .list('products', {
        search: filePath.replace('products/', '')
      });

    if (verifyError) {
      console.error('❌ Error verifying delete:', verifyError);
    } else {
      console.log('✅ Verification - files remaining:', verifyFiles);
      
      if (verifyFiles && verifyFiles.length > 0) {
        throw new Error('File still exists after delete operation');
      }
    }

    console.log('🎉 Delete verified successfully!');
    return { success: true, error: null };

  } catch (error) {
    console.error('💥 Delete failed:', error);
    return { success: false, error: error.message };
  }
}; 