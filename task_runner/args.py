import argparse

parser = argparse.ArgumentParser(description="This script runs a task server.")
parser.add_argument('task', help='task folder name')
parser.add_argument('--reload', default=False, help='enables server to reload on file changes')

args = parser.parse_args()
task_name = args.task
reload_enabled = args.reload
