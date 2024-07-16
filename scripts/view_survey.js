import { firestore } from './firebase.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

const questions = {
    industry: 'באיזו תעשייה או תחום אתה עובד?',
    techThreat: 'האם אתה חושש מפיתוחים טכנולוגיים שעלולים לאיים על המקצוע שלך?',
    jobLoss: 'האם חווית או חששת מאובדן עבודה בשנה האחרונה?',
    ubi: 'האם שמעת על מודל ההכנסה הבסיסית (UBI)?',
    employmentType: 'האם אתה עובד בצורה סדירה או בלתי סדירה?',
    employmentContinuity: 'האם חווית חוסר רציפות בתעסוקה?',
    jobPreference: 'האם אתה מעדיף עבודה במשרה מלאה או עבודה פרויקטלית?',
    salarySufficiency: 'האם המשכורת שלך מספיקה למחייה בכבוד ולחסוך לשעת צרה?',
    savings: 'האם יש לך חסכונות או תוכניות לעתיד כלכלי בטוח?',
    expenses: 'האם ההוצאות העיקריות שלך גדלות מהר יותר מההכנסות?',
    salary: 'מהו השכר החודשי שלך?',
    salarySatisfaction: 'האם אתה מרוצה מהשכר שלך?',
    paycheckUnderstanding: 'האם אתה מבין את תלוש השכר שלך ואת כל מרכיביו?',
    socialBenefits: 'האם אתה מקבל תנאים סוציאליים מהמעסיק?',
    welfareUsage: 'האם נעזרת אי פעם בביטוח לאומי או במערכת הרווחה?',
    welfareOpinion: 'האם אתה מרוצה ממצב הרווחה והתנאים הסוציאליים בישראל?',
    employmentStatus: 'האם אתה עובד שכיר או עצמאי?',
    employerIssues: 'האם היו לך בעיות או חילוקי דעות עם המעסיק בנוגע לתנאי העבודה?',
    gigEconomy: 'האם שמעת על כלכלת החלטורה (Gig Economy)?',
    pensionPlan: 'האם יש לך תכנית פנסיה?',
    pensionSatisfaction: 'האם אתה מרוצה מתנאי הפנסיה שלך?',
    pensionConcerns: 'האם אתה חושש מחוסר יכולת להתפרנס בגיל מבוגר?',
    additionalBenefits: 'האם המעסיק שלך מספק הטבות נוספות מעבר לשכר?',
    benefitSatisfaction: 'האם אתה מרוצה מההטבות הנוספות שמקום העבודה מציע?',
    desiredBenefits: 'האם יש הטבות נוספות שהיית רוצה לקבל ממקום העבודה?',
    workHours: 'האם אתה עובד יותר מ-40 שעות בשבוע?',
    workEnvironment: 'האם אתה מרוצה מסביבת העבודה הפיזית שלך?',
    stress: 'האם אתה מרגיש לחץ ועומס בעבודה?',
    organizationalCulture: 'האם אתה מרוצה מהתרבות הארגונית במקום העבודה שלך?',
    managerRelationship: 'האם אתה מרוצה מהיחסים עם המנהל הישיר שלך?',
    mentoring: 'האם אתה מקבל חניכה או מנטורינג במקום העבודה?',
    colleagueCommunication: 'האם אתה מרוצה מהתקשורת עם עמיתים לעבודה?',
    respectfulTreatment: 'האם חווית אי פעם יחס לא מכבד או התעמרות במקום העבודה?',
    improvementSuggestions: 'האם יש לך הצעות לשיפור תרבות העבודה בארגון שלך?',
    interpersonalImprovement: 'האם אתה מרגיש שיש מקום לשיפור בתקשורת הבין-אישית בעבודה?',
    primaryChange: 'האם יש תחום עיקרי שבו אתה מרגיש שדרוש שינוי בעבודה שלך?',
    importantTopics: 'האם יש נושאים חשובים עבורך לשיפור בתנאי העבודה שלך?',
    additionalQuestions: 'האם יש לך שאלות נוספות או נושאים שתרצה להתייעץ לגביהם?'
};

async function loadSurvey() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const surveyContainer = document.getElementById('survey-container');

    if (!userId) {
        surveyContainer.innerHTML = '<p>לא נמצא מזהה משתמש.</p>';
        return;
    }

    try {
        const surveysCollection = collection(firestore, `users/${userId}/survey`);
        const querySnapshot = await getDocs(surveysCollection);

        if (querySnapshot.empty) {
            surveyContainer.innerHTML = '<p>אין סקרים זמינים למשתמש זה.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const surveyData = doc.data();
            for (const key in surveyData) {
                if (questions[key]) {
                    const surveyElement = document.createElement('div');
                    surveyElement.classList.add('survey-question');

                    const titleElement = document.createElement('div');
                    titleElement.classList.add('survey-question-title');
                    titleElement.textContent = questions[key];

                    const answerElement = document.createElement('div');
                    answerElement.classList.add('survey-answer');
                    answerElement.textContent = surveyData[key];

                    surveyElement.appendChild(titleElement);
                    surveyElement.appendChild(answerElement);
                    surveyContainer.appendChild(surveyElement);
                }
            }
        });
    } catch (error) {
        console.error('Error loading survey:', error);
        surveyContainer.innerHTML = '<p>אירעה שגיאה בטעינת הסקר.</p>';
    }
}

loadSurvey();