"""Run from repo root: PYTHONPATH=services/api .venv/bin/python scripts/regenerate-fixtures.py"""
from pathlib import Path
from app.render import fixture
for index in range(3):
    fixture(index).save(Path('apps/mobile/assets/fixtures') / f'frame-{index}.png')
