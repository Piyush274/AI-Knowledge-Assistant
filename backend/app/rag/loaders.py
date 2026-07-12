# A utility file that extracts raw, clean text from file paths of various types (.pdf, .docx, .txt, .md).

import os
import fitz
import docx

def _extract_pdf(file_path: str) -> str:
    document = fitz.open(file_path)
    text = []
    for page in document:
        text.append(page.get_text())
    document.close()
    
    result = ""
    for x in text:
        result = result + x + "\n"
    return result

def _extract_docx(file_path: str) -> str:
    document = docx.Document(file_path)
    text = []
    for x in document.paragraphs:
        text.append(x.text)
    return "\n".join(text)

def _extract_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

def extract_text(file_path: str) -> str:
    filename, extension = os.path.splitext(file_path)
    extension = extension.lower()
    
    if extension == ".pdf":
        return _extract_pdf(file_path)
    elif extension == ".docx":
        return _extract_docx(file_path)
    elif extension in {".txt", ".md"}:
        return _extract_txt(file_path)
    
    raise ValueError(f"Unsupported file type extension: {extension}")
