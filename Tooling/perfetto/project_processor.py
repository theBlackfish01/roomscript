"""Project-local Perfetto configuration; never downloads into the user profile."""
from pathlib import Path
from perfetto.trace_processor import TraceProcessor as NativeTraceProcessor
from perfetto.trace_processor import TraceProcessorConfig


def TraceProcessor(*args, **kwargs):
    binary = Path(__file__).resolve().parent.parent / "bin" / "perfetto" / "trace_processor_shell.exe"
    if not binary.is_file():
        raise FileNotFoundError(f"Install the checksum-pinned project-local processor first: {binary}")
    kwargs.setdefault("config", TraceProcessorConfig(
        bin_path=str(binary), unique_port=True, load_timeout=30,
        fetch_latest_trace_processor=False,
    ))
    return NativeTraceProcessor(*args, **kwargs)
