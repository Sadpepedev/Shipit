import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Clock, Wallet, Download, Trash2, Shield } from 'lucide-react';
import { useAccount } from 'wagmi';

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthorizedExporter, setIsAuthorizedExporter] = useState(false);
  const { address } = useAccount();
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      if (data) {
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    const channel = supabase
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes
          schema: 'public',
          table: 'leaderboard'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkExportAuthorization = async () => {
      if (!address) {
        setIsAuthorizedExporter(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('authorized_exporters')
          .select('wallet_address')
          .eq('wallet_address', address)
          .single();

        if (error) throw error;
        setIsAuthorizedExporter(!!data);
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorizedExporter(false);
      }
    };

    checkExportAuthorization();
  }, [address]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthorizedExporter) return;

    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .not('wallet_address', 'is', null)
        .order('score', { ascending: false });

      if (error) throw error;
      if (!data) return;

      const headers = ['Player Name', 'Wallet Address', 'Score', 'Date'];
      const csvContent = [
        headers.join(','),
        ...data.map(entry => [
          `"${entry.player_name}"`,
          entry.wallet_address,
          entry.score,
          new Date(entry.created_at).toISOString()
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting leaderboard:', error);
      alert('Failed to export leaderboard. Please try again.');
    }
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthorizedExporter || !address || isResetting) return;

    const confirmed = window.confirm(
      'Are you sure you want to reset the leaderboard? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setIsResetting(true);
      
      const { error } = await supabase.rpc('reset_leaderboard', {
        admin_wallet: address
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the leaderboard after reset
      await fetchLeaderboard();
      
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
      alert('Failed to reset leaderboard: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <div 
      className="bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Top Players</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">
                    = Verified Player
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {isAuthorizedExporter && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isResetting || !address}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset leaderboard"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-medium">Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium">Reset</span>
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                disabled={isResetting}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export leaderboard"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Leaderboard Content */}
      <div 
        className="overflow-y-auto overscroll-contain max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading scores...
            </div>
          ) : entries.length > 0 ? (
            entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`group p-4 ${
                  entry.wallet_address === address 
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                } rounded-xl relative transition-all border border-gray-200`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {index === 0 ? (
                        <Medal className="w-6 h-6 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="w-6 h-6 text-gray-400" />
                      ) : index === 2 ? (
                        <Medal className="w-6 h-6 text-amber-600" />
                      ) : (
                        <span className="font-bold text-gray-400">#{index + 1}</span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {entry.player_name}
                        </span>
                        {entry.wallet_address && (
                          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      {entry.wallet_address && (
                        <span className="text-sm text-gray-500">
                          {shortenAddress(entry.wallet_address)}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-lg text-blue-600">
                    {entry.score}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No scores yet. Be the first to play!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;