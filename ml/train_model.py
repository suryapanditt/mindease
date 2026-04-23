import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report

BASE = os.path.dirname(__file__)

synthetic_path = os.path.join(BASE, 'synthetic_data.csv')
kaggle_path    = os.path.join(BASE, 'kaggle_data.csv')

dfs = [pd.read_csv(synthetic_path)]

if os.path.exists(kaggle_path):
    kaggle_df = pd.read_csv(kaggle_path)
    col_map = {
        'sleep_duration': 'sleep_hours',
        'study_load':     'study_hours',
        'mood':           'mood_rating',
        'anxiety':        'anxiety_level',
        'social':         'social_score',
        'stress':         'stress_level'
    }
    kaggle_df.rename(columns=col_map, inplace=True)
    dfs.append(kaggle_df)
    print(f"Kaggle data loaded: {len(kaggle_df)} records")

df = pd.concat(dfs, ignore_index=True)
print(f"Total records: {len(df)}")

FEATURES = ['sleep_hours', 'study_hours', 'mood_rating', 'anxiety_level', 'social_score']
TARGET   = 'stress_level'

df.dropna(subset=FEATURES + [TARGET], inplace=True)

X = df[FEATURES]
y = df[TARGET]

print("\nClass distribution:")
print(y.value_counts().rename({0:'low', 1:'medium', 2:'high'}))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

print("\n--- Logistic Regression ---")
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train_sc, y_train)
lr_preds = lr.predict(X_test_sc)
lr_acc = accuracy_score(y_test, lr_preds)
print(f"Accuracy: {lr_acc:.4f}")

print("\n--- Random Forest ---")
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    random_state=42
)
rf.fit(X_train, y_train)
rf_preds = rf.predict(X_test)
rf_acc = accuracy_score(y_test, rf_preds)
print(f"Accuracy: {rf_acc:.4f}")
print("\nClassification Report:")
print(classification_report(
    y_test, rf_preds,
    target_names=['Low', 'Medium', 'High']
))

print("\nFeature Importances:")
for feat, imp in sorted(
    zip(FEATURES, rf.feature_importances_),
    key=lambda x: x[1], reverse=True
):
    print(f"  {feat:20s}: {imp:.4f}")

model_path  = os.path.join(BASE, 'model.pkl')
scaler_path = os.path.join(BASE, 'scaler.pkl')

with open(model_path, 'wb') as f:
    pickle.dump(rf, f)

with open(scaler_path, 'wb') as f:
    pickle.dump(scaler, f)

print(f"\nModel saved  → {model_path}")
print(f"Scaler saved → {scaler_path}")
print(f"\nRandom Forest Accuracy : {rf_acc:.2%}")
print(f"Logistic Regression Acc: {lr_acc:.2%}")
print(f"Improvement            : +{(rf_acc - lr_acc):.2%}")
