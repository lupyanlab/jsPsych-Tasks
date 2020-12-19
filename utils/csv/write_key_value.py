import csv


def write_key_value(file_path: str, data: dict) -> None:
    """
    Write a csv file with a key and value column
    and parse each row into a single item in a dict.

    { "k1": "v1", "k2": "v2" }

    key,value
    k1,v1
    k2,v2

    Parameters:
    file_path (str): File path
    data: Key value pairs to write
    """
    with open(file_path, 'w') as f:
        w = csv.DictWriter(f, ('key', 'value'))
        w.writeheader()
        for k, v in data.items():
            w.writerow({'key': k, 'value': v})
