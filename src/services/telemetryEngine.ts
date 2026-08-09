import { supabase } from '@/lib/supabase/client';

export type EventType = 'PROMPT_RECEIVED' | 'CONTEXT_LOADED' | 'CONTEXT_FAILED' | 'TOOL_SELECTED' | 'TOOL_SUCCESS' | 'TOOL_FAILED' | 'ORCHESTRATOR_RESPONSE' | 'ERROR' | 'DB_WRITE';
export type StatusType = 'SUCCESS' | 'FAILED' | 'INFO';

export interface TelemetryEvent {
    user_id: string;
    request_id: string;
    event_type: EventType;
    module: string;
    payload?: Record<string, any>;
    latency_ms?: number;
    status: StatusType;
}

class TelemetryEngine {
    /**
     * Generate a unique request ID for a new AI flow (e.g. REQ-20260806-392812)
     */
    public generateRequestId(): string {
        const now = new Date();
        const yyyymmdd = now.toLocaleDateString('en-CA').replace(/-/g, '');
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        return `REQ-${yyyymmdd}-${randomNum}`;
    }

    /**
     * Fire-and-forget logging to Supabase.
     * We don't await this so it doesn't block critical paths.
     */
    public logEvent(event: TelemetryEvent) {
        // Fire asynchronously
        this._pushToSupabase(event).catch(err => {
            // Fallback to console if DB write fails (e.g., if table isn't created yet)
            if (err?.code === 'PGRST205') {
                console.warn(`[Telemetry] Schema cache stale. Please run 'NOTIFY pgrst, "reload schema"' in Supabase SQL editor.`);
            } else {
                console.error(`[TELEMETRY FAILURE] Request: ${event.request_id} | Event: ${event.event_type} | Module: ${event.module}`, err);
            }
        });

        // Also print beautifully to dev console if in dev mode
        if (process.env.NODE_ENV === 'development') {
            const icon = event.status === 'SUCCESS' ? '🟢' : event.status === 'FAILED' ? '🔴' : '🔵';
            console.log(`${icon} [${event.request_id}] [${event.module}] ${event.event_type} (${event.latency_ms ? event.latency_ms + 'ms' : '-'})`, event.payload || '');
        }
    }

    private async _pushToSupabase(event: TelemetryEvent) {
        if (!event.user_id) return;

        const { error } = await supabase.from('telemetry_logs').insert({
            user_id: event.user_id,
            request_id: event.request_id,
            event_type: event.event_type,
            module: event.module,
            payload: event.payload || {},
            latency_ms: event.latency_ms || null,
            status: event.status
        });

        if (error) {
            throw error;
        }
    }
}

export const telemetryEngine = new TelemetryEngine();

