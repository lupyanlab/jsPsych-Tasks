import argparse
import sys

reload_enabled = False
if "pytest" not in sys.modules:
    parser = argparse.ArgumentParser(description="This script runs a task server.")
    parser.add_argument('task', help='task folder name')
    parser.add_argument(
        '--reload',
        action='store_true',
        default=False,
        help='enables server to reload on file changes'
    )
    parser.add_argument(
        '--debugpy',
        action='store_true',
        default=False,
        help='enables debugpy for remote debugging'
    )

    args = parser.parse_args()
    task_name = args.task
    reload_enabled = args.reload
