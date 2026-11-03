"""Give each launcher child its own process group, including pnpm/Metro descendants."""

import os
import sys

os.setsid()
os.execvp(sys.argv[1], sys.argv[1:])
