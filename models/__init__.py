"""Problem-specific ranking modules.

Ensures the repo root is on ``sys.path`` so sibling packages like ``src``
can be imported when users run scripts from outside the repository root.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
