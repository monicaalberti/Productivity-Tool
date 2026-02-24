import json
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import AgglomerativeClustering
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
    """
    Convert POS tag from nltk.pos_tag to wordnet POS for lemmatizer
    """
    if treebank_tag.startswith('J'):
        return wordnet.ADJ
    elif treebank_tag.startswith('V'):
        return wordnet.VERB
    elif treebank_tag.startswith('N'):
        return wordnet.NOUN
    elif treebank_tag.startswith('R'):
        return wordnet.ADV
    else:
        return wordnet.NOUN  # fallback to noun

def lemmatize_text(text):
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))

    # 1️⃣ tokenize and lowercase
    tokens = [t.lower() for t in word_tokenize(text) if t.isalpha()]

    # 2️⃣ POS tagging
    pos_tags = pos_tag(tokens)

    # 3️⃣ Lemmatize with POS and remove stop words
    lemmatized_words = [
        lemmatizer.lemmatize(word, get_wordnet_pos(pos))
        for word, pos in pos_tags
        if word not in stop_words
    ]

    return lemmatized_words


# Load model globally
model = SentenceTransformer("all-MiniLM-L6-v2")

def assign_topic(db, firebase_uid, document_id, threshold=0.60, distance_threshold=0.3):
    """
    Assigns a document to an existing topic based on semantic similarity.
    If no existing topic passes threshold, creates a new topic.
    Topic name is generated via clustering all docs + TF-IDF keywords.
    """

    # 1️⃣ Fetch document
    doc = db.query(models.Document).filter_by(id=document_id, user_id=firebase_uid).first()
    if not doc:
        print("Document not found.")
        return

    full_text = f"{doc.title} {extract_text_from_pdf(doc.file_path)}"
    doc_embedding = normalize(model.encode([full_text]))

    # 2️⃣ Check existing topics
    topics = db.query(models.Topic).filter_by(user_id=firebase_uid).all()
    best_topic = None
    best_score = 0

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

        if score > best_score:
            best_score = score
            best_topic = topic

    # 3️⃣ Attach to best existing topic if above threshold
    if best_topic and best_score >= threshold:
        dt = models.DocumentTopic(
            document=doc,
            topic=best_topic,
            relevance_score=float(best_score)
        )
        db.add(dt)

        old_vec = best_topic.embedding
        if isinstance(old_vec, str):
            old_vec = json.loads(old_vec)
        old_vec = np.array(old_vec, dtype=np.float32)

        new_vec = (old_vec + doc_embedding[0]) / 2
        best_topic.embedding = json.dumps(new_vec.tolist())

        # Get ALL documents in this topic
        linked_docs = (
            db.query(models.Document)
            .join(models.DocumentTopic)
            .filter(models.DocumentTopic.topic_id == best_topic.id)
            .all()
        )

        # Combine their text
        combined_text = " ".join(
            f"{d.title} {extract_text_from_pdf(d.file_path)}"
            for d in linked_docs
        )

        # Lemmatize with fallback
        lemmas = lemmatize_text(combined_text)
        print("LEMMAS PER L'AMOR DI DIO TI PREGO: ", lemmas)
        if not lemmas:
            lemmas = combined_text.split()  # fallback if lemmatizer returns empty

        # Run TF-IDF on lemmatized text
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=50)
        tfidf_matrix = vectorizer.fit_transform([" ".join(lemmas)])
        terms = vectorizer.get_feature_names_out()
        scores = tfidf_matrix.toarray()[0]

        # if len(terms) == 0:
        #     top_keywords = ["untitled"]
        # else:
        top_keywords = [terms[i] for i in scores.argsort()[::-1][:2]]
        print("TOP KEYWORDS AFTER MERGING: ", top_keywords)

        best_topic.name = ", ".join(top_keywords)

        db.commit()
        print(f"Added to existing topic '{best_topic.name}' (score={best_score:.2f})")
        return

    # 4️⃣ No matching topic → create new topic via clustering all user docs
    all_docs = db.query(models.Document).filter_by(user_id=firebase_uid).all()
    texts = [f"{d.title} {extract_text_from_pdf(d.file_path)}" for d in all_docs]
    embeddings = normalize(model.encode(texts))

    # Agglomerative clustering on all docs
    clustering = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=distance_threshold,
        metric='cosine',
        linkage='average'
    )
    labels = clustering.fit_predict(embeddings)

    # Find the cluster label of the current document
    doc_index = next(i for i, d in enumerate(all_docs) if d.id == document_id)
    cluster_label = labels[doc_index]

    # Combine all docs in this cluster to generate topic name
    cluster_docs = [texts[i] for i, label in enumerate(labels) if label == cluster_label]
    combined_text = " ".join(cluster_docs)

    # Lemmatize with fallback
    lemmas = lemmatize_text(combined_text)
    print("LEMMATIZED TEXT AND YOU BETTER BE GOOD: ", lemmas)
    if not lemmas:
        lemmas = combined_text.split()
        print("ANOTHER ATTEMPT AT PRINTING LEMMAS: ", lemmas)

    # Run TF-IDF
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=50)
    tfidf_matrix = vectorizer.fit_transform([" ".join(lemmas)])
    terms = vectorizer.get_feature_names_out()
    scores = tfidf_matrix.toarray()[0]

    if len(terms) == 0:
        topic_name = "untitled"
    else:
        top_keywords = [terms[i] for i in scores.argsort()[::-1][:2]]
        topic_name = ", ".join(top_keywords)

    # 5️⃣ Create new topic
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
