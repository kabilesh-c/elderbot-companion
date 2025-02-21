
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequest {
  phone_number: string;
  message: string;
  reminder_type: 'daily' | 'monthly';
  reminder_time: string;
  reminder_day?: number;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { phone_number, message, reminder_type, reminder_time, reminder_day, user_id } = await req.json() as ReminderRequest;

    // Calculate next reminder time
    const now = new Date();
    const [hours, minutes] = reminder_time.split(':').map(Number);
    let nextReminder = new Date(now);
    nextReminder.setHours(hours, minutes, 0, 0);

    if (reminder_type === 'monthly' && reminder_day) {
      nextReminder.setDate(reminder_day);
      if (nextReminder < now) {
        nextReminder.setMonth(nextReminder.getMonth() + 1);
      }
    } else if (nextReminder < now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const { data, error } = await supabaseClient
      .from('reminders')
      .insert({
        phone_number,
        message,
        reminder_type,
        reminder_time,
        reminder_day: reminder_type === 'monthly' ? reminder_day : null,
        next_reminder: nextReminder.toISOString(),
        user_id: user_id || null
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
