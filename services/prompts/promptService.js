const { supabase } = require('../db/supabase.service');

module.exports = { 
  getActivePrompt: async () => {
    try {
        const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'active_prompt_id').single();
        if (!setting) return { greeting: '', text: '' };
        
        const { data } = await supabase.from('prompts').select('greeting, text').eq('id', setting.value).single();
        return data || { greeting: '', text: '' };
    } catch (e) { return { greeting: '', text: '' }; }
  },

  getActiveReminderPrompt: async () => {
    try {
        const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'active_reminder_prompt_id').single();
        if (!setting) return { greeting: '', text: '' };
        
        const { data } = await supabase.from('reminder_prompts').select('greeting, text').eq('id', setting.value).single();
        return data || { greeting: '', text: '' };
    } catch (e) { return { greeting: '', text: '' }; }
  },

  readPrompts: async () => {
    const { data: prompts } = await supabase.from('prompts').select('id, name, greeting, text').order('created_at', { ascending: true });
    const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'active_prompt_id').single();
    return { activeId: setting?.value, prompts: prompts || [] };
  },

  upsertPrompt: async (p) => {
    await supabase.from('prompts').upsert({
        id: String(p.id),
        name: p.name,
        greeting: p.greeting,
        text: p.text,
        updated_at: new Date().toISOString()
    });
  },

  setActivePrompt: async (id) => {
    await supabase.from('app_settings').upsert({ key: 'active_prompt_id', value: String(id) });
  },

  deletePrompt: async (id) => {
    await supabase.from('prompts').delete().eq('id', String(id));
  },
  
  readReminderPrompts: async () => {
    const { data: prompts } = await supabase.from('reminder_prompts').select('id, name, greeting, text').order('created_at', { ascending: true });
    const { data: setting } = await supabase.from('app_settings').select('value').eq('key', 'active_reminder_prompt_id').single();
    return { activeId: setting?.value, prompts: prompts || [] };
  },

  upsertReminderPrompt: async (p) => {
    await supabase.from('reminder_prompts').upsert({
        id: String(p.id),
        name: p.name,
        greeting: p.greeting,
        text: p.text,
        updated_at: new Date().toISOString()
    });
  },

  setActiveReminderPrompt: async (id) => {
    await supabase.from('app_settings').upsert({ key: 'active_reminder_prompt_id', value: String(id) });
  },

  deleteReminderPrompt: async (id) => {
    await supabase.from('reminder_prompts').delete().eq('id', String(id));
  }
};
