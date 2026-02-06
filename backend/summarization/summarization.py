import nltk
nltk.download('punkt')
nltk.download('punkt_tab')

from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.luhn import LuhnSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

import re

def format_summary(text):
    # bullets
    text = text.replace("•", "\n- ")

    # add spacing before headings written in CAPS
    text = re.sub(r'([A-Z]{3,})', r'\n## \1', text)

    return text


def summarize(text, sentence_count=5):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    
    summarizer = LuhnSummarizer(Stemmer("english"))
    summarizer.stop_words = get_stop_words("english")
    
    summary_sentences = summarizer(parser.document, sentence_count)
    final_summary = " ".join([str(sentence) for sentence in summary_sentences])
    formatted_summary = format_summary(final_summary)
    
    return formatted_summary