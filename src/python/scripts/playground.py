import fitz  # pymupdf
import camelot
import sys
import json

pdf_path = sys.argv[1]
extract = sys.argv[2]

def extract_tables_as_dicts(pdf_path, pages="all", flavor="lattice"):
    """
    Extract tables from PDF and return them as a list of list-of-dicts.
    Each table is represented as a list of row dictionaries.
    """
    tables = camelot.read_pdf(pdf_path, pages=pages, flavor=flavor)

    all_tables = []

    for table in tables:
        df = table.df  # Pandas DataFrame
        if df.empty:
            continue

        # First row is assumed to be headers
        headers = df.iloc[0].tolist()
        data_rows = df.iloc[1:]

        # Convert each row to dict
        dict_rows = data_rows.apply(lambda row: dict(zip(headers, row)), axis=1).tolist()

        all_tables.append(dict_rows)

    return all_tables

if __name__ == 'main':

    if extract == 'text':
        pages = []
        doc = fitz.open(pdf_path)
        for page in doc:
            text = page.get_text("text")
            pages.append({"page": page.number, "text": text})

        print(json.dumps(pages))
    elif extract == 'table':
        tables = extract_tables_as_dicts(pdf_path, pages="all", flavor="lattice")  # try "lattice" if table has lines
        for i, table in enumerate(tables, 1):
            print(f"\nTable {i}:")
            for row in table:
                print(row)