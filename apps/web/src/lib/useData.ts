import { useSyncExternalStore } from 'react';
import { getSyncState, subscribeSync } from './offline/sync';

export const useSync = () => useSyncExternalStore(subscribeSync, getSyncState, getSyncState);
