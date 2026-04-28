import fitz
import sys

def extract_first_pages(input_path, output_path, page_count=30):
    doc = fitz.open(input_path)
    new_doc = fitz.open()
    
    # 提取前 N 页
    pages_to_copy = min(len(doc), page_count)
    new_doc.insert_pdf(doc, from_page=0, to_page=pages_to_copy-1)
    
    new_doc.save(output_path)
    new_doc.close()
    doc.close()
    print(f"Success: Extracted first {pages_to_copy} pages to {output_path}")

if __name__ == "__main__":
    extract_first_pages(sys.argv[1], sys.argv[2])
