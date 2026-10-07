#!/usr/bin/env python3
"""
Multi-format Text Extractor for MindGraph X
Supports .pdf, .pptx, .docx, .md, .txt
"""

import sys
import os
import re
import zipfile
import xml.etree.ElementTree as ET


def extract_from_docx(file_path: str) -> str:
    try:
        with zipfile.ZipFile(file_path) as z:
            if 'word/document.xml' not in z.namelist():
                return ""
            xml_data = z.read('word/document.xml')
            tree = ET.fromstring(xml_data)
            paragraphs = []
            for p in tree.iter():
                if p.tag.endswith('p'):
                    p_texts = [node.text for node in p.iter() if node.text and node.tag.endswith('t')]
                    if p_texts:
                        paragraphs.append(''.join(p_texts))
            return '\n'.join(paragraphs) if paragraphs else ""
    except Exception as e:
        return ""


def extract_from_pptx(file_path: str) -> str:
    try:
        with zipfile.ZipFile(file_path) as z:
            slides_text = []
            slide_files = [f for f in z.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            slide_files.sort()
            for slide_file in slide_files:
                xml_data = z.read(slide_file)
                tree = ET.fromstring(xml_data)
                texts = [node.text for node in tree.iter() if node.text and node.tag.endswith('t')]
                if texts:
                    slides_text.append(' '.join(texts))
            return '\n\n'.join(slides_text)
    except Exception as e:
        return ""


def extract_from_pdf(file_path: str) -> str:
    # 1. Try PyMuPDF if installed
    try:
        import fitz
        doc = fitz.open(file_path)
        pages = [page.get_text() for page in doc]
        text = '\n'.join(pages).strip()
        if len(text) > 30:
            return text
    except Exception:
        pass

    # 2. Try pypdf if installed
    try:
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        pages = [page.extract_text() or '' for page in reader.pages]
        text = '\n'.join(pages).strip()
        if len(text) > 30:
            return text
    except Exception:
        pass

    # 3. Stream text extraction fallback
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        tj_matches = re.findall(rb'\((.*?)\)\s*Tj', content)
        if len(tj_matches) > 5:
            decoded = [m.decode('latin1', errors='ignore').replace('\\(', '(').replace('\\)', ')') for m in tj_matches]
            return ' '.join(decoded)
        # Scan for printable text runs
        clean = re.sub(rb'[^\x20-\x7E\n\r\t]', b' ', content)
        text = clean.decode('ascii', errors='ignore')
        words = [w for w in text.split() if len(w) > 2 and any(c.isalpha() for c in w)]
        return ' '.join(words[:500])
    except Exception:
        return ""


def extract_text(file_path: str) -> str:
    if not os.path.exists(file_path):
        return ""

    ext = os.path.splitext(file_path)[1].lower()

    if ext in ['.txt', '.md', '.csv']:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read().strip()
        except Exception:
            return ""

    if ext == '.docx':
        return extract_from_docx(file_path)

    if ext == '.pptx':
        return extract_from_pptx(file_path)

    if ext == '.pdf':
        return extract_from_pdf(file_path)

    # General fallback
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read().strip()
    except Exception:
        return ""


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: extract_text.py <filepath>", file=sys.stderr)
        sys.exit(1)
    result = extract_text(sys.argv[1])
    print(result)
