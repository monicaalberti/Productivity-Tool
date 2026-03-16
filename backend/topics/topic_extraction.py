import json
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import models
from summarization.text_extraction import extract_text_from_pdf

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk import pos_tag, word_tokenize
from nltk.corpus import wordnet

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('averaged_perceptron_tagger')

def get_wordnet_pos(treebank_tag):
    if treebank_tag.startswith('J'):
        return wordnet.ADJ
    elif treebank_tag.startswith('V'):
        return wordnet.VERB
    elif treebank_tag.startswith('N'):
        return wordnet.NOUN
    elif treebank_tag.startswith('R'):
        return wordnet.ADV
    else:
        # fallback to noun
        return wordnet.NOUN

def lemmatize_text(text):
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))

    tokens = [t.lower() for t in word_tokenize(text) if t.isalpha()]

    pos_tags = pos_tag(tokens)
    lemmatized_words = [
        lemmatizer.lemmatize(word, get_wordnet_pos(pos))
        for word, pos in pos_tags
        if word not in stop_words
    ]

    return lemmatized_words


model = SentenceTransformer("all-MiniLM-L6-v2")

def assign_topic(db, firebase_uid, document_id, threshold=0.60):
    """
    Assigns a document to an existing topic based on semantic similarity.
    If no existing topic passes threshold, creates a new topic.
    If no match is found among existing topics, a new one is created.
    """

    doc = db.query(models.Document).filter_by(id=document_id, user_id=firebase_uid).first()
    if not doc:
        print("Document not found.")
        return

    full_text = f"{doc.title} {extract_text_from_pdf(doc.file_path)}"
    doc_embedding = normalize(model.encode([full_text]))

    # Check existing topics
    topics = db.query(models.Topic).filter_by(user_id=firebase_uid).all()
    relevant_topics = []

    for topic in topics:
        if not topic.embedding:
            continue

        topic_vec = topic.embedding
        if isinstance(topic_vec, str):
            try:
                topic_vec = json.loads(topic_vec)
            except Exception as e:
                print(f"Error loading embedding for topic {topic.name}: {e}")
                continue

        topic_embedding = normalize(np.array(topic_vec, dtype=np.float32).reshape(1, -1))
        score = cosine_similarity(doc_embedding, topic_embedding)[0][0]

        if score >= threshold:
            relevant_topics.append((topic, score))

    if relevant_topics:

        for topic, score in relevant_topics:
            # Prevent duplicate linking
            existing_link = db.query(models.DocumentTopic).filter_by(
                document_id=doc.id,
                topic_id=topic.id
            ).first()

            if not existing_link:
                dt = models.DocumentTopic(
                    document=doc,
                    topic=topic,
                    relevance_score=float(score)
                )
                db.add(dt)

            old_vec = topic.embedding
            if isinstance(old_vec, str):
                old_vec = json.loads(old_vec)

            old_vec = np.array(old_vec, dtype=np.float32)
            new_vec = (old_vec + doc_embedding[0]) / 2
            topic.embedding = json.dumps(new_vec.tolist())

            linked_docs = (
                db.query(models.Document)
                .join(models.DocumentTopic)
                .filter(models.DocumentTopic.topic_id == topic.id)
                .all()
            )

            combined_text = " ".join(
                f"{d.title} {extract_text_from_pdf(d.file_path)}"
                for d in linked_docs
            )

            lemmas = lemmatize_text(combined_text)

            if not lemmas:
                lemmas = combined_text.split()

            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=50
            )

            tfidf_matrix = vectorizer.fit_transform([" ".join(lemmas)])
            terms = vectorizer.get_feature_names_out()
            scores_array = tfidf_matrix.toarray()[0]

            if len(terms) > 0:
                top_keywords = [
                    terms[i] for i in scores_array.argsort()[::-1][:2]
                ]
                topic.name = ", ".join(top_keywords)

        db.commit()
        print(f"Document assigned to {len(relevant_topics)} topic(s) and names updated.")
        return

    # No matching topic found --> create a new topic for this document
    lemmas = lemmatize_text(full_text)
    if not lemmas:
        lemmas = full_text.split()

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=50)
    tfidf_matrix = vectorizer.fit_transform([" ".join(lemmas)])
    terms = vectorizer.get_feature_names_out()
    scores = tfidf_matrix.toarray()[0]

    if len(terms) == 0:
        topic_name = "untitled"
    else:
        top_keywords = [terms[i] for i in scores.argsort()[::-1][:2]]
        topic_name = ", ".join(top_keywords)

    new_topic = models.Topic(
        name=topic_name,
        user_id=firebase_uid,
        embedding=json.dumps(doc_embedding[0].tolist())
    )
    db.add(new_topic)
    db.flush()

    dt = models.DocumentTopic(
        document=doc,
        topic=new_topic,
        relevance_score=1.0
    )
    db.add(dt)
    db.commit()
    print(f"Created new topic '{topic_name}'")