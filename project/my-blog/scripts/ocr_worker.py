import sys
import fitz  # PyMuPDF
import ddddocr
import os
from PIL import Image
import io

def process_pdf(pdf_path, output_md_path, max_pages=None):
    print("LOG: Initializing ddddocr engine...")
    # 初始化 ddddocr (OCR 模式)
    ocr = ddddocr.DdddOcr(show_ad=False)

    doc = fitz.open(pdf_path)
    full_text = []

    total_pages = len(doc)
    if max_pages:
        total_pages = min(total_pages, max_pages)

    print(f"LOG: Starting PDF parse: {pdf_path} (Mode: ddddocr, Pages: {total_pages})")

    for page_index in range(total_pages):
        page = doc[page_index]
        # 将 PDF 页渲染为图片
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_bytes = pix.tobytes("png")

        print(f"  - Processing page {page_index + 1}...")
        
        # 执行 OCR
        res = ocr.classification(img_bytes)
        
        full_text.append(f"## Page {page_index + 1}\n\n{res}")

    # 保存为 Markdown
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write("\n\n".join(full_text))
    
    print(f"LOG: OCR processing complete! Saved to: {output_md_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python ocr_worker.py <pdf_path> <output_md_path> [max_pages]")
        sys.exit(1)
    
    max_p = int(sys.argv[3]) if len(sys.argv) > 3 else None
    process_pdf(sys.argv[1], sys.argv[2], max_pages=max_p)
