# Neuro Health Monitor

Build Prompt: NeuroShield AI

Build a modern, responsive, AI-powered neurological screening and monitoring web application called NeuroShield AI.

1. Core Concept

NeuroShield AI is a multimodal neurological screening platform designed to help users perform preliminary assessments for:

Parkinson's Disease

Alzheimer's Disease / Cognitive Impairment

Stroke Risk

The application must NOT present itself as a replacement for a doctor or a medical diagnostic system.

The platform should provide:

Preliminary screening

AI-based risk estimation

Interactive motor/cognitive games

Personalized assessment

Disease/stage estimation where supported by the trained model

Monthly reassessment

Progress tracking

Historical comparison

Safety recommendations

Hospital/doctor referral guidance for high-risk results

The application should combine the three disease modules into one unified user experience rather than presenting three unrelated ML demos.

2. Application Structure

Create the following main navigation:

Dashboard

Parkinson Screening

Cognitive Assessment

Stroke Risk

Monthly Progress

Assessment History

Recommendations

Profile

Emergency / Medical Disclaimer

The dashboard should provide an overview of the user's latest assessments.

Example:

NEUROSHIELD AI
Your Neurological Health Dashboard

Parkinson Screening
Risk: Moderate
Last Assessment: 13 Aug 2026
Progress: ↑ 8%

Cognitive Assessment
Risk: Low
Last Assessment: 13 Aug 2026
Progress: Stable

Stroke Risk
Risk: Moderate
Last Assessment: 13 Aug 2026

Next Assessment
27 Aug 2026

3. User Registration

Create a simple registration/login system.

Collect:

Full Name

Age

Gender

Email

Phone

Date of Birth

Emergency Contact

Medical History

Existing neurological conditions

Current medications

Previous assessment information

Do not expose medical information publicly.

Create a user profile containing the complete assessment history.

4. Initial Neurological Screening

After registration, show:

"Let's perform your first neurological screening."

Explain that the screening contains three modules.

Show:

Step 1

Motor Assessment

Step 2

Cognitive Assessment

Step 3

Stroke Risk Assessment

The user can complete all three or individually access each module.

Before beginning, show:

"NeuroShield AI provides preliminary screening information and does not replace professional medical diagnosis."

Require the user to acknowledge this before proceeding.

5. PARKINSON'S MODULE

Goal

Create a multimodal Parkinson's screening system.

Instead of only asking users to enter 22 numerical voice features, make the experience user-friendly.

The application should collect:

Camera input

Body movement

Hand movement

Finger movement

Voice sample

Interactive motor-game performance

The existing Parkinson ML model can be integrated into the backend.

6. Parkinson Initial Body/Motor Screening

Create a guided camera assessment.

Display instructions:

"Stand approximately 2–3 meters away from the camera."

Ask the user to perform:

Test 1 — Standing Still

Ask the user to stand naturally for several seconds.

Analyze movement using computer vision where available.

Measure:

Body stability

Tremor-like movement

Postural instability

Movement frequency

Left/right symmetry

Do not claim that camera analysis alone confirms Parkinson's disease.

Test 2 — Hand Stability

Ask:

"Extend both hands forward and keep them still."

Analyze:

Hand movement

Oscillation

Tremor-like motion

Left/right differences

Display:

Hand Stability Score

Test 3 — Finger Tapping

Ask:

"Tap your index finger and thumb together repeatedly."

Measure:

Number of taps

Tapping speed

Rhythm

Irregularity

Fatigue

Left/right difference

Generate:

Finger Motor Score

Test 4 — Walking Assessment

Ask the user to walk a short distance.

Analyze, where technically supported:

Step timing

Cadence

Stride consistency

Movement symmetry

Do NOT diagnose gait disorders solely from camera data.

7. Parkinson Voice Assessment

Create:

"Voice Analysis"

Ask the user to hold a vowel such as:

"AAAAAA"

for several seconds.

Also allow a short speech sample.

Extract or accept the 22 features required by the existing Parkinson model:

MDVP:Fo(Hz)

MDVP:Fhi(Hz)

MDVP:Flo(Hz)

MDVP:Jitter(%)

MDVP:Jitter(Abs)

MDVP:RAP

MDVP:PPQ

Jitter:DDP

MDVP:Shimmer

MDVP:Shimmer(dB)

Shimmer:APQ3

Shimmer:APQ5

MDVP:APQ

Shimmer:DDA

NHR

HNR

RPDE

DFA

spread1

spread2

D2

PPE

Send the extracted features to the trained Parkinson model.

Return:

Parkinson screening score

Confidence/probability if the model supports it

Motor score

Voice score

Overall screening result

8. Parkinson Interactive Games

If the initial screening indicates elevated concern, unlock motor games.

Important:

The games should be treated as assessment tasks, not as medically validated diagnostic tests unless validated separately.

Create:

Game 1 — Tap the Balls

Colored balls appear randomly.

The user must click/tap them as quickly as possible.

Record:

Reaction time

Accuracy

Missed targets

Movement speed

Game 2 — Follow the Path

Display a moving object along a path.

The user must follow it using mouse/touch.

Measure:

Tracking accuracy

Deviation

Movement smoothness

Game 3 — Rapid Tap

Ask the user to tap a button repeatedly for a fixed duration.

Measure:

Tap count

Average interval

Rhythm consistency

Fatigue

Game 4 — Left vs Right

Perform the same motor task using:

Left hand

Right hand

Compare:

Speed

Accuracy

Stability

Reaction time

9. Parkinson Stage Estimation

Combine available assessment signals:

ML prediction

Voice features

Motor assessment

Game performance

Previous monthly results

Create a screening profile such as:

Low Concern

No significant abnormality detected during this screening.

Moderate Concern

Some assessment patterns require monitoring.

High Concern

Multiple assessment signals indicate that professional neurological evaluation may be appropriate.

If the trained model and clinically validated labels genuinely support disease staging, display the corresponding stage.

Otherwise DO NOT invent clinical stages.

Instead use:

"Screening Severity Level"

rather than claiming:

"Stage 1 / Stage 2 / Stage 3"

10. Parkinson Monthly Monitoring

Create a monthly timeline.

Example:

August
Motor Score: 78
Voice Score: 82
Overall: Moderate

September
Motor Score: 81
Voice Score: 85
Overall: Improving

October
Motor Score: 76
Voice Score: 79
Overall: Needs Monitoring

Display graphs for:

Motor performance

Voice score

Game performance

Screening probability

Assessment completion

Show:

"Improvement"

"Stable"

"Needs Monitoring"

based on changes in the user's own previous measurements.

Do not interpret small changes as medical improvement without validation.

11. ALZHEIMER'S / COGNITIVE MODULE

Create an interactive cognitive assessment rather than simply uploading an MRI.

The goal is to measure:

Short-term memory

Working memory

Attention

Pattern recognition

Recall

Reaction time

Spatial memory

Cognitive consistency

12. Cognitive Game 1 — Number Memory

Show:

3 numbers on screen.

Example:

7 — 4 — 9

Display them for a few seconds.

Hide the numbers.

Ask:

"Which number was shown in the middle?"

Provide multiple choices.

Record:

Correct/incorrect

Reaction time

Gradually increase difficulty:

3 digits
→ 4 digits
→ 5 digits
→ 6 digits

13. Cognitive Game 2 — Sequence Recall

Display:

2 → 8 → 4 → 9

Hide it.

Ask the user to reproduce the sequence.

Measure:

Accuracy

Number of attempts

Reaction time

14. Cognitive Game 3 — Card Memory

Display multiple cards.

Allow the user to memorize their positions.

Flip them.

Ask the user to find matching pairs.

Measure:

Memory accuracy

Number of attempts

Time taken

15. Cognitive Game 4 — Object Recall

Show several objects.

Example:

Apple
Book
Key
Car
Tree

Hide them.

Ask:

"Which objects were shown?"

Measure:

Recall accuracy

False selections

Response time

16. Cognitive Game 5 — Pattern Recognition

Show a sequence:

Circle → Square → Triangle → Circle → ?

Ask the user to select the next shape.

Increase difficulty progressively.

17. Cognitive Game 6 — Attention Test

Display multiple symbols.

Ask:

"Select every red circle."

Measure:

Accuracy

Reaction time

Incorrect selections

18. Cognitive Assessment Score

Combine game metrics:

Memory Score
Attention Score
Reaction Score
Recall Score
Pattern Score
Consistency Score

Create:

Cognitive Performance Score

Example:

Memory: 82
Attention: 76
Recall: 88
Reaction: 79
Overall Cognitive Score: 81

Use the trained Alzheimer's model only where its expected input format is actually available.

If an MRI model is available, provide an optional:

"Upload MRI"

section.

19. Alzheimer's MRI Module

Allow optional MRI image upload.

Input:

JPG

PNG

Resize/preprocess according to the trained model.

Current model input:

128 × 128 RGB image.

Return the model's supported classes:

Mild Demented

Moderate Demented

Non Demented

Very Mild Demented

Clearly label this as:

"AI MRI Screening Result"

not a definitive medical diagnosis.

20. Cognitive Progress Tracking

Store every assessment.

Example:

August:

Memory = 72
Attention = 78
Recall = 70

September:

Memory = 77
Attention = 81
Recall = 75

October:

Memory = 83
Attention = 84
Recall = 81

Display a graph.

Show:

"Your cognitive assessment performance has improved compared with your previous assessment."

Only compare measurable assessment performance, not disease progression unless clinically validated.

21. Alzheimer's Personalized Activities

Based on weaker cognitive areas, recommend additional non-medical cognitive activities.

For example:

If memory score is low:

Number recall

Card matching

Sequence games

If attention score is low:

Symbol matching

Target selection

Focus games

If reaction score is low:

Reaction games

Tap targets

Visual response exercises

The application should present these as cognitive exercises, not treatments or cures.

22. STROKE RISK MODULE

Create a structured health questionnaire.

Fields:

Gender

Age

Hypertension

Heart Disease

Married

Work

Residence

Glucose Level

BMI

Smoking Status

Use the existing trained stroke prediction model.

23. Stroke Prediction

Submit the information to the trained model.

Return:

Stroke Risk Probability

Risk Category

Contributing factors

Recommended next action

Use categories:

Low Risk

No elevated risk detected by the screening model.

Moderate / Monitor

Some risk factors are present.

Recommend:

Regular health monitoring

Healthy diet

Physical activity appropriate for the person

Avoid smoking

Monitor blood pressure

Monitor blood glucose

Consult a healthcare professional for personalized advice

Do NOT prescribe medication.

High Risk

Display a prominent warning:

"Your screening result indicates elevated stroke risk. This screening cannot confirm whether a stroke will occur. Please seek professional medical evaluation."

Show:

Contact healthcare provider

Check blood pressure

Check glucose

Review cardiovascular risk factors

24. Emergency Stroke Safety Screen

Add a separate emergency section.

If the user reports sudden symptoms such as:

Facial weakness

Arm weakness

Speech difficulty

Sudden confusion

Sudden vision problems

Sudden severe headache

Sudden difficulty walking

show:

"Possible stroke symptoms can require emergency medical attention."

Provide an emergency action button appropriate to the user's country.

Do NOT tell the user to wait for the AI prediction.

The emergency pathway must always take priority over the screening model.

25. Unified AI Risk Dashboard

After completing the three modules, generate a single dashboard.

Example:

NeuroShield Assessment

Parkinson Screening
🟡 Moderate Concern

Cognitive Screening
🟢 Low Concern

Stroke Risk
🟠 Elevated Risk

Overall Monitoring Status

Needs Attention

Recommended Next Steps

Review your stroke risk factors with a healthcare professional.

Continue monthly motor assessment.

Continue cognitive exercises.

Complete your next assessment in 30 days.

26. Longitudinal Health Timeline

Create a timeline:

August 2026
Initial Screening

September 2026
Monthly Assessment

October 2026
Monthly Assessment

November 2026
Monthly Assessment

Store:

Scores

Predictions

Game results

Cognitive results

Motor measurements

Stroke risk factors

MRI result if provided

Recommendations

Assessment date

27. Monthly Comparison Engine

Compare current and previous assessments.

Example:

Previous Motor Score: 68
Current Motor Score: 76

Display:

"Motor assessment performance increased by 11.7%."

Similarly compare:

Memory

Attention

Reaction

Game accuracy

Voice measurements

Stroke risk factors

Use charts.

Provide:

Improving

Stable

Needs Monitoring

Do not automatically interpret these as clinical disease progression.

28. AI Recommendation Engine

Create a rule-based recommendation layer above the ML models.

Example:

IF Parkinson screening is elevated:

→ Recommend professional neurological evaluation.

IF cognitive performance is declining across repeated assessments:

→ Recommend discussing the results with a healthcare professional.

IF stroke risk is high:

→ Recommend professional medical evaluation.

IF assessment performance improves:

→ Show positive progress in assessment performance.

The recommendation engine must never prescribe medication.

29. User Dashboard

Create cards:

Parkinson

Current:
Moderate Concern

Previous:
High Concern

Trend:
Improving

Cognitive

Current:
81/100

Previous:
74/100

Trend:
Improving

Stroke

Current:
Elevated

Previous:
Moderate

Trend:
Needs Attention

Next Assessment

15 September 2026

[Start Assessment]

30. Gamification

Add a safe gamification layer.

Users can earn:

Assessment Streak

Cognitive Challenge Badge

Motor Challenge Badge

Monthly Monitoring Badge

Consistency Badge

Do NOT reward users for obtaining a "better disease score."

Reward:

Completing assessments

Completing exercises

Maintaining assessment consistency

31. Backend Architecture

Recommended architecture:

Frontend:

React / Next.js

Backend:

Python FastAPI

AI:

Python

ML:

Scikit-learn

Deep Learning:

TensorFlow/Keras

Computer Vision:

MediaPipe/OpenCV where appropriate

Database:

MongoDB or PostgreSQL

Authentication:

Firebase Auth or Supabase Auth

Charts:

Recharts

Storage:

Cloud object storage for MRI/images where required

32. Existing AI Models

Integrate the existing trained models:

Parkinson

parkinson_detection_model.joblib

Input:

22 voice features

Alzheimer's

alzheimer_cnn_model.keras

Input:

128 × 128 RGB MRI

Classes:

Mild Demented

Moderate Demented

Non Demented

Very Mild Demented

Stroke

stroke_prediction_model_smote.joblib

Input:

10 clinical features

33. Important Architecture Rule

Do NOT combine the three models into one artificial prediction.

Instead create:

                NEUROSHIELD AI
                      |
    -------------------------------------
    |                 |                 |


PARKINSON COGNITIVE STROKE
| | |
Motor Tests Memory Games Clinical Data
Voice Analysis Attention Games Risk Factors
Movement Recall Games Health Metrics
| | |
-------------------------------------
|
AI SCREENING ENGINE
|
Progress Monitoring
|
Monthly Comparison
|
Recommendations

This makes the project genuinely multimodal.

34. Privacy

Implement:

Secure authentication

Encrypted communication

Private user records

No public medical profiles

Secure image storage

Delete assessment option

Export assessment report

Consent before collecting camera/voice/MRI data

Do not store camera recordings permanently unless explicitly required and consented to.

35. Medical Disclaimer

Display prominently:

"NeuroShield AI is an educational and preliminary screening platform. It does not diagnose, treat, cure, or prevent neurological diseases. AI results are not a substitute for professional medical evaluation. If you have concerning or emergency symptoms, seek appropriate medical care."

36. UI Design

Create a professional healthcare interface.

Style:

Clean

Modern

Minimal

Accessible

Large readable typography

Rounded cards

Soft backgrounds

Clear risk indicators

Responsive desktop/mobile layout

Dashboard colors:

Green = Low / Normal

Yellow = Monitor

Orange = Elevated

Red = High / Urgent

Do not rely on color alone. Always include text labels.

37. Main User Journey

User registers.

↓

Completes health profile.

↓

Accepts screening disclaimer.

↓

Starts NeuroShield Screening.

↓

Parkinson Motor Assessment

↓

Parkinson Voice Assessment

↓

Parkinson Interactive Games

↓

Cognitive Games

↓

Optional Alzheimer's MRI

↓

Stroke Risk Questionnaire

↓

AI Analysis

↓

Personalized Screening Dashboard

↓

Recommendations

↓

Monthly Reminder

↓

Next Assessment

↓

Historical Comparison

↓

Progress Dashboard

38. Final Product Goal

The final application should feel like a continuous neurological wellness monitoring platform, not a collection of three machine-learning demos.

The core innovation is:

"Screen → Test → Analyze → Personalize → Monitor → Compare → Improve"

The platform should continuously build a longitudinal assessment profile for the user rather than producing a one-time prediction.

The system must clearly distinguish between:

AI screening result
+
Game/assessment performance
+
Risk factors
+
Longitudinal trends

and a professional medical diagnosis.

Final Application Name

NeuroShield AI

Tagline

"Screen Early. Monitor Continuously. Understand Your Progress."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a8488a94-2539-49f0-90ee-dd4fd42e31a6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
