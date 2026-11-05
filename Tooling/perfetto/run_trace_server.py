"""Run the unchanged CLAD optional SQL server with a pinned local processor."""
import trace_server
from project_processor import TraceProcessor

if __name__ == "__main__":
    trace_server.TraceProcessor = TraceProcessor
    trace_server.main()
