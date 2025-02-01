import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getWalletName(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from('wallet_names')
      .select('player_name')
      .eq('wallet_address', walletAddress)
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 errors
    
    if (error) {
      console.error('Error fetching wallet name:', error);
      return null;
    }
    
    return data?.player_name || null;
  } catch (error) {
    console.error('Error in getWalletName:', error);
    return null;
  }
}

export async function saveWalletName(walletAddress: string, playerName: string) {
  try {
    const { error } = await supabase
      .from('wallet_names')
      .upsert({ 
        wallet_address: walletAddress,
        player_name: playerName 
      }, { 
        onConflict: 'wallet_address' 
      });
    
    if (error) {
      console.error('Error saving wallet name:', error);
    }
  } catch (error) {
    console.error('Error in saveWalletName:', error);
  }
}