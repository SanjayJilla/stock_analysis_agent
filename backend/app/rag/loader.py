from langchain.community.document_loaders import PyPDFLoader


def load_pdf(
        path:str,
        ticker:str,
        document_type:str,
        year:int
):
    loader=PyPDFLoader(path)
    documents=loader.load()
    for document in documents:
        document.metadata.update({
            "ticker":ticker.upper(),
            "document_type":document_type,
            "year":year,
            "source":path
        })

    # FIX: Moved return statement outside the 'for' loop so that it updates
    # the metadata of all pages/documents, rather than returning immediately on the first iteration.
    return documents