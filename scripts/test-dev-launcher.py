"""Opt-in real-port smoke test. Uses an isolated repo copy and an empty .env, never real keys."""

import argparse
import json
import os
import select
import shutil
import signal
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hangup", action="store_true", help="Simulate closing Terminal with SIGHUP")
    args = parser.parse_args()
    for port in (8000, 8081):
        if subprocess.run(["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"], capture_output=True).returncode == 0:
            raise SystemExit(f"Port {port} is occupied; stop its owner before testing.")
    with tempfile.TemporaryDirectory(prefix="wreckaday launcher ") as directory:
        project = Path(directory) / "repo with spaces"
        project.mkdir()
        tracked = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT).decode().split("\0")
        for name in tracked + ["scripts/dev-up.sh", "scripts/dev-process.py", "scripts/make-desktop-launcher.sh"]:
            if name and (ROOT / name).is_file():
                target = project / name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(ROOT / name, target)
        (project / ".venv").symlink_to(ROOT / ".venv", target_is_directory=True)
        for name in ("node_modules", "apps/mobile/node_modules", "packages/contracts/node_modules"):
            if (ROOT / name).exists():
                (project / name).mkdir()
                for item in (ROOT / name).iterdir():
                    if item.name.startswith(".pnpm-task-run-state"):
                        continue
                    (project / name / item.name).symlink_to(item, target_is_directory=item.is_dir())
        (project / ".env").write_bytes(b"")
        desktop = Path(directory) / "fake desktop"
        subprocess.run(["bash", "scripts/make-desktop-launcher.sh"], cwd=project, check=True,
                       env={**os.environ, "WRECKDAY_DESKTOP_DIR": str(desktop)}, capture_output=True)
        launcher = desktop / "Wreckaday.command"
        assert launcher.stat().st_mode & 0o111
        subprocess.run(["zsh", "-n", str(launcher)], check=True)
        assert str(ROOT) not in launcher.read_text()
        print("PASS: generated executable .command in fake Desktop; spaced repo path is quoted. Real Desktop untouched.")
        process = subprocess.Popen(["zsh", str(launcher)], cwd=project, stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT, start_new_session=True)
        output = b""
        try:
            deadline = time.monotonic() + 160
            while time.monotonic() < deadline:
                if select.select([process.stdout], [], [], 1)[0]:
                    chunk = os.read(process.stdout.fileno(), 65536)
                    if not chunk:
                        break
                    output += chunk
                    if b"Close this window" in output:
                        break
            # Never print captured launcher output: it includes the ephemeral console password.
            if b"Wreckaday is running." not in output:
                safe_lines = [line for line in output.decode(errors="replace").splitlines()
                              if not line.startswith("Key console token:")]
                print("\n".join(safe_lines))
                raise AssertionError("Isolated launcher did not report ready")
            status = json.load(urlopen("http://127.0.0.1:8000/v2/capabilities"))
            assert status["data"]["generation_available"] is False
            assert urlopen("http://localhost:8081").status == 200
            duplicate = subprocess.run(["pnpm", "dev"], cwd=project, capture_output=True, text=True)
            assert duplicate.returncode != 0 and "Port 8000 is already in use" in duplicate.stdout
            assert (project / ".env").read_bytes() == b""
            print("PASS: Desktop command starts API/web with empty .env; generation is off; second launch rejects occupied port.")
        finally:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGHUP if args.hangup else signal.SIGINT)
                process.wait(timeout=20)
            time.sleep(2)
            for port in (8000, 8081):
                assert subprocess.run(["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"], capture_output=True).returncode != 0
            print(f"PASS: {'Terminal hangup' if args.hangup else 'Ctrl+C'} frees ports 8000/8081. No real .env, Desktop or provider calls used.")


if __name__ == "__main__":
    main()
