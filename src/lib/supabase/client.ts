/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

    let httpStatus = 0;
    try {
        const response = await fetch(input, init);
        httpStatus = response.status;
        
        const executionTimeMs = Math.round(performance.now() - startTime);
        
        // Push log asynchronously
        if (typeof window !== 'undefined') {
            setTimeout(async () => {
                let returnedData = '<Response body not parsed to preserve stream>';
                let returnedError = !response.ok ? `<HTTP ${response.status}>` : null;
                
                try {
                    // Clone response to not drain the original stream
                    const clonedResponse = response.clone();
                    const text = await clonedResponse.text();
                    
                    if (!response.ok) {
                        returnedError = text;
                        // Use native UI alert for debugging per User Rules
                        alert(`Supabase Error (${table} / ${operation}):\nStatus: ${response.status}\nMessage: ${text}`);
                    } else if (text.length < 5000) {
                        // Only try to parse small bodies to avoid massive debug logs
                        try {
                            returnedData = JSON.parse(text);
                        } catch {
                            returnedData = text;
                        }
                    }
                } catch (e) {
                    // Ignore cloning/reading errors
                }

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
        let returnedError = error;
        
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

export const getURL = () => {
    let url =
        (typeof window !== 'undefined' ? window.location.origin : null) ??
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        'http://localhost:4028/';
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return url;
};
