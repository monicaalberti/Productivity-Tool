import { FaRegSmile } from "react-icons/fa";
import { PiSmileySadLight } from "react-icons/pi";
import { FaRegAngry } from "react-icons/fa";
import { BiConfused } from "react-icons/bi";
import { PiSmileyNervous } from "react-icons/pi";
import { IoHappyOutline } from "react-icons/io5";
import { FcIdea } from "react-icons/fc";
import { FaRegSurprise } from "react-icons/fa";
import { MdSentimentNeutral } from "react-icons/md";

import "../styles/EntryPage.css";

function EntryPage({entry}) {

    const formatDate = (dateString) => {
        const date = new Date(dateString);

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    };

    const formatContent = (contentHTML) => {
        return contentHTML.replace(/<[^>]+>/g, "");
    }

    const advice = (sentimentScore) => {
        if (sentimentScore < -0.5) {
            return "You seem a bit stressed. Remember to take regular breaks and stay active."
        } else if (sentimentScore >= 0.5) {
            return "Great to see you're having a good day! Keep up the habits that make you feel good."
        } else {
            return "Your entry seems neutral today. It's okay to have calm or routine days. Keep reflecting on your progress!"
        }
    }

    const emojiMap = {
        "admiration": <FcIdea className="smiley" size={40} />,
        "amusement": <IoHappyOutline className="smiley" size={40} />,
        "anger": <FaRegAngry className="smiley" size={40} />,
        "annoyance": <BiConfused className="smiley" size={40} />,
        "approval": <FaRegSmile className="smiley" size={40} />,
        "caring": <FaRegSmile className="smiley" size={40} />,
        "confusion": <BiConfused className="smiley" size={40} />,
        "curiosity": <FcIdea className="smiley" size={40} />,
        "desire": <IoHappyOutline className="smiley" size={40} />,
        "disappointment": <PiSmileySadLight className="smiley" size={40} />,
        "disapproval": <PiSmileySadLight className="smiley" size={40} />,
        "disgust": <FaRegAngry className="smiley" size={40} />,
        "embarrassment": <PiSmileyNervous className="smiley" size={40} />,
        "excitement": <IoHappyOutline className="smiley" size={40} />,
        "fear": <PiSmileyNervous className="smiley" size={40} />,
        "gratitude": <FaRegSmile className="smiley" size={40} />,
        "grief": <PiSmileySadLight className="smiley" size={40} />,
        "joy": <IoHappyOutline className="smiley" size={40} />,
        "love": <FaRegSmile className="smiley" size={40} />,
        "nervousness": <PiSmileyNervous className="smiley" size={40} />,
        "optimism": <IoHappyOutline className="smiley" size={40} />,
        "pride": <FcIdea className="smiley" size={40} />,
        "realization": <FcIdea className="smiley" size={40} />,
        "relief": <IoHappyOutline className="smiley" size={40} />,
        "remorse": <PiSmileySadLight className="smiley" size={40} />,
        "sadness": <PiSmileySadLight className="smiley" size={40} />,
        "surprise": <FaRegSurprise className="smiley" size={40} />,
        "neutral": <MdSentimentNeutral className="smiley" size={40} />
    };

    return (
        <div className="entry-container">
            <h2>StudyWeave - Viewing Past Entry</h2>
            <h3>{formatDate(entry.created_at)}</h3>
            <p>{formatContent(entry.content)}</p>
            <div>
                <h4>Sentiment of this entry:</h4>
                <div className="smiley">
                    {emojiMap[entry.top_emotion] || <MdSentimentNeutral className="smiley" size={40} />}
                </div>  
                {entry.sentiment_polarity >= 0.5 ? (
                    <p className="advice">{advice(entry.sentiment_polarity)}</p>
                ) : (
                    <p className="advice">{advice(entry.sentiment_polarity)}</p>
                )}
            </div>
        </div>
    )
}
export default EntryPage;