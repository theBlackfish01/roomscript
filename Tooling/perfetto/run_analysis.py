"""Run the unchanged CLAD phase-one analyzer with a pinned local processor."""
import analyze_lens_trace
from project_processor import TraceProcessor

if __name__ == "__main__":
    analyze_lens_trace._load_trace_processor = lambda: TraceProcessor
    raise SystemExit(analyze_lens_trace.main())
