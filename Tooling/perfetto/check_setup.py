"""Read-only dependency/hash check; no trace processor process or Lens access."""
import hashlib
import importlib.metadata
import json
import sys
from pathlib import Path
import project_processor
import analyze_lens_trace
import trace_server

binary = Path(__file__).resolve().parent.parent / "bin" / "perfetto" / "trace_processor_shell.exe"
digest = hashlib.sha256(binary.read_bytes()).hexdigest()
expected = "3acc5aca1c764541033a82ba3bb0a47524b5c3c0aa194eea8d9a7b0cdb346bdc"
assert digest == expected, "Trace processor checksum mismatch"
print(json.dumps({
    "python": sys.version.split()[0],
    "packages": {name: importlib.metadata.version(name) for name in ["perfetto", "pandas", "numpy", "protobuf"]},
    "processor_sha256": digest,
    "imports": "passed",
    "actual_trace_analyzed": False,
}, indent=2))
