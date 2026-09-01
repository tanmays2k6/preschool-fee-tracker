import supabase from '../config/supabase.js';

export const settingsService = {
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching settings:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      // Create default settings if not exists
      const { data: newSettings, error: insertError } = await supabase
        .from('settings')
        .insert({
          school_name: 'Preschool Name',
          receipt_prefix: 'FNL-',
          academic_session: '2026-27',
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      return this.formatSettings(newSettings);
    }

    return this.formatSettings(data[0]);
  },

  async updateSettings(updateData) {
    const current = await this.getSettings();

    const dbPayload = {};
    if (updateData.schoolName !== undefined) dbPayload.school_name = updateData.schoolName;
    if (updateData.schoolLogo !== undefined) dbPayload.school_logo = updateData.schoolLogo;
    if (updateData.address !== undefined) dbPayload.address = updateData.address;
    if (updateData.phone !== undefined) dbPayload.phone = updateData.phone;
    if (updateData.email !== undefined) dbPayload.email = updateData.email;
    if (updateData.academicSession !== undefined) dbPayload.academic_session = updateData.academicSession;
    if (updateData.receiptPrefix !== undefined) dbPayload.receipt_prefix = updateData.receiptPrefix;
    if (updateData.defaultMonthlyFee !== undefined) dbPayload.default_monthly_fee = updateData.defaultMonthlyFee;
    if (updateData.defaultTransportFee !== undefined) dbPayload.default_transport_fee = updateData.defaultTransportFee;
    if (updateData.currencySymbol !== undefined) dbPayload.currency_symbol = updateData.currencySymbol;

    const { data, error } = await supabase
      .from('settings')
      .update(dbPayload)
      .eq('id', current.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      throw new Error(error.message);
    }

    return this.formatSettings(data);
  },

  formatSettings(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      schoolName: row.school_name,
      schoolLogo: row.school_logo,
      address: row.address,
      phone: row.phone,
      email: row.email,
      academicSession: row.academic_session,
      receiptPrefix: row.receipt_prefix,
      defaultMonthlyFee: Number(row.default_monthly_fee || 0),
      defaultTransportFee: Number(row.default_transport_fee || 0),
      currencySymbol: row.currency_symbol || '₹',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

export default settingsService;
