import supabase from '../config/supabase.js';

export const userService = {
  async findByEmail(email) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Supabase configuration missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.'
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error finding user by email:', error);
      throw new Error(error.message);
    }
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
    return data;
  },

  async createUser({ name, email, passwordHash, role = 'admin' }) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        role,
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message);
    }
    return data;
  },
};

export default userService;
