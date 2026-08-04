import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { useDebugStore, SupabaseOperation } from '@/store/useDebugStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqrijxdedtbxondzytn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nF0uJxWX_u6dXEctsbbrRA_2j2-Y7gu';

// Custom fetch to intercept all Supabase requests
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startTime = performance.now();
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    
    let table = 'unknown';
    let operation: SupabaseOperation = 'unknown';
    
    // Parse URL to determine table and operation
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        if (urlObj.pathname.startsWith('/rest/v1/rpc/')) {
            operation = 'RPC';
            table = pathParts[pathParts.length - 1]; // function name
        } else if (urlObj.pathname.startsWith('/rest/v1/')) {
            table = pathParts[pathParts.length - 1];
            if (method === 'GET') operation = 'select';
            else if (method === 'POST') {
                operation = init?.headers && (init.headers as any)['Prefer']?.includes('resolution=merge-duplicates') 
                    ? 'upsert' : 'insert';
            }
            else if (method === 'PATCH') operation = 'update';
            else if (method === 'DELETE') operation = 'delete';
        } else if (urlObj.pathname.startsWith('/storage/v1/')) {
            table = 'storage';
            if (method === 'POST' || method === 'PUT') operation = 'storage upload';
            else if (method === 'DELETE') operation = 'storage delete';
            else operation = 'select';
        } else if (urlObj.pathname.startsWith('/auth/v1/')) {
            table = 'auth';
            operation = 'auth call';
        }
    } catch(e) {}

    // Parse payload safely
    let payload = null;
    if (init?.body) {
        try {
            payload = typeof init.body === 'string' ? JSON.parse(init.body) : '<Binary/FormData payload>';
        } catch(e) {
            payload = init.body;
        }
    }

    let returnedError = null;
    let returnedData = null;
    let httpStatus = 0;
    let responseClone: Response | null = null;

    try {
        const response = await fetch(input, init);
        httpStatus = response.status;
        responseClone = response.clone();
        
        if (!response.ok) {
            try {
                returnedError = await responseClone.json();
            } catch(e) {
                returnedError = await responseClone.text();
            }
        } else {
            // Only try to parse JSON if it has content
            if (response.status !== 204) {
                try {
                    returnedData = await responseClone.json();
                } catch(e) {
                    returnedData = '<Non-JSON response>';
                }
            }
        }
        
        const executionTimeMs = Math.round(performance.now() - startTime);
        
        // Push log asynchronously to avoid blocking the return
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                const state = useDebugStore.getState();
                state.addLog({
                    table,
                    operation,
                    payload,
                    returnedData,
                    returnedError,
                    httpStatus,
                    executionTimeMs,
                    authenticatedUserId: state.contextState.userId,
                    url,
                    method
                });
            }, 0);
        }

        return response;
    } catch (error) {
        const executionTimeMs = Math.round(performance.now() - startTime);
        returnedError = error;
        
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                const state = useDebugStore.getState();
                state.addLog({
                    table,
                    operation,
                    payload,
                    returnedData: null,
                    returnedError,
                    httpStatus: 0,
                    executionTimeMs,
                    authenticatedUserId: state.contextState.userId,
                    url,
                    method
                });
            }, 0);
        }
        throw error;
    }
};

export const createClient = () => {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        global: {
            fetch: customFetch
        }
    });
};

export const supabase = createClient();
