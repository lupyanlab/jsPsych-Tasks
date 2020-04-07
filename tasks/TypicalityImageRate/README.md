# Typicality Image Rate

## Query Params

### Required

- `worker_id`: Worker Id

### Optional

- `fullscreen`: Enable fullscreen
  - Default: `true`
- `dev`: Put all data in `/dev` folder
  - Default: `false`
- `reset`: Reset current worker's data collected (Warning: current worker's data will be lost.)
  - Default: `false`
- `num_categories`: Number of categories to use
  - Default `2`

### Example:

```
/?worker_id=test&fullscreen=false&dev=true&reset=false&num_categories=2
```
