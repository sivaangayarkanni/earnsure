import random

import joblib
from sklearn.ensemble import RandomForestClassifier

from .fraud_model_store import FRAUD_MODEL_PATH


def generate_data(samples=800):
    X = []
    y = []
    for _ in range(samples):
        features = [random.random() for _ in range(6)]
        risk = (
            features[0] * 0.25
            + features[1] * 0.2
            + features[2] * 0.2
            + features[3] * 0.15
            + features[4] * 0.15
            + features[5] * 0.05
        )
        label = 1 if risk > 0.55 else 0
        X.append(features)
        y.append(label)
    return X, y


def train_and_save():
    X, y = generate_data()
    model = RandomForestClassifier(n_estimators=120, random_state=42)
    model.fit(X, y)
    joblib.dump(model, FRAUD_MODEL_PATH)
    return FRAUD_MODEL_PATH


if __name__ == "__main__":
    path = train_and_save()
    print(f"Saved fraud model to {path}")
