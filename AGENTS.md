# Nendo TikTok Bot Coding Style Guide

## 1. Frontend (React & TypeScript)

### Component Patterns
- **Functional Components**: Use `export const ComponentName = (...) => { ... }` rather than function declarations.
- **Conditional Styling**: Use the `cn()` utility (based on `clsx` and `tailwind-merge`) for all dynamic class merging.
- **Prop Interfaces**: Define `interface ComponentProps` immediately above the component. Use `React.ElementType` for props that accept Lucide icons.
- **Icon Rendering**: Render dynamic icons using the `<item.icon />` syntax by assigning the icon to a lowercase variable or property.

### State & Navigation
- **View Management**: Use a `currentView` string and `onNavigate` callback pattern for simple SPA navigation within a dashboard layout.
- **Controlled Collapsibles**: Prefer manual state management (`collapsed`, `setCollapsed`) for sidebars to ensure precise control over layout transitions.

### Project Configuration
- **Path Aliasing**: Use the `@/` prefix to reference the `src` directory, configured via Vite and TypeScript.
- **Vite Plugins**: Use `@vitejs/plugin-react-swc` for faster builds and HMR.

## 2. Python (Streamlit & Scraping)

### Module Architecture
- **Sync/Async Hybrid**: Implement core logic (like scrapers) using `async` methods, but provide `_sync` wrapper functions using `asyncio.run()` for compatibility with Streamlit’s synchronous execution model.
- **Resource Management**: Use `@st.cache_resource` for singleton-like objects such as database managers (`SheetsManager`) or ML analyzers (`TikTokAnalyzer`).

### Data Handling
- **Pandas Integration**: Return `pd.DataFrame` from all analysis and data retrieval methods.
- **Defensive Mapping**: When parsing external API results (e.g., Apify), use a private `_map_result` method with extensive `.get()` calls and `try/except` blocks to handle inconsistent JSON schemas.
- **Data Deduplication**: Maintain a `set` of unique identifiers (e.g., `video_id`) when appending data to external storage (Google Sheets) to prevent duplicates.

### UI & Visualization
- **Session State**: Explicitly initialize all state variables (e.g., `data_loaded`, `df`) at the start of the `app.py`.
- **Plotly Configuration**: Use `rgba(0,0,0,0)` for `plot_bgcolor` and `paper_bgcolor` to ensure charts blend seamlessly with the Streamlit theme.
- **Progressive Columns**: Use `st.column_config` (e.g., `ProgressColumn`, `LinkColumn`) to turn standard DataFrames into interactive dashboards.

## 3. General Conventions

### External Integrations
- **Google Sheets**: Treat the first row of a worksheet as the schema definition. Automatically initialize headers if `row_values(1)` is empty.
- **Environment Variables**: Use `os.getenv()` as a fallback for API tokens, but prioritize explicit parameter passing for flexibility.

### Error Handling
- **Visual Feedback**: Use `st.sidebar.error` or `st.sidebar.warning` instead of generic print statements for user-facing errors in the dashboard.
- **Silent Failures**: In mapping functions or loops, use `continue` within `try/except` blocks to ensure a single malformed data point doesn't crash the entire ingestion pipeline.