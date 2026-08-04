# Debugging Rules

- **Native UI Alerts for Debugging:** Whenever we debug a client-side issue or add temporary runtime instrumentation to catch an error, we MUST use native browser `alert()` pop-ups to surface the error directly on the screen (e.g., `alert("Error: " + error.message)`). This ensures the user can see the exact error message immediately in the UI without needing to open the browser console.
