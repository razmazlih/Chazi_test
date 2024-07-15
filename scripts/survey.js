// Import Firebase SDKs and functions
import { auth, firestore } from './firebase.js';
import {
    doc,
    setDoc,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });
}

checkAuthState();

document.addEventListener('DOMContentLoaded', function () {
    document
        .getElementById('surveyForm')
        .addEventListener('submit', submitForm);
});

function submitForm(e) {
    e.preventDefault();

    // Get values
    var data = {
        industry: getInputVal('industry'),
        techThreat: getInputVal('techThreat'),
        jobLoss: getInputVal('jobLoss'),
        ubi: getInputVal('ubi'),
        employmentType: getInputVal('employmentType'),
        employmentContinuity: getInputVal('employmentContinuity'),
        jobPreference: getInputVal('jobPreference'),
        salarySufficiency: getInputVal('salarySufficiency'),
        savings: getInputVal('savings'),
        expenses: getInputVal('expenses'),
        salary: getInputVal('salary'),
        salarySatisfaction: getInputVal('salarySatisfaction'),
        paycheckUnderstanding: getInputVal('paycheckUnderstanding'),
        socialBenefits: getInputVal('socialBenefits'),
        welfareUsage: getInputVal('welfareUsage'),
        welfareOpinion: getInputVal('welfareOpinion'),
        employmentStatus: getInputVal('employmentStatus'),
        employerIssues: getInputVal('employerIssues'),
        gigEconomy: getInputVal('gigEconomy'),
        pensionPlan: getInputVal('pensionPlan'),
        pensionSatisfaction: getInputVal('pensionSatisfaction'),
        pensionConcerns: getInputVal('pensionConcerns'),
        additionalBenefits: getInputVal('additionalBenefits'),
        benefitSatisfaction: getInputVal('benefitSatisfaction'),
        desiredBenefits: getInputVal('desiredBenefits'),
        workHours: getInputVal('workHours'),
        workEnvironment: getInputVal('workEnvironment'),
        stress: getInputVal('stress'),
        organizationalCulture: getInputVal('organizationalCulture'),
        managerRelationship: getInputVal('managerRelationship'),
        mentoring: getInputVal('mentoring'),
        colleagueCommunication: getInputVal('colleagueCommunication'),
        respectfulTreatment: getInputVal('respectfulTreatment'),
        improvementSuggestions: getInputVal('improvementSuggestions'),
        interpersonalImprovement: getInputVal('interpersonalImprovement'),
        primaryChange: getInputVal('primaryChange'),
        importantTopics: getInputVal('importantTopics'),
        additionalQuestions: getInputVal('additionalQuestions')
    };

    // Get the current user
    const user = auth.currentUser;

    if (user) {
        saveSurveyData(user.uid, data);
    } else {
        console.error('No user is signed in.');
    }
}

function getInputVal(id) {
    return document.getElementById(id).value;
}

const saveSurveyData = async (userId, data) => {
    try {
        await setDoc(doc(firestore, `users/${userId}/survey/surveyDocument`), data);
        alert('הטופס נשלח בהצלחה!');
        window.location.href = "index.html"
    } catch (error) {
        console.error('Error saving survey data: ', error);
    }
};

// Monitor auth state
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User is signed in: ', user.uid);
        console.log('User details: ', user); // הדפסת פרטי המשתמש
        // ייתכן שהמשתמש כבר חתום כשהטופס נשלח
    } else {
        console.log('No user is signed in.');
    }
});

document.addEventListener('DOMContentLoaded', function () {
    let currentStep = 0;
    const formSteps = document.querySelectorAll('.form-step');
    const nextButtons = document.querySelectorAll('.next-button');
    const prevButtons = document.querySelectorAll('.prev-button');

    function showStep(step) {
        formSteps.forEach((formStep, index) => {
            formStep.classList.toggle('active', index === step);
        });
        currentStep = step;
    }

    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            showStep(currentStep + 1);
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            showStep(currentStep - 1);
        });
    });

    document.getElementById('surveyForm').addEventListener('submit', submitForm);

    function submitForm(e) {
        e.preventDefault();
        // Get values and submit the form as before
        // ...
    }
});