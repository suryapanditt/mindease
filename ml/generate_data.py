import pandas as pd
import numpy as np
import os

np.random.seed(42)
N = 1000

def generate_stress_label(row):
    score = 0
    if row['sleep_hours'] < 4:    score += 30
    elif row['sleep_hours'] < 6:  score += 20
    elif row['sleep_hours'] < 7:  score += 10
    elif row['sleep_hours'] > 9:  score += 5

    if row['study_hours'] > 12:   score += 20
    elif row['study_hours'] > 10: score += 12
    elif row['study_hours'] > 8:  score += 8

    score += (10 - row['mood_rating']) * 3
    score += (row['anxiety_level'] - 1) * 3
    score += (10 - row['social_score']) * 1.5

    score = min(round(score), 100)

    if score < 35:   return 0  # low
    elif score < 65: return 1  # medium
    else:            return 2  # high

data = {
    'sleep_hours':   np.clip(np.random.normal(6.5, 2.0, N), 0, 12),
    'study_hours':   np.clip(np.random.normal(6.0, 3.5, N), 0, 16),
    'mood_rating':   np.random.randint(1, 11, N),
    'anxiety_level': np.random.randint(1, 11, N),
    'social_score':  np.random.randint(1, 11, N),
}

df = pd.DataFrame(data)
df['sleep_hours']  = df['sleep_hours'].round(1)
df['study_hours']  = df['study_hours'].round(1)
df['stress_level'] = df.apply(generate_stress_label, axis=1)

out = os.path.join(os.path.dirname(__file__), 'synthetic_data.csv')
df.to_csv(out, index=False)

print(f"Generated {len(df)} records")
print(df['stress_level'].value_counts().rename({0:'low', 1:'medium', 2:'high'}))
print(f"Saved to: {out}")
