The purpose of the backup port mapping file is to prevent gatway from failing because the most recent `port_map.csv` was being edited at the moment or is improperly formatted.

This folder holds backups for anytime the `port_map.csv` file changed.
These backup files exist in the event the current `port_map.csv` cannot be read or parsed. The gateway file should always create a new backup if it doesn't already exist. A backup file should have the pattern `<timestamp>.csv` where `<timestamp>` is the time in milliseconds since the epoch. The gateway can quickly confirm that this backup exists by checking whether this file exists. 

Scenarios:
- Gateway **able** to read and parse `port_map.csv`
	- Backup exists: gateway continues without any added operation
	- Backup does not exist: gateway removes any outdated backups and creates a new one before continuing
- Gateway **unable** to read and parse `port_map.csv`
	- Backup exists: gateway temporarily uses this backup mapping
	- Backup does not exist: gateway acts as though there are 0 tasks available
