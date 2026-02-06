import google.generativeai as genai

genai.configure(api_key="AIzaSyBx5m_-k-tSkZX81ZD4eTXrbf0OPXmUOrM")

model = genai.GenerativeModel("gemini-2.5-flash")

def summarize(text, chunk_size=12000, overlap=500):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap

    summaries = []

    for chunk in chunks:
        response = model.generate_content(
            f"""
            Summarize the following academic text into clear bullet points:

            {chunk}
            """
        )
        summaries.append(response.text)

    final_summary = model.generate_content(
        f"""
        Combine the following summaries into a single structured academic summary
        using headings and bullet points:

        {chr(10).join(summaries)}
        """
    )
    return final_summary.text

