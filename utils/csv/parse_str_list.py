from __future__ import annotations
from json import loads


def parse_str_list(str_list: str) -> list:
    """
    Parses a stringified list that's in a CSV file (no additional stringifying logic
	other than simply passing the list to CSV module's writerow function). The stringified list must
	be parsable using the json.loads() function after its single quotes are
	replaced with double quotes. Booleans cannot be parsed because capitalization
	inconsistencies between JSON and Python.

    Parameters:
    str_list: Stringified list
    """
    return loads(str_list.replace("'", '"'))
