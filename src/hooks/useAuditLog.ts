import { useState, useEffect } from 'react';
import { AuditEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const AUDIT_KEY = '@elis-sistema:audit-log';

export const useAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUDIT_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {
        console.error('Failed to parse audit log');
      }
    }
    setIsLoaded(true);
  }, []);

  const saveEntries = (newEntries: AuditEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(newEntries));
  };

  const addEntry = (entry: Omit<AuditEntry, 'id' | 'dataHora'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: uuidv4(),
      dataHora: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    saveEntries(updated);
    return newEntry;
  };

  const getEntriesByOrderId = (orderId: string) => {
    return entries.filter(e => e.order_id === orderId);
  };

  const clearAuditLog = () => {
    saveEntries([]);
  };

  return {
    entries,
    isLoaded,
    addEntry,
    getEntriesByOrderId,
    clearAuditLog,
  };
};
