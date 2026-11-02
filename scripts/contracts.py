"""Generate or check the versioned API input schema. Run from repo root."""
import json
import sys
from pathlib import Path
from app.schemas import StoryInput
path=Path('packages/contracts/story-input.schema.json')
content=json.dumps(StoryInput.model_json_schema(),indent=2,sort_keys=True)+'\n'
if '--check' in sys.argv:
    if path.read_text()!=content:
        raise SystemExit('Contract drift: run PYTHONPATH=services/api .venv/bin/python scripts/contracts.py')
else:
    path.write_text(content)
